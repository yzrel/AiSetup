/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import { stripHeavyPayloads } from "./stripModuleDataForSync";

describe("stripHeavyPayloads", () => {
  it("removes nested dataUrl bodies while keeping metadata", () => {
    const heavy = `data:application/pdf;base64,${"A".repeat(600)}`;
    const slim = stripHeavyPayloads({
      productionPlanDocument: {
        fileName: "plan.pdf",
        mimeType: "application/pdf",
        dataUrl: heavy,
        uploadedAt: "2026-07-23T00:00:00.000Z",
        uploadedBy: "test",
        fileId: "abc",
      },
      loiDocument: { body: "hello" },
    });

    expect(slim).toEqual({
      productionPlanDocument: {
        fileName: "plan.pdf",
        mimeType: "application/pdf",
        uploadedAt: "2026-07-23T00:00:00.000Z",
        uploadedBy: "test",
        fileId: "abc",
        hasFileContent: true,
      },
      loiDocument: { body: "hello" },
    });
  });

  it("strips TNA FileData fields and selfie data URLs", () => {
    const heavy = `data:image/png;base64,${"B".repeat(600)}`;
    const slim = stripHeavyPayloads({
      selfie: heavy,
      tna1: {
        form: {
          productionPlanFileName: "a.pdf",
          productionPlanFileData: heavy,
          plantLayoutFileName: "b.png",
          plantLayoutFileData: heavy,
        },
      },
    });

    expect(slim).toEqual({
      selfieUploaded: true,
      tna1: {
        form: {
          productionPlanFileName: "a.pdf",
          productionPlanFileUploaded: true,
          plantLayoutFileName: "b.png",
          plantLayoutFileUploaded: true,
        },
      },
    });
  });
});
