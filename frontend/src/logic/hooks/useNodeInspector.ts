import { Cpu, Network, Server } from "lucide-react";
import { getNetworkNodeStyles } from "../../helpers/utils/getNetworkNodeStyles";
import type { Node } from "@xyflow/react";
import type { NetworkNodeData } from "../../helpers/types/types";

export const useNodeInspector = (selectedNode: Node<NetworkNodeData>) => {
  const {
    data: nodeData,
    id: nodeId,
    position: nodePosition,
    type: nodeType,
  } = selectedNode;

  const {
    label: nodeDataLabel,
    status: nodeDataStatus,
    ip: nodeDataIp,
    load: nodeDataLoad,
    latency: nodeDataLatency,
    uptime: nodeDataUptime,
  } = nodeData;

  const nodeTypeIcons = {
    server: Server,
    switch: Network,
    industrial: Cpu,
  };

  const Icon = nodeTypeIcons[nodeType as keyof typeof nodeTypeIcons] || Cpu;

  const { inspectorStatusColor } = getNetworkNodeStyles(nodeDataStatus);

  return {
    nodeId,
    nodePosition,
    nodeType,
    nodeDataLabel,
    nodeDataStatus,
    nodeDataIp,
    nodeDataLoad,
    nodeDataLatency,
    nodeDataUptime,
    Icon,
    inspectorStatusColor,
  };
};
