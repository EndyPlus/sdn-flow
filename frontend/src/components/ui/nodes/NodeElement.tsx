import { Handle, Position } from "@xyflow/react";
import type { NetworkNodeProps } from "../../../helpers/types/types";
import { getNetworkNodeStyles } from "../../../helpers/utils/getNetworkNodeStyles";

export const NodeElement = ({
  label,
  status,
  ip,
  load,
  selected,
  icon: Icon,
}: NetworkNodeProps) => {
  const { elementStatusColor, iconColor } = getNetworkNodeStyles(status);

  return (
    <div
      className={`rounded-lg border-2 bg-slate-800 px-6 py-4 shadow-lg transition-all ${
        elementStatusColor
      } ${selected ? "ring-2 ring-blue-400" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="bg-slate-600!" />

      <div className="flex items-center gap-3">
        <Icon className={`h-12 w-12 ${iconColor}`} />
        <div className="flex flex-col gap-1">
          <div className="text-lg font-semibold text-white">{label}</div>
          {ip && <div className="text-white">{ip}</div>}
          {load !== undefined && (
            <div className="text-white">Load: {load}%</div>
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
