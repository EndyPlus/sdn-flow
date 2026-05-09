import { useEffect, useRef, useState } from "react";
import {
  fetchTopology,
  fetchTopologyStatus,
} from "../../services/networkAction";
import { useNetworkStore } from "../stores/useNetworkStore";
import { FETCHING_INTERVAL } from "../../helpers/utils/variables";

export const useNetworkData = () => {
  const [isError, setIsError] = useState(false);

  const updateNodesAndEdges = useNetworkStore(
    (state) => state.updateNodesAndEdges,
  );
  const updateNodeStatuses = useNetworkStore(
    (state) => state.updateNodeStatuses,
  );
  const intervalRef = useRef<number>(null);

  useEffect(() => {
    // Initial load: fetch full topology with nodes and edges
    const loadTopology = async () => {
      try {
        const data = await fetchTopology();
        updateNodesAndEdges(data.nodes, data.edges);
        if (isError) {
          setIsError(false);
        }
      } catch (error) {
        setIsError(true);
        console.error("Failed to fetch topology:", error);
      }
    };

    loadTopology();

    // Polling: only fetch status updates
    const pollStatus = async () => {
      try {
        const statusNodes = await fetchTopologyStatus();
        updateNodeStatuses(statusNodes);
      } catch (error) {
        console.error("Failed to fetch status:", error);
      }
    };

    intervalRef.current = setInterval(pollStatus, FETCHING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateNodesAndEdges, updateNodeStatuses, isError]);

  return { isError };
};
