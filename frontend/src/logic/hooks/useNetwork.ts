import { useNetworkStore } from "../stores/useNetworkStore";
import type { Node, NodeMouseHandler, NodeTypes } from "@xyflow/react";
import type { NetworkNodeData } from "../../helpers/types/types";
import { useCallback, useMemo } from "react";
import { ServerNode } from "../../components/ui/nodes/ServerNode";
import { SwitchNode } from "../../components/ui/nodes/SwitchNode";
import { IndustrialNode } from "../../components/ui/nodes/IndustrialNode";
import { useShallow } from "zustand/shallow";

export const useNetwork = () => {
  const { nodes, edges, selectedNode, setSelectedNode } = useNetworkStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      selectedNode: state.selectedNode,
      setSelectedNode: state.setSelectedNode,
    })),
  );

  const selectNode = useCallback(
    (node: Node<NetworkNodeData> | null) => {
      setSelectedNode(node);
    },
    [setSelectedNode],
  );

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      server: ServerNode,
      switch: SwitchNode,
      industrial: IndustrialNode,
    }),
    [],
  );

  const onNodeClick = useCallback<NodeMouseHandler<Node<NetworkNodeData>>>(
    (_event, node) => {
      selectNode(node);
    },
    [selectNode],
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const defaultEdgeOptions = useMemo(
    () => ({
      style: { stroke: "#64748b", strokeWidth: 2 },
      type: "smoothstep",
    }),
    [],
  );

  return {
    nodes,
    edges,
    selectedNode,
    selectNode,
    clearSelection,
    nodeTypes,
    onNodeClick,
    onPaneClick,
    defaultEdgeOptions,
  };
};
