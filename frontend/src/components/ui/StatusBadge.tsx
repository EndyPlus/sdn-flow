import type { StatusBadgeProps } from "../../helpers/types/types";
import { getNetworkNodeStyles } from "../../helpers/utils/getNetworkNodeStyles";

export const StatusBadge = ({
  icon: Icon,
  label,
  status,
  count,
}: StatusBadgeProps) => {
  const { iconColor } = getNetworkNodeStyles(status);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1">
      <Icon className={`h-4 w-4 ${iconColor} animate-pulse`} />
      <span className="text-slate-400">
        {label}: <span className={`${iconColor} animate-pulse`}>{count}</span>
      </span>
    </div>
  );
};
