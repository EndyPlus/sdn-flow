import { X, Server, Network, Cpu, Clock, Gauge, Wifi } from "lucide-react";
import { useNetwork } from "../../logic/hooks/useNetwork";

export const NodeInspector = () => {
  const { selectedNode, clearSelection } = useNetwork();

  if (!selectedNode) return null;

  const data = selectedNode.data;
  const nodeTypeIcons = {
    server: Server,
    switch: Network,
    industrial: Cpu,
  };

  const Icon =
    nodeTypeIcons[selectedNode.type as keyof typeof nodeTypeIcons] || Server;

  const statusColors = {
    online: "text-green-400 bg-green-950 border-green-500",
    offline: "text-red-400 bg-red-950 border-red-500",
    warning: "text-yellow-400 bg-yellow-950 border-yellow-500",
  };

  return (
    <aside className="absolute top-0 right-0 z-10 h-full w-96 border-l border-slate-800 bg-slate-900 shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Node Inspector</h2>
          <button
            onClick={clearSelection}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center gap-4 rounded-lg bg-slate-800 p-4">
            <div className={`rounded-lg p-3 ${statusColors[data.status]}`}>
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{data.label}</h3>
              <p className="text-sm text-slate-400 capitalize">
                {selectedNode.type}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-slate-800 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    data.status === "online"
                      ? "animate-pulse bg-green-500"
                      : data.status === "offline"
                        ? "bg-red-500"
                        : "animate-pulse bg-yellow-500"
                  }`}
                />
                <span className="text-sm font-medium text-slate-400">
                  Status
                </span>
              </div>
              <p
                className={`text-lg font-bold capitalize ${
                  data.status === "online"
                    ? "text-green-400"
                    : data.status === "offline"
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                {data.status}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400">
                  Node ID
                </span>
              </div>
              <p className="font-mono text-sm text-white">{selectedNode.id}</p>
            </div>

            {data.ip && (
              <div className="rounded-lg bg-slate-800 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-400">
                    IP Address
                  </span>
                </div>
                <p className="font-mono text-lg font-bold text-white">
                  {data.ip}
                </p>
              </div>
            )}

            {data.load !== undefined && (
              <div className="rounded-lg bg-slate-800 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-400">
                    CPU Load
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-white">{data.load}%</p>
                  <div className="mb-1 h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={`h-full transition-all ${
                        data.load > 80
                          ? "bg-red-500"
                          : data.load > 60
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${data.load}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {data.latency !== undefined && (
              <div className="rounded-lg bg-slate-800 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-400">
                    Latency
                  </span>
                </div>
                <p className="text-lg font-bold text-white">
                  {data.latency} ms
                </p>
              </div>
            )}

            {data.uptime !== undefined && (
              <div className="rounded-lg bg-slate-800 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-400">
                    Uptime
                  </span>
                </div>
                <p className="text-lg font-bold text-white">
                  {data.uptime} hours
                </p>
              </div>
            )}

            <div className="rounded-lg bg-slate-800 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400">
                  Position
                </span>
              </div>
              <p className="font-mono text-sm text-white">
                X: {Math.round(selectedNode.position.x)}, Y:{" "}
                {Math.round(selectedNode.position.y)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
