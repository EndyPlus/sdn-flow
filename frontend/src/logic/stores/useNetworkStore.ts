import { create } from "zustand";
import type { NetworkState, StatusNode } from "../../helpers/types/types";

export const useNetworkStore = create<NetworkState>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  updateNodesAndEdges: (nodes, edges) => set({ nodes, edges }),
  updateNodeStatuses: (statusNodes: StatusNode[]) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        const statusNode = statusNodes.find(
          (s: StatusNode) => s.id === node.id,
        );
        if (statusNode) {
          return {
            ...node,
            data: {
              ...node.data,
              status: statusNode.status,
              uptime: statusNode.uptime,
              load: statusNode.load ?? node.data.load,
              latency: statusNode.latency ?? node.data.latency,
            },
          };
        }
        return node;
      }),
    })),
}));
