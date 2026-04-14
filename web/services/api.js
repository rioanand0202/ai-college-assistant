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

/** Resolve path for matching (handles relative `/materials/upload` or absolute URLs). */
function normalizeRequestPath(url) {
  if (!url) return "";
  const s = String(url);
  if (s.startsWith("http")) {
    try {
      const u = new URL(s);
      const p = u.pathname || "";
      const i = p.indexOf("/api/");
      return i >= 0 ? p.slice(i + 4) : p;
    } catch {
      return s;
    }
  }
  return s.startsWith("/") ? s : `/${s}`;
}

/** Routes that must not send Authorization (and must not trigger refresh retry). */
function isPublicAuthPath(url) {
  const p = normalizeRequestPath(url);
  return (
    p.endsWith("/auth/login") ||
    p.endsWith("/auth/register") ||
    p.endsWith("/auth/verify-otp") ||
    p.endsWith("/auth/refresh") ||
    p.endsWith("/public/events")
  );
}

function setAuthHeader(config, bearerValue) {
  if (!config.headers) config.headers = {};
  config.headers.Authorization = bearerValue;
  if (typeof config.headers.set === "function") {
    config.headers.set("Authorization", bearerValue);
  }
}

let refreshInFlight = null;

async function fetchNewAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken")?.trim();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }
  const { data } = await axios.post(
    `${baseURL}/auth/refresh`,
    { refreshToken },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 30000,
    },
  );
  const accessToken = data?.data?.accessToken;
  if (!accessToken) {
    throw new Error("Refresh response missing accessToken");
  }
  localStorage.setItem("token", accessToken);
  return accessToken;
}

/**
 * Attach Bearer token; strip Content-Type for FormData so the browser sets multipart boundaries.
 * Login / register / verify-otp / refresh: never send stale access token from this client.
 */
api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const publicAuth = isPublicAuthPath(config.url || "");

  if (publicAuth) {
    if (typeof config.headers?.delete === "function") {
      config.headers.delete("Authorization");
    } else {
      delete config.headers.Authorization;
    }
    return config;
  }

  const token = localStorage.getItem("token")?.trim();
  if (token) {
    setAuthHeader(config, `Bearer ${token}`);
  }

  const method = String(config.method || "get").toLowerCase();
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
      config.headers.delete("content-type");
    } else {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }

  if (
    method === "patch" &&
    !isFormData &&
    (config.data === undefined || config.data === null)
  ) {
    config.data = {};
    if (!config.headers["Content-Type"] && typeof config.headers.set !== "function") {
      config.headers["Content-Type"] = "application/json";
    }
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const status = err.response?.status;

    if (
      status !== 401 ||
      !original ||
      original._authRetry ||
      isPublicAuthPath(original.url || "")
    ) {
      const message =
        err.response?.data?.message || err.message || "Something went wrong";
      return Promise.reject(Object.assign(err, { message }));
    }

    const refreshToken = localStorage.getItem("refreshToken")?.trim();
    if (!refreshToken) {
      const message =
        err.response?.data?.message || err.message || "Something went wrong";
      return Promise.reject(Object.assign(err, { message }));
    }

    original._authRetry = true;

    try {
      if (!refreshInFlight) {
        refreshInFlight = fetchNewAccessToken().finally(() => {
          refreshInFlight = null;
        });
      }
      const accessToken = await refreshInFlight;
      setAuthHeader(original, `Bearer ${accessToken}`);
      return api(original);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      const message =
        err.response?.data?.message || err.message || "Session expired; sign in again";
      return Promise.reject(Object.assign(err, { message }));
    }
  },
);
