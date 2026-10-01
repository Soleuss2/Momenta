/**
 * Input sanitization and validation utilities.
 * Strips malicious script tags, escapes HTML, trims input, and enforces length bounds
 * to prevent XSS, injection, and database bloat.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Strips dangerous HTML tags and event handlers to mitigate XSS attacks.
 */
export function stripHtmlTags(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""); // Remove null bytes & control chars
}

/**
 * Escapes characters for safe rendering in HTML.
 */
export function escapeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates and sanitizes email addresses.
 */
export function sanitizeEmail(email: string): { valid: boolean; value: string; error?: string } {
  if (!email || typeof email !== "string") {
    return { valid: false, value: "", error: "Email address is required." };
  }

  const cleaned = email.trim().toLowerCase();

  if (cleaned.length > 254) {
    return { valid: false, value: "", error: "Email address exceeds maximum length of 254 characters." };
  }

  if (!EMAIL_REGEX.test(cleaned)) {
    return { valid: false, value: cleaned, error: "Please enter a valid email address." };
  }

  return { valid: true, value: cleaned };
}

/**
 * Validates passwords against length bounds.
 * Max length is capped at 72 to prevent bcrypt CPU exhaustion attacks.
 */
export function sanitizePassword(password: string): { valid: boolean; value: string; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, value: "", error: "Password is required." };
  }

  if (password.length < 6) {
    return { valid: false, value: "", error: "Password must be at least 6 characters." };
  }

  if (password.length > 72) {
    return { valid: false, value: "", error: "Password cannot exceed 72 characters." };
  }

  // Check for null bytes
  if (password.includes("\0")) {
    return { valid: false, value: "", error: "Password contains invalid characters." };
  }

  return { valid: true, value: password };
}

/**
 * Sanitizes user display names (e.g. "Alex & Jamie").
 */
export function sanitizeDisplayName(name: string, maxLength = 50): string {
  if (!name || typeof name !== "string") return "";
  const stripped = stripHtmlTags(name).trim();
  return stripped.slice(0, maxLength);
}

/**
 * Sanitizes general user text (notes, diary entries, reflections).
 */
export function sanitizeText(text: string, maxLength = 2000): string {
  if (!text || typeof text !== "string") return "";
  const stripped = stripHtmlTags(text).trim();
  return stripped.slice(0, maxLength);
}

/**
 * Sanitizes single-line titles or labels.
 */
export function sanitizeTitle(title: string, maxLength = 100): string {
  if (!title || typeof title !== "string") return "";
  const singleLine = title.replace(/[\r\n\t]+/g, " ");
  const stripped = stripHtmlTags(singleLine).trim();
  return stripped.slice(0, maxLength);
}
