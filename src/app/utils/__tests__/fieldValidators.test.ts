/**
 * Author: Yzrel Jade B. Eborde
 */

import { describe, expect, it } from "vitest";
import {
  collectErrors,
  email,
  passwordPolicy,
  passwordsMatch,
  phMobile,
  positiveMoney,
  requiredTrimmed,
  tin,
} from "../fieldValidators";

describe("fieldValidators", () => {
  it("requiredTrimmed", () => {
    expect(requiredTrimmed("", "Name")).toBe("Name is required");
    expect(requiredTrimmed("  x  ", "Name")).toBeNull();
  });

  it("email", () => {
    expect(email("bad")).toBe("Enter a valid email address");
    expect(email("a@b.co")).toBeNull();
  });

  it("phMobile", () => {
    expect(phMobile("123")).toMatch(/Philippine mobile/);
    expect(phMobile("09171234567")).toBeNull();
    expect(phMobile("+639171234567")).toBeNull();
  });

  it("tin", () => {
    expect(tin("abc")).toMatch(/TIN/);
    expect(tin("123-456-789-000")).toBeNull();
    expect(tin("123456789")).toBeNull();
  });

  it("passwordPolicy matches Register rules", () => {
    expect(passwordPolicy("short")).toMatch(/8 characters/);
    expect(passwordPolicy("nouppercase1")).toMatch(/uppercase/);
    expect(passwordPolicy("NoDigitHere")).toMatch(/number/);
    expect(passwordPolicy("GoodPass1")).toBeNull();
  });

  it("passwordsMatch", () => {
    expect(passwordsMatch("a", "b")).toBe("Passwords do not match");
    expect(passwordsMatch("a", "a")).toBeNull();
  });

  it("positiveMoney and collectErrors", () => {
    expect(positiveMoney("0", "Amount")).toMatch(/required/);
    expect(positiveMoney("1,250.00", "Amount")).toBeNull();
    expect(collectErrors(null, "A", undefined, "B")).toEqual(["A", "B"]);
  });
});
