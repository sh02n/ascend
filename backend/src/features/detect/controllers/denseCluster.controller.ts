import type { NormalizedDataset } from "../types/DatasetRecord.js";
import type { DenseClusterContext } from "../types/DenseClusterContext.js";
import { getDataset } from "../repositories/dataset.repository.js";

const DENSE_CLUSTER_SCORE = 21;
const DENSITY_THRESHOLD = 0.7;

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

function confidenceForDensity(density: number) {
  if (density >= 0.8) {
    return 0.89;
  }

  if (density >= 0.6) {
    return 0.8;
  }

  if (density >= 0.4) {
    return 0.6;
  }

  return 0;
}

function buildAdjacencyMap(nodeIds: string[], edges: Array<{ sourceNodeId: string; targetNodeId: string }>) {
  const adjacency = new Map<string, Set<string>>();

  for (const nodeId of nodeIds) {
    adjacency.set(nodeId, new Set<string>());
  }

  for (const edge of edges) {
    if (!adjacency.has(edge.sourceNodeId) || !adjacency.has(edge.targetNodeId)) {
      continue;
    }

    adjacency.get(edge.sourceNodeId)?.add(edge.targetNodeId);
    adjacency.get(edge.targetNodeId)?.add(edge.sourceNodeId);
  }

  return adjacency;
}

function findLargestConnectedComponent(adjacency: Map<string, Set<string>>) {
  const visited = new Set<string>();
  let largestComponent: string[] = [];

  for (const nodeId of adjacency.keys()) {
    if (visited.has(nodeId)) {
      continue;
    }

    const component: string[] = [];
    const stack = [nodeId];
    visited.add(nodeId);

    while (stack.length > 0) {
      const currentNodeId = stack.pop();

      if (!currentNodeId) {
        continue;
      }

      component.push(currentNodeId);

      for (const neighborId of adjacency.get(currentNodeId) ?? []) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          stack.push(neighborId);
        }
      }
    }

    if (component.length > largestComponent.length) {
      largestComponent = component;
    }
  }

  return largestComponent.sort();
}

export function detectDenseClusterFromDataset(dataset: NormalizedDataset): DenseClusterContext {
  const nodeIds = dataset.graph.nodes.map((node) => node.id);
  const edgeCount = dataset.graph.edges.length;
  const nodeCount = nodeIds.length;
  const possibleDirectedEdges = nodeCount * (nodeCount - 1);
  const density = possibleDirectedEdges > 0 ? edgeCount / possibleDirectedEdges : 0;
  const adjacency = buildAdjacencyMap(nodeIds, dataset.graph.edges);
  const largestComponentNodeIds = findLargestConnectedComponent(adjacency);
  const detected = density > DENSITY_THRESHOLD;
  const roundedDensity = roundMetric(density);

  return {
    detected,
    score: detected ? DENSE_CLUSTER_SCORE : 0,
    confidence: detected ? confidenceForDensity(density) : 0,
    summary: detected
      ? "Entity relationships formed unusually dense connections"
      : "No dense cluster pattern found",
    metrics: {
      density: roundedDensity,
      nodes: nodeCount,
      edges: edgeCount,
      largestComponent: largestComponentNodeIds.length,
    },
    evidence: detected ? ["cluster_001"] : [],
    largestComponentNodeIds,
  };
}

export async function detectDenseCluster(
  dataset?: NormalizedDataset,
): Promise<DenseClusterContext> {
  const detectionDataset = dataset ?? (await getDataset());

  return detectDenseClusterFromDataset(detectionDataset);
}
