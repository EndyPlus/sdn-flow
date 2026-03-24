import { useNetworkStats } from "./useNetworkStats";
import { useNetworkStore } from "../stores/useNetworkStore";

export const useHeaderInfo = () => {
  const stats = useNetworkStats();
  const lastUpdated = useNetworkStore((state) => state.lastUpdated);

  return { stats, lastUpdated };
};
