import cytoscape, { type Core } from "cytoscape";
import { useEffect, useRef } from "react";
import type { GraphEdge, GraphNode } from "../types";

type GraphCanvasProps = {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
};

const colors: Record<GraphNode["type"], string> = {
  cluster: "#ef4444",
  seller: "#f97316",
  buyer: "#2563eb",
  product: "#7c3aed",
  payment: "#0f766e",
  ip: "#0891b2",
  device: "#4f46e5",
  order: "#ca8a04",
  review: "#db2777",
  refund: "#dc2626",
};

export function GraphCanvas({ nodes = [], edges = [] }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    cyRef.current?.destroy();
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map((node) => ({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            risk: node.risk ?? 40,
          },
        })),
        ...edges.map((edge) => ({
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
          },
        })),
      ],
      layout: {
        name: "concentric",
        fit: true,
        padding: 32,
        minNodeSpacing: 42,
      },
      style: [
        {
          selector: "node",
          style: {
            "background-color": (element) => colors[element.data("type") as GraphNode["type"]],
            "border-color": "#ffffff",
            "border-width": 2,
            color: "#0f172a",
            "font-size": 10,
            "font-weight": 700,
            height: (element) => Math.max(34, Number(element.data("risk")) * 0.58),
            label: "data(label)",
            "overlay-padding": 8,
            shape: "round-rectangle",
            "text-margin-y": -8,
            "text-outline-color": "#ffffff",
            "text-outline-width": 2,
            width: (element) => Math.max(34, Number(element.data("risk")) * 0.58),
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "font-size": 9,
            label: "data(label)",
            "line-color": "#94a3b8",
            "target-arrow-color": "#94a3b8",
            "target-arrow-shape": "triangle",
            "text-background-color": "#f8fafc",
            "text-background-opacity": 0.9,
            "text-background-padding": "2px",
            "text-rotation": "autorotate",
            width: 1.4,
          },
        },
        {
          selector: ":selected",
          style: {
            "border-color": "#111827",
            "border-width": 3,
            "line-color": "#111827",
            "target-arrow-color": "#111827",
          },
        },
      ],
      wheelSensitivity: 0.22,
    });

    return () => {
      cyRef.current?.destroy();
      cyRef.current = null;
    };
  }, [edges, nodes]);

  const legend = Array.from(new Set(nodes.map((node) => node.type)));

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="h-[420px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
      />
      <div className="flex flex-wrap gap-2">
        {legend.map((type) => (
          <span key={type} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors[type] }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
