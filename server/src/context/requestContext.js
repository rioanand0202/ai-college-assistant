const { AsyncLocalStorage } = require("node:async_hooks");

const SENSITIVE_KEYS = new Set([
  "password",
  "otp",
  "accessToken",
  "refreshToken",
  "token",
  "authorization",
]);

const sanitizeBody = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) continue;
    out[k] = v;
  }
  return out;
};

const als = new AsyncLocalStorage();

const requestContextMiddleware = (req, res, next) => {
  als.run({ req, capture: null, activity: null }, () => {
    const store = als.getStore();
    if (store) {
      res.locals.__requestContextStore = store;
    }
    next();
  });
};

const getStore = () => als.getStore();

/**
 * Snapshot safe request fields into async-local storage (body/query/params sanitized).
 * Call at the start of handlers that opt into activity logging.
 */
const asyncHookFun = (req) => {
  const store = getStore();
  if (!store) return;
  store.capture = {
    method: req.method,
    path: req.originalUrl.split("?")[0],
    ip: req.ip || req.socket?.remoteAddress || "",
    query: req.query && Object.keys(req.query).length ? { ...req.query } : undefined,
    body: sanitizeBody(req.body),
    params: req.params && Object.keys(req.params).length ? { ...req.params } : undefined,
  };
};

/**
 * Marks this request for ActivityLog persistence after the response finishes.
 * Merge fields: summary, userId, userEmail, userName (optional).
 */
const commitActivityLog = (patch) => {
  const store = getStore();
  if (!store) return;
  store.activity = { ...(store.activity || {}), ...patch, _persist: true };
};

module.exports = {
  requestContextMiddleware,
  getStore,
  asyncHookFun,
  commitActivityLog,
  sanitizeBody,
};
