import type { Status } from "../types/types";

export const getNetworkNodeStyles = (status: Status) => {
  const elementStatusColors = {
    online: "border-green-500 shadow-green-500/50",
    offline: "border-red-500 shadow-red-500/50 grayscale",
    warning: "border-yellow-500 shadow-yellow-500/50 animate-pulse",
  };

  const inspectorStatusColors = {
    online: "text-green-400 bg-green-950 border-green-500",
    offline: "text-red-400 bg-red-950 border-red-500",
    warning: "text-yellow-400 bg-yellow-950 border-yellow-500",
  };

  const iconColors = {
    online: "text-green-400",
    offline: "text-red-400",
    warning: "text-yellow-400",
  };

  const elementStatusColor = elementStatusColors[status];
  const inspectorStatusColor = inspectorStatusColors[status];
  const iconColor = iconColors[status];

  return {
    elementStatusColor,
    inspectorStatusColor,
    iconColor,
  };
};
