import axios from "axios";
import type { NodesEdges, StatusNode } from "../helpers/types/types";

const API_BASE_URL = "http://localhost:3001/api";

export const fetchTopology = async (): Promise<NodesEdges> => {
  const response = await axios.get<NodesEdges>(`${API_BASE_URL}/topology`);
  return response.data;
};

export const fetchTopologyStatus = async (): Promise<StatusNode[]> => {
  const response = await axios.get<{ nodes: StatusNode[] }>(
    `${API_BASE_URL}/topology/status`,
  );
  return response.data.nodes;
};
