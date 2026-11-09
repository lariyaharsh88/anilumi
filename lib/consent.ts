/**
 * Analytics consent: who must be asked (EEA, UK, Switzerland), and the visitor's stored choice. GA and Clarity
 * load for everyone else straight away and, where consent is required, only after "Accept". Client-side storage.
 */
export const CONSENT_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE", // EU
  "IS", "LI", "NO", // rest of the EEA
  "GB", "CH",
]);

/** Fallback when the country lookup fails: European time zones (and EU/EEA Atlantic islands), or no time zone at all. */
export function tzNeedsConsent(tz: string | null | undefined): boolean {
  if (!tz) return true;
  if (/^Atlantic\/(Canary|Madeira|Azores|Reykjavik|Faroe)$/.test(tz)) return true;
  return /^Europe\//.test(tz) && !/^Europe\/(Moscow|Minsk|Istanbul|Kiev|Kyiv|Simferopol|Volgograd|Samara|Ulyanovsk|Saratov|Astrakhan|Kirov)$/.test(tz);
}

export const needsConsent = (country: string | null | undefined, tz?: string | null) => (country ? CONSENT_COUNTRIES.has(country.toUpperCase()) : tzNeedsConsent(tz));

/** Crawlers and automated browsers that run scripts (search renderers, AI fetchers): never load GA or Clarity for them. */
export const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|fetcher|bytespider|petal|yandex|baidu/i;
export function isAutomated(): boolean {
  try { return navigator.webdriver === true || BOT_UA.test(navigator.userAgent); } catch { return false; }
}

export type Choice = "granted" | "denied";
const CHOICE = "al_consent", REGION = "al_region";
const YEAR = 365 * 86400_000, MONTH = 30 * 86400_000;

/** The stored choice, if made in the last 12 months. */
export function readChoice(): Choice | null {
  try {
    const v = JSON.parse(localStorage.getItem(CHOICE) || "null") as { v: Choice; at: number } | null;
    return v && (v.v === "granted" || v.v === "denied") && Date.now() - v.at < YEAR ? v.v : null;
  } catch { return null; }
}
export function saveChoice(v: Choice) {
  try { localStorage.setItem(CHOICE, JSON.stringify({ v, at: Date.now() })); } catch { /* storage blocked */ }
}

/** Whether this visitor must be asked: cached 30 days, else /api/geo, else the time zone. */
export async function mustAsk(): Promise<boolean> {
  try {
    const r = JSON.parse(localStorage.getItem(REGION) || "null") as { c: string | null; at: number } | null;
    if (r && Date.now() - r.at < MONTH && r.c) return needsConsent(r.c);
  } catch { /* storage blocked */ }
  const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; } })();
  const c = await fetch("/api/geo", { cache: "no-store", signal: AbortSignal.timeout(2500) }).then((r) => r.json()).then((j: { c: string | null }) => j.c).catch(() => null);
  try { if (c) localStorage.setItem(REGION, JSON.stringify({ c, at: Date.now() })); } catch { /* storage blocked */ }
  return needsConsent(c, tz);
}

/** Withdraw: tell GA and Clarity, and delete their cookies (they stop loading from the next page). */
export function withdraw() {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; clarity?: (...a: unknown[]) => void };
  try { w.gtag?.("consent", "update", { analytics_storage: "denied" }); } catch {}
  try { w.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" }); } catch {}
  for (const c of document.cookie.split(";").map((x) => x.split("=")[0].trim())) {
    if (/^(_ga|_gid|_gat|_clck|_clsk|CLID|ANONCHK|MR|MUID|SM)/.test(c)) {
      for (const domain of ["", `;domain=${location.hostname}`, `;domain=.${location.hostname.replace(/^www\./, "")}`]) document.cookie = `${c}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/${domain}`;
    }
  }
}

export const OPEN_EVENT = "al:consent-open";
