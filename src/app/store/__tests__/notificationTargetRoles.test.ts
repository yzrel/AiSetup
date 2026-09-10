/**
 * Author: Yzrel Jade B. Eborde
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { createNotifications, getAuthToken } = vi.hoisted(() => ({
  createNotifications: vi.fn(),
  getAuthToken: vi.fn(() => "test-token"),
}));

vi.mock("../../api/client", () => ({
  api: {
    listNotifications: vi.fn(async () => []),
    createNotifications,
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    health: vi.fn(async () => ({ smtpEnabled: false })),
    sendMail: vi.fn(),
  },
}));

vi.mock("../../api/authToken", () => ({ getAuthToken }));

import { AuthUser, UserRole } from "../authStore";
import { notificationStore } from "../notificationStore";

function staff(role: UserRole, officeId: string): AuthUser {
  return {
    id: `user-${role}-${officeId}`,
    email: `${role}@dost.gov.ph`,
    firstName: "T",
    middleName: "",
    lastName: "User",
    role,
    enterpriseName: "",
    verified: true,
    officeId,
  };
}

const PSTO = "psto-cotabato";

describe("role-targeted staff notifications", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("test-token");
    createNotifications.mockImplementation(async (payload: unknown[]) => payload);
    await notificationStore.hydrateFromBackend();
  });

  it("reaches the targeted role in the same office", () => {
    notificationStore.add({
      id: "rd-only",
      audience: "staff",
      applicantId: "app-1",
      officeId: PSTO,
      targetRoles: ["regional-director"],
      kind: "action",
      title: "Notice awaiting decision",
      message: "Approve or disapprove.",
    });

    const rd = notificationStore.getForUser(staff("regional-director", PSTO));
    expect(rd.map((n) => n.id)).toContain("rd-only");
  });

  it("does not reach other staff roles in that office", () => {
    notificationStore.add({
      id: "rtec-only",
      audience: "staff",
      applicantId: "app-1",
      officeId: PSTO,
      targetRoles: ["rtec-staff"],
      kind: "action",
      title: "RTEC evaluation ready",
      message: "Complete Form 002.",
    });

    for (const role of ["agent", "provincial-director", "regional-director"] as UserRole[]) {
      const rows = notificationStore.getForUser(staff(role, PSTO));
      expect(rows.map((n) => n.id)).not.toContain("rtec-only");
    }
  });

  /**
   * Regional accounts see every untargeted staff row. That must not swallow
   * role-targeted handoffs, or the RD queue becomes indistinguishable again.
   */
  it("does not let the regional office bypass role targeting", () => {
    notificationStore.add({
      id: "rtec-only-regional",
      audience: "staff",
      applicantId: "app-1",
      officeId: PSTO,
      targetRoles: ["rtec-staff"],
      kind: "action",
      title: "RTEC evaluation ready",
      message: "Complete Form 002.",
    });

    const regionalRd = notificationStore.getForUser(
      staff("regional-director", "regional"),
    );
    expect(regionalRd.map((n) => n.id)).not.toContain("rtec-only-regional");

    const rtec = notificationStore.getForUser(staff("rtec-staff", PSTO));
    expect(rtec.map((n) => n.id)).toContain("rtec-only-regional");
  });

  it("still shows every targeted row to admin", () => {
    notificationStore.add({
      id: "rtec-only-admin",
      audience: "staff",
      applicantId: "app-1",
      officeId: PSTO,
      targetRoles: ["rtec-staff"],
      kind: "action",
      title: "RTEC evaluation ready",
      message: "Complete Form 002.",
    });

    const admin = notificationStore.getForUser(staff("admin", "regional"));
    expect(admin.map((n) => n.id)).toContain("rtec-only-admin");
  });

  it("keeps untargeted rows visible to the whole office and to regional", () => {
    notificationStore.add({
      id: "broadcast",
      audience: "staff",
      applicantId: "app-1",
      officeId: PSTO,
      kind: "info",
      title: "Case updated",
      message: "No specific owner.",
    });

    for (const user of [
      staff("agent", PSTO),
      staff("provincial-director", PSTO),
      staff("regional-director", "regional"),
      staff("admin", "regional"),
    ]) {
      expect(
        notificationStore.getForUser(user).map((n) => n.id),
      ).toContain("broadcast");
    }
  });

  it("still scopes targeted rows to the applicant's office", () => {
    notificationStore.add({
      id: "office-scoped",
      audience: "staff",
      applicantId: "app-1",
      officeId: PSTO,
      targetRoles: ["provincial-director"],
      kind: "action",
      title: "Validation required",
      message: "Validate TNA Form 01.",
    });

    const otherOffice = notificationStore.getForUser(
      staff("provincial-director", "psto-sarangani"),
    );
    expect(otherOffice.map((n) => n.id)).not.toContain("office-scoped");
  });

  it("sends targetRoles to the backend so server-side filtering matches", () => {
    notificationStore.add({
      id: "persisted",
      audience: "staff",
      applicantId: "app-1",
      officeId: PSTO,
      targetRoles: ["regional-director"],
      kind: "action",
      title: "Notice awaiting decision",
      message: "Approve or disapprove.",
    });

    expect(createNotifications).toHaveBeenCalled();
    const payload = createNotifications.mock.calls.at(-1)?.[0] as Array<{
      id: string;
      targetRoles?: string[];
    }>;
    expect(payload[0].targetRoles).toEqual(["regional-director"]);
  });

  it("omits targetRoles for untargeted rows", () => {
    notificationStore.add({
      id: "persisted-broadcast",
      audience: "staff",
      applicantId: "app-1",
      officeId: PSTO,
      kind: "info",
      title: "Case updated",
      message: "No specific owner.",
    });

    const payload = createNotifications.mock.calls.at(-1)?.[0] as Array<{
      targetRoles?: string[];
    }>;
    expect(payload[0].targetRoles).toBeUndefined();
  });
});
