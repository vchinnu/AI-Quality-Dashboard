import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8002";

export const getRunSummaries = async () => {
  const res = await axios.get(`${API}/runs`);
  return res.data;
};

export const getMetricDetails = async (runId: string, metric: string) => {
  const res = await axios.get(`${API}/runs/${runId}/metrics/${metric}`);
  return res.data;
};