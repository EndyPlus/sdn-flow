import { useMemo } from "react";
import { useNetworkStore } from "../stores/useNetworkStore";

export const useNetworkStats = () => {
  const nodes = useNetworkStore((state) => state.nodes);

  const stats = useMemo(() => {
    const total = nodes.length;
    const online = nodes.filter((n) => n.data.status === "online").length;
    const offline = nodes.filter((n) => n.data.status === "offline").length;
    const warning = nodes.filter((n) => n.data.status === "warning").length;
    const issues = offline + warning;

    return { total, online, offline, warning, issues };
  }, [nodes]);

  return stats;
};
