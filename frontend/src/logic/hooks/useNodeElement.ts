import { getNetworkNodeStyles } from "../../helpers/utils/getNetworkNodeStyles";
import type { Status } from "../../helpers/types/types";
import { useNetworkStore } from "../stores/useNetworkStore";
import { Loader, type LucideIcon } from "lucide-react";

export const useNodeElement = (
  id: string,
  status: Status,
  icon: LucideIcon,
) => {
  const { elementStatusColor, iconColor } = getNetworkNodeStyles(status);

  const selectedNode = useNetworkStore((state) => state.selectedNode);

  const selected = id === selectedNode?.id;

  const isRebooting = status === "rebooting";
  const DisplayIcon = isRebooting ? Loader : icon;

  return {
    elementStatusColor,
    iconColor,
    selected,
    DisplayIcon,
    isRebooting,
  };
};
