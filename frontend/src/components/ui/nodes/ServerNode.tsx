import type { NodeProps } from "@xyflow/react";
import { Server } from "lucide-react";
import { NetworkNode } from "../NetworkNode";
import type { NetworkNodeData } from "../../../helpers/types/types";

export const ServerNode = ({ data, selected }: NodeProps) => {
  const { label, status, ip } = data as NetworkNodeData;

  return (
    <NetworkNode
      label={label}
      status={status}
      ip={ip}
      selected={selected}
      icon={Server}
    />
  );
};
