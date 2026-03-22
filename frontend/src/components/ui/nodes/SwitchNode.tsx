import type { NodeProps } from "@xyflow/react";
import { Network } from "lucide-react";
import { NetworkNode } from "../NetworkNode";
import type { NetworkNodeData } from "../../../helpers/types/types";

export const SwitchNode = ({ data, selected }: NodeProps) => {
  const { label, status, ip } = data as NetworkNodeData;

  return (
    <NetworkNode
      label={label}
      status={status}
      ip={ip}
      selected={selected}
      icon={Network}
    />
  );
};
