// In development, requests to /api/... are proxied to http://localhost:8000
// by Vite (see vite.config.ts). This avoids any CORS issues in the browser.
// In production, set VITE_API_URL to your deployed backend URL.
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "";

// ── TODO: add auth header helper once backend JWT middleware is live ───────────
// import { TOKEN_KEY } from "../App";
// export const authHeaders = (): Record<string, string> => ({
//   Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ""}`,
//   "Content-Type": "application/json",
// });
