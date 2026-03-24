import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader,
} from "lucide-react";
import { StatsCard } from "../ui/StatsCard";
import { StatusBadge } from "../ui/StatusBadge";
import { useHeaderInfo } from "../../logic/hooks/useHeaderInfo";
import { getFormattedTime } from "../../helpers/utils/getFormattedTime";

export const Header = () => {
  const { stats, lastUpdated } = useHeaderInfo();

  return (
    <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold text-white">SDN-Flow Monitor</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-400">
                AdvisMash Industrial Plant
              </p>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <p className="text-xs text-slate-500">
                  Last Updated: {getFormattedTime(lastUpdated)}
                </p>
              </div>
            </div>
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

          {stats.rebooting > 0 && (
            <StatsCard
              icon={Loader}
              label="Rebooting"
              value={stats.rebooting}
              variant="info"
            />
          )}

          {stats.issues > 0 && (
            <StatsCard
              icon={AlertTriangle}
              label="Issues"
              value={stats.issues}
              variant="danger"
            />
          )}

          {stats.warning > 0 && (
            <StatusBadge
              icon={AlertTriangle}
              label="Warning"
              status="warning"
              count={stats.warning}
            />
          )}

          {stats.offline > 0 && (
            <StatusBadge
              icon={XCircle}
              label="Offline"
              status="offline"
              count={stats.offline}
            />
          )}
        </div>
      </div>
    </header>
  );
};
