/**
 * Author: Yzrel Jade B. Eborde
 *
 * Bound MOA packet annex B/C/D builders.
 */

import { describe, expect, it } from "vitest";
import type { Applicant } from "../../store/applicantStore";
import { emptyMoaAnnexCForm } from "../moaAnnexC";
import {
  buildMoaAnnexBData,
  buildMoaAnnexDCalendarGrid,
  buildMoaAnnexPacketContext,
} from "../moaAnnexPacket";

function applicantWithProposal(
  overrides: Partial<Applicant["moduleData"]> = {},
): Applicant {
  return {
    id: "app-packet-1",
    applicationId: "LOI-2026-000100",
    enterpriseName: "Three K Printshop",
    applicantName: "Marlon Cesar B. Orfrecio",
    designation: "Owner",
    emailAddress: "threek@example.com",
    contactNumber: "09171234567",
    address: "Antipas, Cotabato",
    msmeSize: "Micro",
    businessType: "Sole Proprietorship",
    businessSector: "Services",
    businessNature: "Printing",
    yearsOfOperation: "5",
    assetSize: "2000000",
    qualified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    moduleData: {
      tinNumber: "123-456-789-000",
      projectProposal: {
        form: {
          projectTitle: "Upgrading Capabilities for Three K Printshop",
          projectCost: "4500000",
          amountRequested: "1570000",
          budgetItems: [
            {
              id: "b1",
              item: "10.5 ft Large Format Printer",
              qty: "1",
              unitCost: "1570000",
              setupShare: "1570000",
              lgiaShare: "",
              total: "1570000",
            },
            {
              id: "b2",
              item: "6 ft Large Format Printer",
              qty: "1",
              unitCost: "430000",
              setupShare: "",
              lgiaShare: "",
              total: "430000",
            },
            {
              id: "b3",
              item: "Expansion and renovation (civil works)",
              qty: "1",
              unitCost: "2500000",
              setupShare: "",
              lgiaShare: "",
              total: "2500000",
            },
          ],
          scheduleTable: [
            ["Activity", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"],
            ["Procurement of equipment", "", "", "", "1", "1", "", "", ""],
            ["Installation of equipment", "", "", "", "", "1", "1", "", ""],
          ],
        },
      },
      ...overrides,
    },
  } as unknown as Applicant;
}

describe("buildMoaAnnexBData", () => {
  it("builds LIB rows with SETUP and cooperator columns", () => {
    const form = {
      ...emptyMoaAnnexCForm(),
      approvedAmount: "1570000",
      projectTitle: "Upgrading Capabilities for Three K Printshop",
      enterpriseName: "Three K Printshop",
    };
    const data = buildMoaAnnexBData(applicantWithProposal(), form);
    expect(data).not.toBeNull();
    expect(data!.rows.length).toBeGreaterThanOrEqual(3);
    const printer = data!.rows.find((r) => r.item.includes("10.5 ft"));
    expect(printer?.setup).toBe("1,570,000.00");
    const sublimation = data!.rows.find((r) => r.item.includes("6 ft"));
    expect(sublimation?.cooperator).toBe("430,000.00");
    expect(data!.showLgia).toBe(false);
    expect(data!.setupTotal).toBe("1,570,000.00");
    expect(data!.projectTotal).toBe("4,500,000.00");
  });
});

describe("buildMoaAnnexDCalendarGrid", () => {
  it("pivots monthly refunds into calendar-year columns", () => {
    const form = {
      ...emptyMoaAnnexCForm(),
      approvedAmount: "1570000",
      refundTermYearsDigit: "3",
      signingDay: "4",
      signingMonth: "July",
      signingYear: "25",
    };
    const grid = buildMoaAnnexDCalendarGrid(form);
    expect(grid).not.toBeNull();
    expect(grid!.years.length).toBeGreaterThanOrEqual(2);
    expect(grid!.manner).toBe("Monthly");
    expect(grid!.projectCost).toContain("1,570,000");
    const july2027 = grid!.cells["July-2027"];
    expect(july2027).toBeTruthy();
  });
});

describe("buildMoaAnnexPacketContext", () => {
  it("includes annex B, schedule, and annex D when Form 001 has data", () => {
    const form = {
      ...emptyMoaAnnexCForm(),
      approvedAmount: "1570000",
      refundTermYearsDigit: "3",
      signingDay: "4",
      signingMonth: "July",
      signingYear: "25",
    };
    const ctx = buildMoaAnnexPacketContext(applicantWithProposal(), form);
    expect(ctx.annexB?.rows.length).toBeGreaterThan(0);
    expect(ctx.scheduleTable?.length).toBeGreaterThan(1);
    expect(ctx.annexD?.years.length).toBeGreaterThan(0);
    expect(ctx.proposedEquipment).toContain("10.5 ft Large Format Printer");
    expect(ctx.proposedEquipment).toContain("6 ft Large Format Printer");
  });
});
