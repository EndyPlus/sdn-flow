import "@xyflow/react/dist/style.css";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import { useNetwork } from "../../logic/hooks/useNetwork";
import { useNetworkData } from "../../logic/hooks/useNetworkData";

export const NetworkCanvas = () => {
  const {
    nodes,
    edges,
    nodeTypes,
    onNodeClick,
    onPaneClick,
    defaultEdgeOptions,
  } = useNetwork();

  useNetworkData();

  return (
    <div className="h-full w-full flex-1 bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1}
      >
        <Background color="#334155" gap={16} size={1} />
        <Controls className="shadow-sm" />
      </ReactFlow>
    </div>
  );
};
