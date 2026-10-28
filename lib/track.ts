/** Send a GA4 event when analytics is loaded; a no-op otherwise (local dev, blockers). Client only. */
type Params = Record<string, string | number | boolean | undefined>;
export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  try { g?.("event", event, params); } catch { /* analytics must never break the page */ }
}
