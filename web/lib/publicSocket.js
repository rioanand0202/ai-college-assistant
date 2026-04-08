import { io } from "socket.io-client";

/** API base including `/api`, e.g. http://localhost:5000/api */
export function publicApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api"
  );
}

/** Origin for Socket.io (no trailing `/api`). */
export function publicSocketOrigin() {
  const base = publicApiBaseUrl();
  if (base.endsWith("/api")) {
    return base.slice(0, -4);
  }
  return base;
}

/**
 * @param {{ token?: string | null, onConnect?: () => void }} opts
 */
export function createPublicAssistantSocket(opts = {}) {
  const { token, onConnect } = opts;
  const s = io(publicSocketOrigin(), {
    path: "/api/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: true,
    auth: token ? { token } : {},
  });
  if (onConnect) s.on("connect", onConnect);
  return s;
}
