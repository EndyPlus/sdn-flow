import type { Node, NodeProps } from "@xyflow/react";
import { Network } from "lucide-react";
import { NodeElement } from "../NodeElement";
import type { NetworkNodeData } from "../../../../helpers/types/types";

export const SwitchNode = ({
  data,
  selected,
}: NodeProps<Node<NetworkNodeData>>) => {
  const { label, status, ip } = data;

  return (
    <NodeElement
      label={label}
      status={status}
      ip={ip}
      selected={selected}
      icon={Network}
    />
  );
};
