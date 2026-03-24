import { getNetworkNodeStyles } from "../../helpers/utils/getNetworkNodeStyles";
import type { Status } from "../../helpers/types/types";
import { useNetworkStore } from "../stores/useNetworkStore";

export const useNodeElement = (id: string, status: Status) => {
  const { elementStatusColor, iconColor } = getNetworkNodeStyles(status);

  const selectedNode = useNetworkStore((state) => state.selectedNode);

  const selected = id === selectedNode?.id;

  return { elementStatusColor, iconColor, selected };
};
