// Public trading handles: what other users see instead of your name or email.
// Stored lowercase without the leading "@".

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

const RESERVED = new Set([
  "admin",
  "administrator",
  "api",
  "cardvault",
  "card_vault",
  "help",
  "me",
  "mod",
  "moderator",
  "new",
  "null",
  "official",
  "profile",
  "root",
  "settings",
  "staff",
  "support",
  "system",
  "trade",
  "trades",
  "undefined",
]);

export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

// Null when valid, otherwise a message to show the user.
export function handleError(handle: string): string | null {
  if (!HANDLE_PATTERN.test(handle)) {
    return "Handles are 3–20 characters: lowercase letters, numbers, and underscores.";
  }
  if (RESERVED.has(handle)) return "That handle is reserved. Try another.";
  return null;
}
