import type { StatsCardProps } from "../../helpers/types/types";
import { getStatsCardStyles } from "../../helpers/utils/getStatsCardStyles";

export const StatsCard = ({
  icon: Icon,
  label,
  value,
  variant = "default",
}: StatsCardProps) => {
  const { variantColor, textColor, labelColor, iconColor } =
    getStatsCardStyles(variant);

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-2 ${variantColor}`}
    >
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <span className={`text-sm font-medium ${labelColor}`}>{label}:</span>
      <span className={`text-lg font-bold ${textColor}`}>{value}</span>
    </div>
  );
};
