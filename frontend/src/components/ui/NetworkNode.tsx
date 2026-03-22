import { Handle, Position } from "@xyflow/react";
import type { NetworkNodeProps } from "../../helpers/types/types";

export const NetworkNode = ({
  label,
  status,
  ip,
  load,
  selected,
  icon: Icon,
}: NetworkNodeProps) => {
  const statusColors: Record<string, string> = {
    online: "border-green-500 shadow-green-500/50",
    offline: "border-red-500 shadow-red-500/50 grayscale",
    warning: "border-yellow-500 shadow-yellow-500/50 animate-pulse",
  };

  const iconColors: Record<string, string> = {
    online: "text-green-400",
    offline: "text-red-400",
    warning: "text-yellow-400",
  };

  return (
    <div
      className={`rounded-lg border-2 bg-slate-800 px-4 py-3 shadow-lg transition-all ${
        statusColors[status]
      } ${selected ? "ring-2 ring-blue-400" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="bg-slate-600!" />

      <div className="flex items-center gap-3">
        <Icon className={`h-6 w-6 ${iconColors[status]}`} />
        <div>
          <div className="text-sm font-semibold text-white">{label}</div>
          {ip && <div className="text-xs text-slate-400">{ip}</div>}
          {load !== undefined && (
            <div className="text-xs text-slate-400">Load: {load}%</div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-slate-600!"
      />
    </div>
  );
};
