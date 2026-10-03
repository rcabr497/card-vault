// Only same-site paths are allowed as a post-login destination. Rejects
// protocol-relative ("//evil.com", "/\evil.com") and control-character tricks
// that browsers would otherwise treat as a jump to another site.
export function safeCallbackUrl(raw: unknown, fallback = "/dashboard"): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;
  return raw;
}
