import axios from "axios";
import type { NodesEdges } from "../helpers/types/types";

const API_BASE_URL = "http://localhost:3001/api";

export const fetchTopology = async (): Promise<NodesEdges> => {
  const response = await axios.get<NodesEdges>(`${API_BASE_URL}/topology`);
  return response.data;
};
