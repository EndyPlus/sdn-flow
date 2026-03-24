import type { Node, NodeProps } from "@xyflow/react";
import { Server } from "lucide-react";
import { NodeElement } from "../NodeElement";
import type { NetworkNodeData } from "../../../../helpers/types/types";

export const ServerNode = ({ data, id }: NodeProps<Node<NetworkNodeData>>) => {
  const { label, status, ip } = data;

  return (
    <NodeElement id={id} label={label} status={status} ip={ip} icon={Server} />
  );
};
