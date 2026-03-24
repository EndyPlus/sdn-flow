import { Handle, Position } from "@xyflow/react";
import type { NetworkNodeProps } from "../../../helpers/types/types";
import { useNodeElement } from "../../../logic/hooks/useNodeElement";

export const NodeElement = ({
  id,
  label,
  status,
  ip,
  load,
  icon,
}: NetworkNodeProps) => {
  const { elementStatusColor, iconColor, selected, DisplayIcon, isRebooting } =
    useNodeElement(id, status, icon);

  return (
    <div
      className={`rounded-lg border-2 bg-slate-800 px-6 py-4 shadow-lg transition-all ${
        elementStatusColor
      } ${selected ? "ring-4 ring-slate-400" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="bg-slate-600!" />

      <div className="flex items-center gap-3">
        <DisplayIcon
          className={`h-12 w-12 ${iconColor} ${isRebooting ? "animate-spin" : ""}`}
        />
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
