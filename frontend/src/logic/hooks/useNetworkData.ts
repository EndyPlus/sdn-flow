import { useEffect, useRef, useState } from "react";
import { fetchTopology } from "../../services/networkAction";
import { useNetworkStore } from "../stores/useNetworkStore";
import { FETCHING_INTERVAL } from "../../helpers/utils/variables";

export const useNetworkData = () => {
  const [isError, setIsError] = useState(true);

  const updateNodesAndEdges = useNetworkStore(
    (state) => state.updateNodesAndEdges,
  );
  const intervalRef = useRef<number>(null);

  useEffect(() => {
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

    intervalRef.current = setInterval(loadTopology, FETCHING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateNodesAndEdges, isError]);

  return { isError };
};
