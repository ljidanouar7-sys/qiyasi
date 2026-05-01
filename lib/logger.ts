type Level    = "info" | "warn" | "error";
type LogEvent =
  | "rate_limit" | "domain_blocked" | "invalid_key"
  | "admin_access" | "key_rotated" | "auth_error"
  | "domain_conflict_attempt"
  | "size_calculated"
  | "domain_rejected"
  | "merchant_blocked"
  | "ai_reasoning_failed"
  | "webhook_received"
  | "invalid_input";

const ENV = process.env.NODE_ENV ?? "production";

export function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local[0]}***@${domain}`;
}

export function log(level: Level, event: LogEvent, data: Record<string, unknown> = {}) {
  const entry = { ts: new Date().toISOString(), level, event, env: ENV, ...data };
  const line  = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
