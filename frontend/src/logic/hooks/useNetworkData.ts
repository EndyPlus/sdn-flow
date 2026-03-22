import { useEffect, useRef } from "react";
import { fetchTopology } from "../../services/networkAction";
import { useNetworkStore } from "../stores/useNetworkStore";
import { FETCHING_INTERVAL } from "../../helpers/utils/variables";

export const useNetworkData = () => {
  const updateNodesAndEdges = useNetworkStore(
    (state) => state.updateNodesAndEdges,
  );
  const intervalRef = useRef<number>(null);

  useEffect(() => {
    const loadTopology = async () => {
      try {
        const data = await fetchTopology();
        updateNodesAndEdges(data.nodes, data.edges);
      } catch (error) {
        console.error("Failed to fetch topology:", error);
      }
    };

    loadTopology();

    intervalRef.current = setInterval(loadTopology, FETCHING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateNodesAndEdges]);
};
