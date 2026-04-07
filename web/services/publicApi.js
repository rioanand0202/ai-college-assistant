import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

/**
 * Public assistant API — uses `publicAccessToken` only (not college staff JWT).
 */
export const publicApi = axios.create({
  baseURL,
  timeout: 120000,
  headers: { Accept: "application/json" },
});

publicApi.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem("publicAccessToken")?.trim();
  if (token) {
    if (!config.headers) config.headers = {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
