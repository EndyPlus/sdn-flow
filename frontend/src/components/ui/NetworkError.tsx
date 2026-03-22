import { WifiOff } from "lucide-react";

export const NetworkError = () => {
  return (
    <div className="flex h-full w-full flex-1 items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 px-10 py-8 shadow-lg">
        <div className="rounded-full bg-red-950 p-4">
          <WifiOff className="h-8 w-8 text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">Connection Lost</h2>
          <p className="mt-1 text-sm text-slate-400">
            Unable to reach the network controller. Retrying automatically...
          </p>
        </div>
        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-full animate-pulse rounded-full bg-red-500" />
        </div>
      </div>
    </div>
  );
};
