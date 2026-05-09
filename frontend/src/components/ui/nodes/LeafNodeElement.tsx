import { Handle, Position } from "@xyflow/react";
import type { NetworkNodeProps } from "../../../helpers/types/types";
import { getNetworkNodeStyles } from "../../../helpers/utils/getNetworkNodeStyles";

/**
 * LeafNodeElement - For leaf nodes (CNC machines) that only receive connections
 * Has target handle at TOP but NO source handle (cannot send connections)
 */
export const LeafNodeElement = ({
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
      {/* Target handle at TOP - receives connections from parent */}
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

      {/* NO source handle - this is a leaf node */}
    </div>
  );
};
