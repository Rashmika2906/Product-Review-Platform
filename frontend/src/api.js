// Talks to the Flask backend. Every page calls the server through api().

// Where the Flask API lives. Override with VITE_API_URL (see .env.example)
// when the backend is deployed somewhere else.
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://127.0.0.1:5000/api");
const TOKEN_KEY = "token";

// A copy of the token is kept in memory too, because localStorage can be
// blocked (private windows) and we still want login to work for that visit.
let memoryToken = null;

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || memoryToken;
  } catch {
    return memoryToken;
  }
}

export function saveToken(token) {
  memoryToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable: the in-memory copy still works */
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

// An error that carries the HTTP status code along with the message.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * api("/products")                                  -> GET
 * api("/reviews", { method: "POST", body: {...} })  -> POST with JSON
 * The login token (if any) is attached automatically.
 * Failures throw an ApiError whose message comes from the server's {"error": ...}.
 */
export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Request failed (${response.status})`, response.status);
  }
  return data;
}