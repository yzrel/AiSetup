/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import { coerceLoiDocument } from "../loiLetter";

describe("coerceLoiDocument", () => {
  it("rebuilds letterhead from nested form when letterhead is missing", () => {
    const doc = coerceLoiDocument(
      {
        form: {
          enterpriseName: "Full Field Foods Corp",
          applicantName: "Maria Santos Reyes",
          designation: "Owner",
          emailAddress: "full@example.com",
          contactNumber: "09181234567",
          province: "South Cotabato",
          signature: "Maria Santos Reyes",
          signedDate: "2026-08-05",
        },
        bodyParagraphs: ["Paragraph one.", "Paragraph two."],
        thruAddressee: {
          name: "Provincial Director",
          officeName: "PSTO - South Cotabato",
        },
      },
      { address: "Koronadal City" },
    );

    expect(doc).not.toBeNull();
    expect(doc!.letterhead.enterpriseName).toBe("FULL FIELD FOODS CORP");
    expect(doc!.signature.printedName).toBe("Maria Santos Reyes");
    expect(doc!.bodyParagraphs).toHaveLength(2);
    expect(doc!.thruAddressee.officeName).toContain("South Cotabato");
  });

  it("returns null without body paragraphs", () => {
    expect(coerceLoiDocument({ letterhead: { enterpriseName: "X" } })).toBeNull();
  });
});
