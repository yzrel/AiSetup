/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  applyGeneratedDocument,
  buildLocalProjectProposalDocument,
  computeExistingEquipmentRow,
  emptyExistingEquipmentRow,
  emptyProjectProposalForm,
  existingEquipmentFooterRow,
  recomputeExistingEquipmentTable,
} from "../projectProposal";
import { applicantStore } from "../../store/applicantStore";
import {
  PP_EQUIPMENT_COLUMNS,
  PP_EQUIPMENT_SAMPLE_ROWS,
} from "../../constants/projectProposalLayout";

describe("PP_EQUIPMENT_COLUMNS", () => {
  it("has nine columns in the official order", () => {
    expect([...PP_EQUIPMENT_COLUMNS]).toEqual([
      "Particulars",
      "Year acquired",
      "Acquisition cost",
      "Qty",
      "Total cost",
      "EUL",
      "Annual depreciation",
      "RUL",
      "Book Value",
    ]);
  });
});

describe("PP_EQUIPMENT_SAMPLE_ROWS", () => {
  it("computes Total cost and Book Value for each sample row", () => {
    const rows = recomputeExistingEquipmentTable(PP_EQUIPMENT_SAMPLE_ROWS);
    expect(rows).toHaveLength(3);
    expect(rows[0][4]).toBe("₱170,000.00");
    expect(rows[0][8]).toBe("₱68,000.00");
    expect(existingEquipmentFooterRow(rows)).toEqual([
      "Total",
      "",
      "",
      "",
      "₱242,000.00",
      "",
      "",
      "",
      "₱110,000.00",
    ]);
  });
});

describe("computeExistingEquipmentRow", () => {
  it("computes Total cost, Annual depreciation, and Book Value (straight-line, salvage 0)", () => {
    expect(
      computeExistingEquipmentRow([
        "Dryer",
        "2018",
        "100000",
        "2",
        "",
        "10",
        "",
        "7",
        "",
      ]),
    ).toEqual([
      "Dryer",
      "2018",
      "100000",
      "2",
      "₱200,000.00",
      "10",
      "₱20,000.00",
      "7",
      "₱140,000.00",
    ]);
  });

  it("leaves depreciation and book value blank when EUL is missing or ≤ 0", () => {
    expect(computeExistingEquipmentRow(["Dryer", "2018", "100000", "2", "", "", "", "7"])[6]).toBe(
      "",
    );
    expect(computeExistingEquipmentRow(["Dryer", "2018", "100000", "2", "", "0", "", "7"])[8]).toBe(
      "",
    );
    expect(computeExistingEquipmentRow(["Dryer", "2018", "100000", "2"])[4]).toBe("₱200,000.00");
  });

  it("treats RUL > EUL as zero years used so book value equals total cost", () => {
    expect(
      computeExistingEquipmentRow(["Press", "2024", "50000", "1", "", "5", "", "8"]),
    ).toEqual([
      "Press",
      "2024",
      "50000",
      "1",
      "₱50,000.00",
      "5",
      "₱10,000.00",
      "8",
      "₱50,000.00",
    ]);
  });

  it("migrates legacy 3-col Type / Quantity / Year Acquired", () => {
    const migrated = computeExistingEquipmentRow(["Sealer", "3", "2019"]);
    expect(migrated[0]).toBe("Sealer");
    expect(migrated[1]).toBe("2019");
    expect(migrated[3]).toBe("3");
    expect(migrated[2]).toBe("");
    expect(migrated[4]).toBe("");
  });

  it("migrates TNA 5-col Type / Specs / Capacity / Units / Year", () => {
    const migrated = computeExistingEquipmentRow([
      "Mixer",
      "Stainless",
      "50 kg",
      "2",
      "2020",
    ]);
    expect(migrated[0]).toBe("Mixer");
    expect(migrated[1]).toBe("2020");
    expect(migrated[3]).toBe("2");
    expect(migrated[2]).toBe("");
  });
});

describe("existingEquipmentFooterRow", () => {
  it("totals Total cost and Book Value only", () => {
    const footer = existingEquipmentFooterRow([
      ["Dryer", "2018", "100000", "2", "", "10", "", "7", ""],
      ["Press", "2024", "50000", "1", "", "5", "", "5", ""],
    ]);
    expect(footer).toEqual([
      "Total",
      "",
      "",
      "",
      "₱250,000.00",
      "",
      "",
      "",
      "₱190,000.00",
    ]);
  });

  it("returns empty money cells for blank rows", () => {
    expect(existingEquipmentFooterRow([emptyExistingEquipmentRow()])).toEqual([
      "Total",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  });
});

describe("generated document equipment table", () => {
  it("copies recomputed staff rows onto the local generated document", () => {
    const form = emptyProjectProposalForm();
    form.equipmentTable = recomputeExistingEquipmentTable([
      ["Dryer", "2018", "100000", "2", "", "10", "", "7", ""],
    ]);
    const local = buildLocalProjectProposalDocument({
      applicationId: "LOI-2026-000001",
      enterpriseName: "Test Co",
      form,
    });
    expect(local.equipmentTable).toEqual([
      [
        "Dryer",
        "2018",
        "100000",
        "2",
        "₱200,000.00",
        "10",
        "₱20,000.00",
        "7",
        "₱140,000.00",
      ],
    ]);
  });

  it("merges document.equipmentTable when present, else keeps form rows", () => {
    const app = applicantStore.add({
      applicantName: "Equipment Test",
      designation: "Owner",
      enterpriseName: "Equip Co",
      contactNumber: "09170000001",
      emailAddress: `equip-${Date.now()}@example.com`,
      businessType: "DTI",
      businessNature: "",
      businessSector: "Food Processing",
      yearsOfOperation: "5",
      enterpriseType: "",
      msmeSize: "Small",
      assetSize: "",
      region: "South Cotabato",
      address: "Koronadal City",
      currentModule: "project-proposal",
      qualified: true,
      moduleData: {},
    });
    const form = emptyProjectProposalForm();
    form.equipmentTable = [["Kept", "2015", "1000", "1", "", "10", "", "5", ""]];
    const withTable = buildLocalProjectProposalDocument({
      applicationId: app.applicationId,
      enterpriseName: app.enterpriseName,
      form: {
        ...form,
        equipmentTable: [["FromDoc", "2016", "2000", "1", "", "10", "", "8", ""]],
      },
    });
    const mergedFromDoc = applyGeneratedDocument(app.id, withTable, form);
    expect(mergedFromDoc.equipmentTable[0][0]).toBe("FromDoc");
    expect(mergedFromDoc.equipmentTable[0][4]).toBe("₱2,000.00");

    const withoutTable = buildLocalProjectProposalDocument({
      applicationId: app.applicationId,
      enterpriseName: app.enterpriseName,
      form,
    });
    delete withoutTable.equipmentTable;
    const mergedKeepForm = applyGeneratedDocument(app.id, withoutTable, form);
    expect(mergedKeepForm.equipmentTable[0][0]).toBe("Kept");
  });
});
