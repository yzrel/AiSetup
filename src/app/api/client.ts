/**
 * Author: Yzrel Jade B. Eborde
 */

import { API_BASE_URL } from "./config";
import { clearAuthToken, getAuthToken } from "./authToken";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401 && !path.startsWith("/auth/login")) {
    clearAuthToken();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let message = text || `Request failed (${res.status})`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed?.error) message = parsed.error;
    } catch {
      /* keep raw text */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  health: () =>
    apiFetch<{
      status: string;
      aiConfigured?: boolean;
      demoModeEnabled?: boolean;
      authRequired?: boolean;
      smtpEnabled?: boolean;
      smsEnabled?: boolean;
      emailOutbox?: string;
    }>("/health"),

  login: (payload: { email: string; password: string }) =>
    apiFetch<import("./types").ApiAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload: import("./types").ApiRegisterRequest) =>
    apiFetch<import("./types").ApiAuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  sendOtp: (payload: { channel: "email" | "sms"; target: string }) =>
    apiFetch<{
      ok: boolean;
      delivered: boolean;
      demo: boolean;
      message?: string;
    }>("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyOtp: (payload: {
    channel: "email" | "sms";
    target: string;
    code: string;
  }) =>
    apiFetch<{ verified: boolean }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => apiFetch<import("./types").ApiAuthResponse["user"]>("/auth/me"),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiFetch<{ ok: boolean }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminResetPassword: (payload: { applicantId: string; newPassword: string }) =>
    apiFetch<{ ok: boolean }>("/auth/admin/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminSetEnabled: (payload: { applicantId: string; enabled: boolean }) =>
    apiFetch<{ ok: boolean }>("/auth/admin/set-enabled", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listStaffUsers: () =>
    apiFetch<import("./types").ApiStaffUser[]>("/auth/admin/staff"),

  createStaffUser: (payload: import("./types").ApiCreateStaffRequest) =>
    apiFetch<import("./types").ApiStaffUser>("/auth/admin/staff", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateStaffUser: (
    userId: string,
    payload: import("./types").ApiUpdateStaffRequest,
  ) =>
    apiFetch<import("./types").ApiStaffUser>(`/auth/admin/staff/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  resetStaffPassword: (userId: string, payload: { newPassword: string }) =>
    apiFetch<{ ok: boolean }>(`/auth/admin/staff/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getApplicant: (id: string) =>
    apiFetch<import("./types").ApiApplicantRecord>(`/applicants/${id}`),

  updateApplicantHeader: (
    id: string,
    payload: {
      enterpriseName?: string;
      currentModule?: string;
      profile?: Record<string, unknown>;
    },
  ) =>
    apiFetch<import("./types").ApiApplicantRecord>(`/applicants/${id}/header`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  saveTnaForm: (payload: import("./types").ApiTnaFormPayload) =>
    apiFetch<import("./types").ApiTnaFormSaveResponse>(
      `/applicants/${payload.applicantId}/tna1`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),

  patchApplicantModule: (
    applicantId: string,
    moduleKey: string,
    payload: { data: Record<string, unknown>; published?: boolean },
  ) =>
    apiFetch<import("./types").ApiApplicantRecord>(
      `/applicants/${applicantId}/modules/${encodeURIComponent(moduleKey)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    ),

  uploadApplicantFile: async (
    applicantId: string,
    moduleKey: string,
    file: File,
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("moduleKey", moduleKey);
    return apiFetch<Record<string, unknown>>(
      `/applicants/${applicantId}/files?moduleKey=${encodeURIComponent(moduleKey)}`,
      {
        method: "POST",
        body: form,
        headers: {}, // let browser set multipart boundary
      },
    );
  },

  listApplicantFiles: (applicantId: string) =>
    apiFetch<
      Array<{
        id: string;
        applicantId?: string;
        applicationId?: string;
        moduleKey?: string;
        originalFilename?: string;
        contentType?: string;
        sizeBytes?: number;
        uploadedBy?: string;
        createdAt?: string;
      }>
    >(`/applicants/${applicantId}/files`),

  downloadApplicantFile: async (applicantId: string, fileId: string) => {
    const headers = new Headers();
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await fetch(
      `${API_BASE_URL}/applicants/${applicantId}/files/${fileId}`,
      { headers },
    );
    if (res.status === 401) {
      clearAuthToken();
    }
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new ApiError(text || `Download failed (${res.status})`, res.status);
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = /filename="([^"]+)"/i.exec(disposition);
    const fileName = match?.[1] || `file-${fileId}`;
    return { blob, fileName, contentType: blob.type || res.headers.get("Content-Type") || undefined };
  },

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

  generateProjectProposal: (
    payload: import("./types").ProjectProposalGenerationRequest,
  ) =>
    apiFetch<import("./types").ProjectProposalDocumentResponse>(
      "/project-proposal/generate",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  suggestAiField: (payload: import("./types").AiFieldSuggestionRequest) =>
    apiFetch<import("./types").AiFieldSuggestionResponse>("/ai/suggest-field", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  completeAi: (payload: import("./types").AiCompletionRequest) =>
    apiFetch<import("./types").AiCompletionResponse>("/ai/complete", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAuthorityLetter: (applicationId: string) =>
    apiFetch<{ applicationId: string; status: string; message?: string; html?: string }>(
      `/fund-release/authority-letter/${applicationId}`,
    ),

  getRefundSchedule: (applicationId: string) =>
    apiFetch<{ applicationId: string; status: string; message?: string }>(
      `/fund-release/refund-schedule/${applicationId}`,
    ),

  saveApplicantRecord: (payload: import("./types").ApiApplicantRecord) =>
    apiFetch<import("./types").ApiApplicantRecord>(`/applicants/${payload.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  acknowledgeApprovalLetter: (applicantId: string, conformeSignedName: string) =>
    apiFetch<import("./types").ApiApplicantRecord>(
      `/applicants/${applicantId}/approval-letter/acknowledge`,
      {
        method: "PUT",
        body: JSON.stringify({ conformeSignedName }),
      },
    ),

  listApplicantRecords: () =>
    apiFetch<import("./types").ApiApplicantRecord[]>("/applicants"),

  generateLbpIntroduction: (payload: Record<string, unknown>) =>
    apiFetch<{ applicationId: string; status: string; message?: string }>(
      "/fund-release/lbp-introduction/generate",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
};
