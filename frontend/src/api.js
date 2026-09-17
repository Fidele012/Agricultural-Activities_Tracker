// In development, Vite proxies /tasks to the Express server (see vite.config.js).
// In production, the built frontend is served by the same Express app, so a
// relative path works there too. VITE_API_URL lets you point at a separately
// deployed backend (see README "Deploying frontend and backend separately").
const rawApiUrl = import.meta.env.VITE_API_URL || "";
const apiRoot = rawApiUrl.replace(/\/$/, ""); // remove trailing slash if present
const API_BASE = `${apiRoot}/tasks`;

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (err) {
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }

  if (res.status === 204) return null;

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* empty body, e.g. on some errors */
  }

  if (!res.ok) {
    const message =
      (body && body.errors && body.errors.join(", ")) ||
      (body && body.error) ||
      "Something went wrong.";
    throw new ApiError(message, res.status, body);
  }

  return body;
}

export function getTasks({ status, search } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "All") params.set("status", status);
  if (search) params.set("search", search);
  const qs = params.toString();
  return request(`${qs ? `?${qs}` : ""}`);
}

export function createTask(payload) {
  return request("", { method: "POST", body: JSON.stringify(payload) });
}

export function updateTask(id, payload) {
  return request(`/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function setTaskStatus(id, status) {
  return request(`/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteTask(id) {
  return request(`/${id}`, { method: "DELETE" });
}

export { ApiError };
