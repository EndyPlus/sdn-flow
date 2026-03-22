import type { NodeProps } from "@xyflow/react";
import { Cpu } from "lucide-react";
import { NetworkNode } from "../NetworkNode";
import type { NetworkNodeData } from "../../../helpers/types/types";

export const IndustrialNode = ({ data, selected }: NodeProps) => {
  const { label, status, ip, load } = data as NetworkNodeData;

  return (
    <NetworkNode
      label={label}
      status={status}
      ip={ip}
      load={load}
      selected={selected}
      icon={Cpu}
    />
  );
};
