/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  listNotifications,
  createNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAuthToken,
} = vi.hoisted(() => ({
  listNotifications: vi.fn(),
  createNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  getAuthToken: vi.fn(() => "test-token"),
}));

vi.mock("../../api/client", () => ({
  api: {
    listNotifications,
    createNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  },
}));

vi.mock("../../api/authToken", () => ({
  getAuthToken,
}));

import { notificationStore } from "../notificationStore";
import type { AuthUser } from "../authStore";

function applicantUser(): AuthUser {
  return {
    id: "user-1",
    email: "juan@abcfood.com",
    firstName: "Juan",
    middleName: "",
    lastName: "Dela Cruz",
    role: "applicant",
    enterpriseName: "ABC Food Processing",
    applicantId: "1",
    verified: true,
  };
}

function staffUser(): AuthUser {
  return {
    id: "agent-001",
    email: "agent@dost.gov.ph",
    firstName: "DOST",
    middleName: "",
    lastName: "Agent",
    role: "agent",
    enterpriseName: "PSTO South Cotabato",
    officeId: "south-cotabato",
    verified: true,
  };
}

describe("notificationStore", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    listNotifications.mockResolvedValue([]);
    createNotifications.mockImplementation(async (payload) =>
      payload.map((row: Record<string, unknown>) => ({
        ...row,
        read: row.read ?? false,
        timestamp: row.timestamp ?? new Date().toISOString(),
      })),
    );
    markNotificationRead.mockResolvedValue({
      id: "n1",
      audience: "applicant",
      applicantId: "1",
      kind: "info",
      title: "t",
      message: "m",
      read: true,
      timestamp: new Date().toISOString(),
    });
    markAllNotificationsRead.mockResolvedValue({ ok: true, updated: 1 });
    await notificationStore.hydrateFromBackend();
  });

  it("hydrateFromBackend replaces the local cache", async () => {
    notificationStore.add({
      id: "local-only",
      audience: "applicant",
      applicantId: "1",
      kind: "info",
      title: "Local",
      message: "Should be replaced",
    });
    await vi.waitFor(() => {
      expect(createNotifications).toHaveBeenCalled();
    });

    listNotifications.mockResolvedValue([
      {
        id: "from-server",
        audience: "applicant",
        applicantId: "1",
        kind: "success",
        title: "Server",
        message: "Persisted",
        read: false,
        timestamp: "2026-08-05T00:00:00Z",
        view: "dashboard",
      },
    ]);

    await notificationStore.hydrateFromBackend();
    const rows = notificationStore.getForUser(applicantUser());
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("from-server");
    expect(rows[0].title).toBe("Server");
  });

  it("add posts payload to the API", async () => {
    notificationStore.add({
      id: "req-applicant-1",
      audience: "applicant",
      applicantId: "1",
      kind: "info",
      title: "Requirements submitted",
      message: "With provincial office.",
      view: "requirements",
    });

    await vi.waitFor(() => {
      expect(createNotifications).toHaveBeenCalled();
    });

    const payload = createNotifications.mock.calls[0][0];
    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "req-applicant-1",
          audience: "applicant",
          applicantId: "1",
          title: "Requirements submitted",
        }),
      ]),
    );
    expect(
      notificationStore.getForUser(applicantUser()).some((n) => n.id === "req-applicant-1"),
    ).toBe(true);
  });

  it("markRead calls the API and updates local state", async () => {
    notificationStore.add({
      id: "mark-me",
      audience: "staff",
      applicantId: "1",
      officeId: "south-cotabato",
      kind: "action",
      title: "Review",
      message: "Please review",
      view: "requirements",
    });

    notificationStore.markRead("mark-me");
    expect(
      notificationStore.getForUser(staffUser()).find((n) => n.id === "mark-me")?.read,
    ).toBe(true);

    await vi.waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith("mark-me");
    });
  });

  it("addMany batch-persists staff and applicant alerts", async () => {
    notificationStore.addMany([
      {
        id: "pair-staff",
        audience: "staff",
        applicantId: "1",
        officeId: "south-cotabato",
        kind: "action",
        title: "Staff",
        message: "Staff msg",
      },
      {
        id: "pair-applicant",
        audience: "applicant",
        applicantId: "1",
        kind: "info",
        title: "Applicant",
        message: "Applicant msg",
      },
    ]);

    await vi.waitFor(() => {
      expect(createNotifications).toHaveBeenCalled();
    });
    const payload = createNotifications.mock.calls[0][0];
    expect(payload).toHaveLength(2);
    expect(notificationStore.getForUser(staffUser()).some((n) => n.id === "pair-staff")).toBe(
      true,
    );
    expect(
      notificationStore.getForUser(applicantUser()).some((n) => n.id === "pair-applicant"),
    ).toBe(true);
  });
});
