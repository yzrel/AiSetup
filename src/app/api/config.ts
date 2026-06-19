/** Spring Boot API base URL — set VITE_API_URL in .env for local/staging/production */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "/api" : "http://localhost:8080/api");

export const USE_MOCK_STORE =
  import.meta.env.VITE_USE_MOCK_STORE !== "false";
