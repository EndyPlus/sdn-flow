import { create } from "zustand";
import type { NetworkState } from "../../helpers/types/types";

export const useNetworkStore = create<NetworkState>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  updateNodesAndEdges: (nodes, edges) => set({ nodes, edges }),
}));
