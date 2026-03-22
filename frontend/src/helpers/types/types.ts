import type { Node, Edge } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";

export interface NetworkNodeData extends Record<string, unknown> {
  label: string;
  status: "online" | "offline" | "warning";
  ip?: string;
  load?: number;
  latency?: number;
  uptime?: number;
}

export interface NetworkState {
  nodes: Node<NetworkNodeData>[];
  edges: Edge[];
  selectedNode: Node<NetworkNodeData> | null;
  setNodes: (nodes: Node<NetworkNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: Node<NetworkNodeData> | null) => void;
  updateNodesAndEdges: (nodes: Node<NetworkNodeData>[], edges: Edge[]) => void;
}

export interface TopologyResponse {
  nodes: Node<NetworkNodeData>[];
  edges: Edge[];
}

export interface NetworkNodeProps {
  label: string;
  status: "online" | "offline" | "warning";
  ip?: string;
  load?: number;
  selected?: boolean;
  icon: LucideIcon;
}

export interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  variant?: "default" | "success" | "danger";
}

export interface StatusBadgeProps {
  icon: LucideIcon;
  label: string;
  count: number;
}
