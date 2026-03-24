import type { Node, NodeProps } from "@xyflow/react";
import { Network } from "lucide-react";
import { NodeElement } from "../NodeElement";
import type { NetworkNodeData } from "../../../../helpers/types/types";

export const SwitchNode = ({ data, id }: NodeProps<Node<NetworkNodeData>>) => {
  const { label, status, ip } = data;

  return (
    <NodeElement id={id} label={label} status={status} ip={ip} icon={Network} />
  );
};
