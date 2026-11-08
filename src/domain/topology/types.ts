export type TopologyNodeType = "SERVICE" | "RESOURCE";
export type TopologyRelationType = "BINDING" | "DEPENDENCY";

export interface TopologyNode {
  id: string;
  type: TopologyNodeType;
  slug: string;
  name: string;
  sub_type?: string;
  metadata?: Record<string, unknown>;
}

export interface TopologyEdge {
  id: string;
  source_id: string;
  target_id: string;
  relation_type?: TopologyRelationType;
  type?: TopologyRelationType;
  label?: string;
  protocol?: string;
  metadata?: Record<string, unknown>;
}

export interface TopologyGraph {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}
