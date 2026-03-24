import type { Variant } from "../types/types";

export const getStatsCardStyles = (variant: Variant) => {
  const variantColors = {
    default: "bg-slate-800",
    success: "bg-green-950",
    danger: "bg-red-950",
    info: "bg-blue-950",
  };

  const textColors = {
    default: "text-white",
    success: "text-green-400",
    danger: "text-red-400",
    info: "text-blue-400",
  };

  const labelColors = {
    default: "text-slate-300",
    success: "text-green-300",
    danger: "text-red-300",
    info: "text-blue-300",
  };

  const iconColors = {
    default: "text-slate-400",
    success: "text-green-400",
    danger: "text-red-400",
    info: "text-blue-400",
  };

  const variantColor = variantColors[variant];
  const textColor = textColors[variant];
  const labelColor = labelColors[variant];
  const iconColor = iconColors[variant];

  return {
    variantColor,
    textColor,
    labelColor,
    iconColor,
  };
};
