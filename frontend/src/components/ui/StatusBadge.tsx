import type { StatusBadgeProps } from "../../helpers/types/types";

export const StatusBadge = ({ icon: Icon, label, count }: StatusBadgeProps) => {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="text-xs text-slate-400">
        {label}: {count}
      </span>
    </div>
  );
};
