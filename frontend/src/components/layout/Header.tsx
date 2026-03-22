import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { StatsCard } from "../ui/StatsCard";
import { StatusBadge } from "../ui/StatusBadge";
import { useNetworkStats } from "../../logic/hooks/useNetworkStats";

export const Header = () => {
  const stats = useNetworkStats();

  return (
    <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold text-white">SDN-Flow Monitor</h1>
            <p className="text-sm text-slate-400">AdvisMash Industrial Plant</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <StatsCard icon={Activity} label="Total Nodes" value={stats.total} />
          <StatsCard
            icon={CheckCircle2}
            label="Active"
            value={stats.online}
            variant="success"
          />

          {stats.issues > 0 && (
            <StatsCard
              icon={AlertTriangle}
              label="Issues"
              value={stats.issues}
              variant="danger"
            />
          )}

          {stats.offline > 0 && (
            <StatusBadge icon={XCircle} label="Offline" count={stats.offline} />
          )}
          {stats.warning > 0 && (
            <StatusBadge
              icon={AlertTriangle}
              label="Warning"
              count={stats.warning}
            />
          )}
        </div>
      </div>
    </header>
  );
};
