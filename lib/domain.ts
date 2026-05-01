export function isValidOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (!["https:", "http:"].includes(url.protocol)) return false;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) return false;
    if (process.env.NODE_ENV === "production" && url.hostname === "localhost") return false;
    return true;
  } catch {
    return false;
  }
}

export function originMatchesDomain(origin: string, domain: string): boolean {
  if (!isValidOrigin(origin)) return false;
  try {
    const host = new URL(origin).hostname.replace(/^www\./i, "").toLowerCase();
    const d    = domain.replace(/^www\./i, "").toLowerCase();
    return host === d || host.endsWith(`.${d}`);
  } catch {
    return false;
  }
}
