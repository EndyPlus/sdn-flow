import { useNetwork } from "../../logic/hooks/useNetwork";
import { NodeInspector } from "../ui/NodeInspector";

export const Aside = () => {
  const { selectedNode, clearSelection } = useNetwork();

  if (!selectedNode) return null;

  return (
    <NodeInspector
      selectedNode={selectedNode}
      clearSelection={clearSelection}
    />
  );
};
