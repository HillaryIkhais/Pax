/* ------------------------------------------------------------------ */
/* Contact normalization                                              */
/*                                                                     */
/* Email: lowercase, trim.                                            */
/* Phone: parse with libphonenumber-js, format E.164. Fall back to    */
/* digits-only normalisation if the library cannot parse.             */
/* ------------------------------------------------------------------ */

import { parsePhoneNumber, AsYouType } from "libphonenumber-js";

/* Normalise an email address. */
export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

/* Normalise a phone number to E.164 (+2348012345678). */
export function normalisePhone(value: string, defaultCountry = "NG" as Parameters<typeof parsePhoneNumber>[1]): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = parsePhoneNumber(trimmed, defaultCountry);
    if (parsed && parsed.isValid()) {
      return parsed.format("E.164");
    }
  } catch {
    // fall through to digits-only fallback
  }

  // Fallback: keep only digits + leading +
  const digits = trimmed.replace(/[^0-9+]/g, "");
  return digits;
}

/* Compare two normalised emails. Null-safe. */
export function emailsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normaliseEmail(a) === normaliseEmail(b);
}

/* Compare two normalised phones. Null-safe. */
export function phonesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normalisePhone(a) === normalisePhone(b);
}

/* Mask a contact value for display/logs. */
export function maskContact(value: string, type: "email" | "phone"): string {
  if (!value) return "";
  if (type === "email") {
    const [local, domain] = value.split("@");
    if (!local || !domain) return "••••@••••";
    const maskedLocal = local.length <= 2 ? "••" : local[0] + "•".repeat(local.length - 2) + local.slice(-1);
    return `${maskedLocal}@${domain}`;
  }
  // phone: show last 4 digits only
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length <= 4) return "••••";
  return "•".repeat(digits.length - 4) + digits.slice(-4);
}
