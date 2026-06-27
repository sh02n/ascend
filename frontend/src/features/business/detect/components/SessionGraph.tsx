import { useMemo, useState } from "react";
import type { SessionDashboard } from "../../../../core/session-flow/session.api";

type SessionGraphProps = {
  graph: SessionDashboard["graph"];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
};

type PositionedNode = SessionDashboard["graph"]["nodes"][number] & {
  x: number;
  y: number;
};

function nodeColor(entityType: string, isSelected: boolean, isNeighbour: boolean) {
  if (isSelected) return "#0f766e";
  if (isNeighbour) return "#14b8a6";
  if (entityType === "SELLER") return "#334155";
  if (entityType === "BUYER") return "#1d4ed8";
  if (entityType === "REFUND") return "#be123c";
  if (entityType === "REVIEW") return "#7c3aed";
  return "#475569";
}

export function SessionGraph({ graph, selectedNodeId, onSelectNode }: SessionGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());
  const visibleNodes = useMemo(
    () => graph.nodes.filter((node) => !collapsedTypes.has(node.entityType)),
    [collapsedTypes, graph.nodes],
  );
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => graph.edges.filter((edge) => visibleNodeIds.has(edge.sourceNodeId) && visibleNodeIds.has(edge.targetNodeId)),
    [graph.edges, visibleNodeIds],
  );
  const neighbours = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();

    return new Set(
      visibleEdges.flatMap((edge) => {
        if (edge.sourceNodeId === selectedNodeId) return [edge.targetNodeId];
        if (edge.targetNodeId === selectedNodeId) return [edge.sourceNodeId];
        return [];
      }),
    );
  }, [selectedNodeId, visibleEdges]);
  const positionedNodes = useMemo<PositionedNode[]>(() => {
    const width = 920;
    const height = 420;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(170, Math.max(92, visibleNodes.length * 6));

    return visibleNodes.map((node, index) => {
      const angle = (index / Math.max(1, visibleNodes.length)) * Math.PI * 2;
      const ringOffset = index % 3 === 0 ? 0.72 : index % 3 === 1 ? 1 : 1.18;

      return {
        ...node,
        x: centerX + Math.cos(angle) * radius * ringOffset,
        y: centerY + Math.sin(angle) * radius * ringOffset,
      };
    });
  }, [visibleNodes]);
  const nodeById = useMemo(() => new Map(positionedNodes.map((node) => [node.id, node])), [positionedNodes]);
  const entityTypes = [...new Set(graph.nodes.map((node) => node.entityType))];

  function toggleEntityType(entityType: string) {
    setCollapsedTypes((current) => {
      const next = new Set(current);
      if (next.has(entityType)) next.delete(entityType);
      else next.add(entityType);
      return next;
    });
  }

  if (graph.nodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="font-semibold text-slate-900">No graph entities available</p>
        <p className="mt-2 text-sm text-slate-500">Run detection again after importing a dataset with buyer, seller, order, review, or refund fields.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <svg viewBox="0 0 920 420" className="h-[420px] w-full" role="img" aria-label="Investigation node graph">
          <g transform={`translate(${(1 - zoom) * 460} ${(1 - zoom) * 210}) scale(${zoom})`}>
            {visibleEdges.map((edge) => {
              const source = nodeById.get(edge.sourceNodeId);
              const target = nodeById.get(edge.targetNodeId);

              if (!source || !target) return null;

              const highlighted =
                selectedNodeId &&
                (edge.sourceNodeId === selectedNodeId ||
                  edge.targetNodeId === selectedNodeId ||
                  (neighbours.has(edge.sourceNodeId) && neighbours.has(edge.targetNodeId)));

              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={highlighted ? "#14b8a6" : "#cbd5e1"}
                  strokeWidth={highlighted ? 2.4 : 1.2}
                />
              );
            })}
            {positionedNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const isNeighbour = neighbours.has(node.id);

              return (
                <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
                  <button type="button" onClick={() => onSelectNode(node.id)} className="contents">
                    <circle
                      r={isSelected ? 15 : 11}
                      fill={nodeColor(node.entityType, isSelected, isNeighbour)}
                      stroke={isSelected ? "#99f6e4" : "#ffffff"}
                      strokeWidth={isSelected ? 4 : 2}
                    />
                    <text
                      x={16}
                      y={4}
                      className="pointer-events-none select-none fill-slate-700 text-[10px] font-medium"
                    >
                      {node.label.slice(0, 22)}
                    </text>
                  </button>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setZoom(1)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          Center graph
        </button>
        <button type="button" onClick={() => setZoom((value) => Math.min(2, value + 0.15))} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          Zoom in
        </button>
        <button type="button" onClick={() => setZoom((value) => Math.max(0.6, value - 0.15))} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          Zoom out
        </button>
        {entityTypes.map((entityType) => (
          <button
            key={entityType}
            type="button"
            onClick={() => toggleEntityType(entityType)}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              collapsedTypes.has(entityType)
                ? "border-slate-200 bg-white text-slate-400"
                : "border-teal-200 bg-teal-50 text-teal-800"
            }`}
          >
            {collapsedTypes.has(entityType) ? "Expand" : "Collapse"} {entityType}
          </button>
        ))}
      </div>
    </div>
  );
}
