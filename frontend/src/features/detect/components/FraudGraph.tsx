import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DetectorKey, SignalResponse } from "../types";

interface FraudGraphProps {
  signals?: SignalResponse;
}

const detectorLabels: Record<DetectorKey, string> = {
  sharedResource: "Shared Resource",
  reviewRing: "Review Ring",
  refundAbuse: "Refund Abuse",
  temporalBurst: "Temporal Burst",
  denseCluster: "Dense Cluster",
};

type GraphViewport = "mobile" | "tablet" | "desktop";

const detectorOrder: DetectorKey[] = [
  "sharedResource",
  "reviewRing",
  "refundAbuse",
  "temporalBurst",
  "denseCluster",
];

function getViewport(width: number): GraphViewport {
  if (width < 640) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

function getNodeLimit(viewport: GraphViewport) {
  if (viewport === "mobile") {
    return 100;
  }

  if (viewport === "tablet") {
    return 250;
  }

  return 500;
}

function createPosition(index: number, total: number, radius: number, centerX = 0, centerY = 0) {
  const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2;

  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

export function FraudGraph({ signals }: FraudGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>("Select a node");
  const [viewport, setViewport] = useState<GraphViewport>(() =>
    typeof window === "undefined" ? "desktop" : getViewport(window.innerWidth),
  );
  const [graphOpen, setGraphOpen] = useState(() =>
    typeof window === "undefined" ? true : getViewport(window.innerWidth) !== "mobile",
  );
  const [expandedDetectors, setExpandedDetectors] = useState<Set<DetectorKey>>(new Set());

  useEffect(() => {
    function handleResize() {
      const nextViewport = getViewport(window.innerWidth);
      setViewport(nextViewport);
      setGraphOpen((currentOpen) => currentOpen || nextViewport !== "mobile");
      graphRef.current?.resize();
      graphRef.current?.fit(undefined, 24);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const elements = useMemo<ElementDefinition[]>(() => {
    if (!signals) {
      return [];
    }

    const nodeLimit = getNodeLimit(viewport);
    const evidenceBudget = Math.max(nodeLimit - 1 - detectorOrder.length, 0);
    const detectedDetectors = [...detectorOrder].sort((left, right) => {
      const leftContext = signals.reasoningContext[left];
      const rightContext = signals.reasoningContext[right];

      return Number(rightContext.detected) - Number(leftContext.detected) ||
        rightContext.score * rightContext.confidence - leftContext.score * leftContext.confidence;
    });
    const evidenceLimitPerDetector = Math.max(1, Math.floor(evidenceBudget / detectorOrder.length));
    const graphElements: ElementDefinition[] = [
      {
        data: {
          id: signals.cluster.id,
          label: signals.cluster.id,
          type: "cluster",
        },
        position: { x: 0, y: 0 },
      },
    ];

    detectedDetectors.forEach((key, detectorIndex) => {
      const context = signals.reasoningContext[key];
      const detectorId = `detector-${key}`;
      const detectorPosition = createPosition(detectorIndex, detectedDetectors.length, 190);
      const isExpanded = expandedDetectors.has(key);
      const evidenceItems = isExpanded
        ? context.evidence.slice(0, evidenceLimitPerDetector)
        : context.evidence.slice(0, Math.min(3, evidenceLimitPerDetector));
      const remainingEvidence = Math.max(context.evidence.length - evidenceItems.length, 0);

      graphElements.push({
        data: {
          id: detectorId,
          label: detectorLabels[key],
          type: context.detected ? "detected" : "clear",
          detectorKey: key,
        },
        position: detectorPosition,
      });
      graphElements.push({
        data: {
          id: `edge-${signals.cluster.id}-${detectorId}`,
          source: signals.cluster.id,
          target: detectorId,
        },
      });

      evidenceItems.forEach((evidence, evidenceIndex) => {
        const evidenceId = `evidence-${key}-${evidenceIndex}`;
        const evidencePosition = createPosition(
          evidenceIndex,
          Math.max(evidenceItems.length + Number(remainingEvidence > 0), 1),
          92,
          detectorPosition.x,
          detectorPosition.y,
        );

        graphElements.push({
          data: {
            id: evidenceId,
            label: evidence,
            type: "evidence",
          },
          position: evidencePosition,
        });
        graphElements.push({
          data: {
            id: `edge-${detectorId}-${evidenceId}`,
            source: detectorId,
            target: evidenceId,
          },
        });
      });

      if (remainingEvidence > 0) {
        const groupId = `group-${key}`;
        const groupPosition = createPosition(
          evidenceItems.length,
          evidenceItems.length + 1,
          92,
          detectorPosition.x,
          detectorPosition.y,
        );

        graphElements.push({
          data: {
            id: groupId,
            label: `${remainingEvidence} more`,
            type: "group",
            detectorKey: key,
          },
          position: groupPosition,
        });
        graphElements.push({
          data: {
            id: `edge-${detectorId}-${groupId}`,
            source: detectorId,
            target: groupId,
          },
        });
      }
    });

    return graphElements;
  }, [expandedDetectors, signals, viewport]);

  useEffect(() => {
    if (!containerRef.current || (viewport === "mobile" && !graphOpen)) {
      graphRef.current?.destroy();
      graphRef.current = null;
      return;
    }

    const startedAt = performance.now();
    graphRef.current?.destroy();

    graphRef.current = cytoscape({
      container: containerRef.current,
      elements,
      minZoom: 0.4,
      maxZoom: 2.5,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#38bdf8",
            color: "#94A0BE",
            label: "data(label)",
            "font-size": 10,
            "text-max-width": "120px",
            "text-wrap": "wrap",
            "text-valign": "bottom",
            "text-margin-y": 8,
            width: 28,
            height: 28,
          },
        },
        {
          selector: "node[type = 'cluster']",
          style: {
            "background-color": "#4C82FF",
            color: "#EDEFF8",
            width: 42,
            height: 42,
          },
        },
        {
          selector: "node[type = 'detected']",
          style: {
            "background-color": "#FF5C7A",
          },
        },
        {
          selector: "node[type = 'clear']",
          style: {
            "background-color": "#7C88AA",
          },
        },
        {
          selector: "node[type = 'evidence']",
          style: {
            "background-color": "#FFB454",
            color: "#FFB454",
            width: 20,
            height: 20,
          },
        },
        {
          selector: "node[type = 'group']",
          style: {
            "background-color": "#36D6A0",
            color: "#36D6A0",
            width: 24,
            height: 24,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#2C3754",
            "target-arrow-color": "#2C3754",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
        {
          selector: ".highlighted",
          style: {
            "line-color": "#4C82FF",
            "target-arrow-color": "#4C82FF",
            width: 3,
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-width": 2,
            "border-color": "#EDEFF8",
          },
        },
        {
          selector: ".selected",
          style: {
            "border-width": 3,
            "border-color": "#EDEFF8",
          },
        },
      ],
      layout: {
        name: "preset",
        animate: false,
        fit: true,
        padding: 24,
      },
      hideEdgesOnViewport: true,
      textureOnViewport: true,
      wheelSensitivity: 0.25,
    });

    graphRef.current.on("tap", "node", (event) => {
      graphRef.current?.elements().removeClass("selected");
      event.target.addClass("selected");
      setSelectedNode(event.target.data("label") ?? event.target.id());

      const detectorKey = event.target.data("detectorKey") as DetectorKey | undefined;

      if (detectorKey) {
        setExpandedDetectors((current) => {
          const next = new Set(current);
          next.add(detectorKey);
          return next;
        });
      }
    });
    graphRef.current.on("mouseover", "node", (event) => {
      const node = event.target;
      node.connectedEdges().addClass("highlighted");
      node.neighborhood("node").addClass("highlighted");
    });
    graphRef.current.on("mouseout", "node", (event) => {
      const node = event.target;
      node.connectedEdges().removeClass("highlighted");
      node.neighborhood("node").removeClass("highlighted");
    });
    window.requestAnimationFrame(() => {
      console.info(
        `[Detect UI] graph render ${Math.round(performance.now() - startedAt)}ms nodes=${graphRef.current?.nodes().length ?? 0} limit=${getNodeLimit(viewport)}`,
      );
    });

    return () => {
      graphRef.current?.destroy();
      graphRef.current = null;
    };
  }, [elements, graphOpen, viewport]);

  if (!signals) {
    return (
      <section className="overflow-hidden rounded-[18px] border border-[#202A42] bg-gradient-to-b from-[#10162A] to-[#0B0F1B]">
        <div className="border-b border-[#161E30] px-5 py-4">
          <div className="h-5 w-36 animate-pulse rounded bg-[#161E36]" />
        </div>
        <div className="h-[420px] animate-pulse bg-[#0B0F1B]" />
      </section>
    );
  }

  if (elements.length <= 1) {
    return (
      <section className="overflow-hidden rounded-[18px] border border-[#202A42] bg-gradient-to-b from-[#10162A] to-[#0B0F1B]">
        <div className="border-b border-[#161E30] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#EDEFF8]">Evidence Graph</h2>
        </div>
        <div className="flex h-80 items-center justify-center text-sm text-[#586383]">
          No relationship evidence returned for this cluster
        </div>
      </section>
    );
  }

  if (viewport === "mobile" && !graphOpen) {
    return (
      <section className="rounded-[18px] border border-[#202A42] bg-gradient-to-b from-[#10162A] to-[#0B0F1B] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#EDEFF8]">Evidence Graph</h2>
            <p className="text-xs text-[#586383]">Collapsed on mobile to protect memory</p>
          </div>
          <button
            type="button"
            onClick={() => setGraphOpen(true)}
            className="rounded-[10px] border border-[#4C82FF]/50 bg-[#4C82FF]/15 px-4 py-2 text-sm font-semibold text-[#EDEFF8]"
          >
            Show Graph
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[18px] border border-[#202A42] bg-gradient-to-b from-[#10162A] to-[#0B0F1B]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#161E30] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#EDEFF8]">Evidence Graph</h2>
          <p className="mt-1 text-xs text-[#586383]">
            {signals.cluster.id} · pan, zoom and select nodes · {getNodeLimit(viewport)} node cap
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.2)}
            className="rounded-lg border border-[#202A42] px-3 py-1.5 text-xs font-semibold text-[#94A0BE] hover:border-[#4C82FF]/50 hover:text-[#EDEFF8]"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 0.8)}
            className="rounded-lg border border-[#202A42] px-3 py-1.5 text-xs font-semibold text-[#94A0BE] hover:border-[#4C82FF]/50 hover:text-[#EDEFF8]"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => graphRef.current?.fit(undefined, 32)}
            className="rounded-lg border border-[#202A42] px-3 py-1.5 text-xs font-semibold text-[#94A0BE] hover:border-[#4C82FF]/50 hover:text-[#EDEFF8]"
          >
            Center
          </button>
        </div>
      </div>
      <div className="relative border-b border-[#161E30] bg-[radial-gradient(circle_at_50%_42%,rgba(76,130,255,.13),transparent_62%)]">
        <div ref={containerRef} className="h-[420px]" />
        <div className="absolute bottom-4 left-4 space-y-1.5 rounded-[9px] border border-[#161E30] bg-[#0B0F1B]/80 p-3 text-[11px] text-[#586383] backdrop-blur">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#4C82FF]" />cluster center</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#FF5C7A]" />detected signal</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#FFB454]" />evidence</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#7C88AA]" />clear pattern</div>
        </div>
      </div>
      <div className="flex items-center gap-3 px-5 py-3 text-xs text-[#94A0BE]">
        <span className="rounded-lg border border-[#202A42] bg-[#161E36] px-2.5 py-1 font-mono text-[11px] text-[#EDEFF8]">
          node
        </span>
        <span className="truncate">{selectedNode}</span>
      </div>
    </section>
  );
}
