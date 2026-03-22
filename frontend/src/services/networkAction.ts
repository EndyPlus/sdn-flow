import axios from "axios";
import type { TopologyResponse } from "../helpers/types/types";

const API_BASE_URL = "http://localhost:3001/api";

export const fetchTopology = async (): Promise<TopologyResponse> => {
  const response = await axios.get<TopologyResponse>(
    `${API_BASE_URL}/topology`,
  );
  return response.data;
};
