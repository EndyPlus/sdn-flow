import type { Node, NodeProps } from "@xyflow/react";
import { Cpu } from "lucide-react";
import { LeafNodeElement } from "../LeafNodeElement";
import type { NetworkNodeData } from "../../../../helpers/types/types";

/**
 * IndustrialNode - CNC machines and industrial equipment
 * Leaf node: only has target handle at TOP (receives connections)
 * No source handle as these are endpoint devices
 */
export const IndustrialNode = ({
  data,
  selected,
}: NodeProps<Node<NetworkNodeData>>) => {
  const { label, status, ip, load } = data;

  return (
    <LeafNodeElement
      label={label}
      status={status}
      ip={ip}
      load={load}
      selected={selected}
      icon={Cpu}
    />
  );
};
