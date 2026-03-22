import type { StatsCardProps } from "../../helpers/types/types";

export const StatsCard = ({
  icon: Icon,
  label,
  value,
  variant = "default",
}: StatsCardProps) => {
  const variants = {
    default: "bg-slate-800",
    success: "bg-green-950",
    danger: "bg-red-950",
  };

  const textColors = {
    default: "text-white",
    success: "text-green-400",
    danger: "text-red-400",
  };

  const labelColors = {
    default: "text-slate-300",
    success: "text-green-300",
    danger: "text-red-300",
  };

  const iconColors = {
    default: "text-slate-400",
    success: "text-green-400",
    danger: "text-red-400",
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-2 ${variants[variant]}`}
    >
      <Icon className={`h-5 w-5 ${iconColors[variant]}`} />
      <span className={`text-sm font-medium ${labelColors[variant]}`}>
        {label}:
      </span>
      <span className={`text-lg font-bold ${textColors[variant]}`}>
        {value}
      </span>
    </div>
  );
};
