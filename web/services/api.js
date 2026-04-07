import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
  timeout: 120000,
  headers: {
    Accept: "application/json",
  },
});

/** Paths that must not send Authorization (public auth). */
function isPublicAuthPath(url) {
  if (!url) return false;
  const path = String(url).split("?")[0];
  return (
    path.endsWith("/auth/login") ||
    path.endsWith("/auth/register") ||
    path.endsWith("/auth/verify-otp")
  );
}

/**
 * Default headers on every browser request except public auth routes.
 * Login / register / verify-otp: no Bearer (avoids stale tokens; register may still pass x-college-code from the caller).
 */
api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const url = config.url || "";
  const publicAuth = isPublicAuthPath(url);

  if (publicAuth) {
    delete config.headers.Authorization;
    return config;
  }

  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = String(config.method || "get").toLowerCase();
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (
    method === "patch" &&
    !isFormData &&
    (config.data === undefined || config.data === null)
  ) {
    config.data = {};
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || "Something went wrong";
    return Promise.reject(Object.assign(err, { message }));
  },
);
