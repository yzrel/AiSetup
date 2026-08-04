/**
 * Author: Yzrel Jade B. Eborde
 *
 * Shared field-level validators. Return a single error message or null when valid.
 * Module submit gates compose these into string[] and honor demo mode separately.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE_RE = /^(09|\+639)\d{9}$/;
const TIN_DASHED_RE = /^\d{3}-\d{3}-\d{3}-\d{3}$/;
const TIN_DIGITS_RE = /^\d{9,12}$/;

export function requiredTrimmed(
  value: string | null | undefined,
  label: string,
): string | null {
  if (value == null || !String(value).trim()) {
    return `${label} is required`;
  }
  return null;
}

export function email(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return "Enter a valid email address";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address";
  return null;
}

/** Philippine mobile: 09XXXXXXXXX or +639XXXXXXXXX */
export function phMobile(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v || !PH_MOBILE_RE.test(v)) {
    return "Enter a valid Philippine mobile number";
  }
  return null;
}

/** TIN as 123-456-789-000 or 9–12 digits. */
export function tin(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v || (!TIN_DASHED_RE.test(v) && !TIN_DIGITS_RE.test(v))) {
    return "Enter a valid TIN (e.g. 123-456-789-000)";
  }
  return null;
}

/**
 * Registration password policy: min 8, at least one uppercase, one digit.
 * Returns the first failing rule (same order as RegisterPage historically used).
 */
export function passwordPolicy(value: string | null | undefined): string | null {
  const v = value ?? "";
  if (v.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(v)) return "Password must contain an uppercase letter";
  if (!/[0-9]/.test(v)) return "Password must contain a number";
  return null;
}

export function passwordsMatch(
  password: string | null | undefined,
  confirm: string | null | undefined,
): string | null {
  if ((password ?? "") !== (confirm ?? "")) {
    return "Passwords do not match";
  }
  return null;
}

export function nonEmptySelect(
  value: string | null | undefined,
  label: string,
): string | null {
  if (value == null || !String(value).trim()) {
    return `Select ${label}`;
  }
  return null;
}

export function positiveMoney(
  value: string | null | undefined,
  label: string,
): string | null {
  const raw = String(value ?? "").replace(/[^\d.]/g, "");
  const n = parseFloat(raw);
  if (!raw || Number.isNaN(n) || n <= 0) {
    return `${label} is required`;
  }
  return null;
}

/** Collect non-null messages into a string[]. */
export function collectErrors(
  ...messages: Array<string | null | undefined>
): string[] {
  return messages.filter((m): m is string => !!m);
}
