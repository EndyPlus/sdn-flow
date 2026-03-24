import type { Node, Edge } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";

export type Status = "online" | "offline" | "warning" | "rebooting";
export type Variant = "default" | "success" | "danger" | "info";

export interface NetworkNodeData extends Record<string, unknown> {
  label: string;
  status: Status;
  ip?: string;
  load?: number;
  latency?: number;
  uptime?: number;
}

export interface NodesEdges {
  nodes: Node<NetworkNodeData>[];
  edges: Edge[];
}

export interface NetworkState extends NodesEdges {
  selectedNode: Node<NetworkNodeData> | null;
  lastUpdated: Date | null;
  setSelectedNode: (node: Node<NetworkNodeData> | null) => void;
  updateNodesAndEdges: (nodes: Node<NetworkNodeData>[], edges: Edge[]) => void;
}

export interface NodeInspectorProps {
  selectedNode: Node<NetworkNodeData>;
  clearSelection: () => void;
}

interface BaseCardProps {
  icon: LucideIcon;
  label: string;
}

export interface NetworkNodeProps extends BaseCardProps {
  id: string;
  status: Status;
  ip?: string;
  load?: number;
  selected?: boolean;
}

export interface StatsCardProps extends BaseCardProps {
  value: number;
  variant?: Variant;
}

export interface StatusBadgeProps extends BaseCardProps {
  count: number;
  status: Status;
}
