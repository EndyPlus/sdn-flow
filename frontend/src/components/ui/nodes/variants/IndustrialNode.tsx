import type { Node, NodeProps } from "@xyflow/react";
import { Cpu } from "lucide-react";
import { NodeElement } from "../NodeElement";
import type { NetworkNodeData } from "../../../../helpers/types/types";

export const IndustrialNode = ({
  data,
  selected,
}: NodeProps<Node<NetworkNodeData>>) => {
  const { label, status, ip, load } = data;

  return (
    <NodeElement
      label={label}
      status={status}
      ip={ip}
      load={load}
      selected={selected}
      icon={Cpu}
    />
  );
};
