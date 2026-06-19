import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("aisetup_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...init.headers,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(text || `Request failed (${res.status})`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Placeholder endpoints — wire to Spring Boot controllers when backend is ready */
export const api = {
  health: () => apiFetch<{ status: string }>("/health"),

  login: (email: string, password: string) =>
    apiFetch<import("./types").ApiAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getApplicant: (id: string) =>
    apiFetch<import("./types").ApiApplicant>(`/applicants/${id}`),

  saveTnaForm: (payload: import("./types").ApiTnaFormPayload) =>
    apiFetch<{ ok: boolean }>(`/applicants/${payload.applicantId}/tna1`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  generateLoi: (payload: import("./types").LoiGenerationRequest) =>
    apiFetch<import("./types").LoiDocumentResponse>("/loi/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  generateTna1: (payload: import("./types").Tna1GenerationRequest) =>
    apiFetch<import("./types").Tna1DocumentResponse>("/tna1/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  generateTna2: (payload: import("./types").Tna2GenerationRequest) =>
    apiFetch<import("./types").Tna2DocumentResponse>("/tna2/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
