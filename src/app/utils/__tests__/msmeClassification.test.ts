/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  classifyByAsset,
  classifyByAssetAmount,
  classifyByEmployee,
  classifyByEmployees,
  classificationRangeForAssetAmount,
  deriveMsmeSize,
  derivePrescreeningMsmeSize,
  employeeClassificationRangeForCount,
  parseAssetAmount,
} from "../msmeClassification";

describe("msmeClassification", () => {
  it("parses asset amounts from formatted strings", () => {
    expect(parseAssetAmount("5000000")).toBe(5000000);
    expect(parseAssetAmount("₱8,000,000")).toBe(8000000);
    expect(parseAssetAmount("")).toBeNull();
  });

  it("classifies by asset amount at boundaries", () => {
    expect(classifyByAssetAmount(3_000_000)).toBe("Micro");
    expect(classifyByAssetAmount(3_000_001)).toBe("Small");
    expect(classifyByAssetAmount(15_000_000)).toBe("Small");
    expect(classifyByAssetAmount(15_000_001)).toBe("Medium");
    expect(classifyByAssetAmount(100_000_001)).toBe("");
  });

  it("classifies by employee count at boundaries", () => {
    expect(classifyByEmployees(9)).toBe("Micro");
    expect(classifyByEmployees(10)).toBe("Small");
    expect(classifyByEmployees(99)).toBe("Small");
    expect(classifyByEmployees(100)).toBe("Medium");
    expect(classifyByEmployees(199)).toBe("Medium");
    expect(classifyByEmployees(200)).toBe("");
    expect(classifyByEmployees(0)).toBe("");
  });

  it("prefers numeric asset size over classification range", () => {
    expect(
      classifyByAsset({
        assetSize: "2000000",
        classificationRange: "₱3M - ₱15M",
      }),
    ).toBe("Micro");
  });

  it("falls back to classification range when asset size is empty", () => {
    expect(
      classifyByAsset({
        assetSize: "",
        classificationRange: "₱3M - ₱15M",
      }),
    ).toBe("Small");
  });

  it("maps asset amount to classification range labels", () => {
    expect(classificationRangeForAssetAmount(2_500_000)).toBe("₱0 - ₱3M");
    expect(classificationRangeForAssetAmount(5_000_000)).toBe("₱3M - ₱15M");
    expect(classificationRangeForAssetAmount(20_000_000)).toBe("₱15M - ₱100M");
  });

  it("maps employee count to employee classification range labels", () => {
    expect(employeeClassificationRangeForCount(8)).toBe("1 - 9");
    expect(employeeClassificationRangeForCount(10)).toBe("10 - 99");
    expect(employeeClassificationRangeForCount(150)).toBe("100 - 199");
    expect(employeeClassificationRangeForCount(200)).toBe("");
  });

  it("prefers numeric employee count over employee classification range", () => {
    expect(
      classifyByEmployee({
        numberOfEmployees: "8",
        employeeClassificationRange: "10 - 99",
      }),
    ).toBe("Micro");
  });

  it("falls back to employee classification range when count is empty", () => {
    expect(
      classifyByEmployee({
        numberOfEmployees: "",
        employeeClassificationRange: "10 - 99",
      }),
    ).toBe("Small");
  });

  it("derives higher category when asset and employee classifications differ", () => {
    expect(
      deriveMsmeSize({
        assetSize: "5000000",
        classificationRange: "₱3M - ₱15M",
        numberOfEmployees: "8",
      }),
    ).toBe("Small");

    expect(
      deriveMsmeSize({
        assetSize: "2000000",
        numberOfEmployees: "25",
      }),
    ).toBe("Small");
  });

  it("uses single dimension when the other is missing", () => {
    expect(
      deriveMsmeSize({
        assetSize: "5000000",
        numberOfEmployees: "",
      }),
    ).toBe("Small");

    expect(
      deriveMsmeSize({
        assetSize: "",
        classificationRange: "",
        numberOfEmployees: "8",
      }),
    ).toBe("Micro");
  });

  it("returns empty when both dimensions exceed MSME limits", () => {
    expect(
      deriveMsmeSize({
        assetSize: "150000000",
        numberOfEmployees: "250",
      }),
    ).toBe("");
  });

  describe("derivePrescreeningMsmeSize", () => {
    it("uses higher category from asset range and employee range", () => {
      expect(
        derivePrescreeningMsmeSize({
          classificationRange: "₱3M - ₱15M",
          employeeClassificationRange: "1 - 9",
        }),
      ).toBe("Small");
    });

    it("derives from asset size and syncs classification on asset input", () => {
      expect(
        derivePrescreeningMsmeSize(
          {
            assetSize: "5000000",
            classificationRange: "₱3M - ₱15M",
            employeeClassificationRange: "10 - 99",
          },
          "assetSize",
        ),
      ).toBe("Small");
    });

    it("uses selected classification range when range field changes", () => {
      expect(
        derivePrescreeningMsmeSize(
          {
            assetSize: "5000000",
            classificationRange: "₱0 - ₱3M",
            employeeClassificationRange: "1 - 9",
          },
          "classificationRange",
        ),
      ).toBe("Micro");
    });

    it("updates size when employee classification range changes", () => {
      expect(
        derivePrescreeningMsmeSize(
          {
            classificationRange: "₱0 - ₱3M",
            employeeClassificationRange: "100 - 199",
          },
          "employeeClassificationRange",
        ),
      ).toBe("Medium");
    });
  });
});
