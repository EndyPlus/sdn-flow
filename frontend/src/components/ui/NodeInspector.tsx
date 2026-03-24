import { X, Clock, Gauge, Wifi } from "lucide-react";
import { useNodeInspector } from "../../logic/hooks/useNodeInspector";
import type { NodeInspectorProps } from "../../helpers/types/types";

export const NodeInspector = ({
  selectedNode,
  clearSelection,
}: NodeInspectorProps) => {
  const {
    nodeId,
    nodePosition,
    nodeType,
    nodeDataLabel,
    nodeDataStatus,
    nodeDataIp,
    nodeDataLoad,
    nodeDataLatency,
    nodeDataUptime,
    Icon,
    inspectorStatusColor,
  } = useNodeInspector(selectedNode);

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
          {nodeDataStatus !== "online" && nodeDataStatus !== "rebooting" && (
            <button className="mb-6 w-full animate-pulse cursor-pointer rounded-lg border-2 border-yellow-500 bg-slate-800 px-6 py-4 text-xl font-bold tracking-wider text-white uppercase">
              Reboot
            </button>
          )}

          <div className="mb-6 flex items-center gap-4 rounded-lg bg-slate-800 p-4">
            <div className={`rounded-lg p-3 ${inspectorStatusColor}`}>
              <Icon
                className={`h-8 w-8 ${nodeDataStatus === "rebooting" ? "animate-spin" : ""}`}
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{nodeDataLabel}</h3>
              <p className="text-sm text-slate-400 capitalize">{nodeType}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-slate-800 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    nodeDataStatus === "rebooting"
                      ? "animate-pulse bg-blue-500"
                      : nodeDataStatus === "online"
                        ? "animate-pulse bg-green-500"
                        : nodeDataStatus === "offline"
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
                  nodeDataStatus === "rebooting"
                    ? "text-blue-400"
                    : nodeDataStatus === "online"
                      ? "text-green-400"
                      : nodeDataStatus === "offline"
                        ? "text-red-400"
                        : "text-yellow-400"
                }`}
              >
                {nodeDataStatus}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400">
                  Node ID
                </span>
              </div>
              <p className="font-mono text-sm text-white">{nodeId}</p>
            </div>

            {nodeDataIp && (
              <div className="rounded-lg bg-slate-800 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-400">
                    IP Address
                  </span>
                </div>
                <p className="font-mono text-lg font-bold text-white">
                  {nodeDataIp}
                </p>
              </div>
            )}

            {nodeDataStatus !== "rebooting" && (
              <>
                {nodeDataLoad !== undefined && (
                  <div className="rounded-lg bg-slate-800 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">
                        CPU Load
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-bold text-white">
                        {nodeDataLoad}%
                      </p>
                      <div className="mb-1 h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
                        <div
                          className={`h-full transition-all ${
                            nodeDataLoad > 80
                              ? "bg-red-500"
                              : nodeDataLoad > 60
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${nodeDataLoad}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {nodeDataLatency !== undefined && (
                  <div className="rounded-lg bg-slate-800 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">
                        Latency
                      </span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {nodeDataLatency} ms
                    </p>
                  </div>
                )}

                {nodeDataUptime !== undefined && (
                  <div className="rounded-lg bg-slate-800 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-400">
                        Uptime
                      </span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {nodeDataUptime} hours
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="rounded-lg bg-slate-800 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-400">
                  Position
                </span>
              </div>
              <p className="font-mono text-sm text-white">
                X: {Math.round(nodePosition.x)}, Y: {Math.round(nodePosition.y)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
