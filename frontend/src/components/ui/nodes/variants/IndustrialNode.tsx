import type { Node, NodeProps } from "@xyflow/react";
import { Cpu } from "lucide-react";
import { NodeElement } from "../NodeElement";
import type { NetworkNodeData } from "../../../../helpers/types/types";

export const IndustrialNode = ({
  data,
  id,
}: NodeProps<Node<NetworkNodeData>>) => {
  const { label, status, ip, load } = data;

  return (
    <NodeElement
      id={id}
      label={label}
      status={status}
      ip={ip}
      load={load}
      icon={Cpu}
    />
  );
};
