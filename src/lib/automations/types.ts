export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { config: Record<string, unknown> };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface AutomationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AutomationFolder {
  id: string;
  organization_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Automation {
  id: string;
  organization_id: string;
  folder_id: string | null;
  name: string;
  description: string | null;
  enabled: boolean;
  graph: AutomationGraph;
  created_at: string;
  updated_at: string;
}

export const EMPTY_GRAPH: AutomationGraph = { nodes: [], edges: [] };
