/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import { STEPS, TNA1_STAFF_ONLY_STEP_ID, visibleTna1Steps } from "../tna1Ui";

describe("visibleTna1Steps", () => {
  it("hides Staff Review from cooperators", () => {
    const steps = visibleTna1Steps(false);
    expect(steps.some((s) => s.id === TNA1_STAFF_ONLY_STEP_ID)).toBe(false);
    expect(steps.map((s) => s.id)).toEqual(
      STEPS.filter((s) => s.id !== TNA1_STAFF_ONLY_STEP_ID).map((s) => s.id),
    );
  });

  it("keeps Staff Review for DOST staff", () => {
    const steps = visibleTna1Steps(true);
    expect(steps).toBe(STEPS);
    expect(steps.some((s) => s.id === TNA1_STAFF_ONLY_STEP_ID)).toBe(true);
  });
});
