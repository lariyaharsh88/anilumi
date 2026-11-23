/**
 * Which AI assistant sent a visitor, from the referrer and the landing URL's utm_source. Bing Copilot cited AniLumi
 * 5,200 times in a month (Nov 2026) and ChatGPT already sends visitors, so these get their own GA4 event
 * (ai_referral) and Plausible goal instead of hiding among "referral" and "direct". Plain bing.com referrers stay
 * out: Bing search and Copilot share them. Pure.
 */
const AI: [RegExp, string][] = [
  [/(^|\.)copilot\.microsoft\.com$|(^|\.)copilot\.cloud\.microsoft$|^edgeservices\.bing\.com$/, "copilot"],
  [/(^|\.)chatgpt\.com$|^chat\.openai\.com$/, "chatgpt"],
  [/(^|\.)perplexity\.ai$/, "perplexity"],
  [/^gemini\.google\.com$|^bard\.google\.com$/, "gemini"],
  [/(^|\.)claude\.ai$/, "claude"],
  [/^chat\.deepseek\.com$/, "deepseek"],
  [/(^|\.)meta\.ai$/, "meta-ai"],
  [/^grok\.com$/, "grok"],
];

const fromHost = (host: string) => AI.find(([re]) => re.test(host.toLowerCase()))?.[1] ?? null;

export function aiSource(referrer: string, search = ""): string | null {
  try {
    const utm = new URLSearchParams(search).get("utm_source");
    if (utm) { const hit = fromHost(utm.replace(/^https?:\/\//, "").split("/")[0]) ?? AI.find(([, name]) => utm.toLowerCase().includes(name))?.[1]; if (hit) return hit; }
  } catch { /* a bad query string is just no utm */ }
  try { return referrer ? fromHost(new URL(referrer).hostname) : null; } catch { return null; }
}
