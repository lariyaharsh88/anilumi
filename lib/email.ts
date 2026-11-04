/**
 * Email through Resend's HTTP API (plain fetch, so it runs on Workers and in GitHub Actions scripts alike).
 * Off without RESEND_API_KEY: callers check emailEnabled() and the site behaves as before.
 */
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY);
export const EMAIL_SITE = (process.env.EMAIL_SITE_URL || "https://anilumi.in").replace(/\/$/, "");
const FROM = () => process.env.EMAIL_FROM || "AniLumi <alerts@anilumi.in>";

export type Mail = { to: string; subject: string; html: string; text: string; headers?: Record<string, string>; tag?: string };

const body = (m: Mail) => ({ from: FROM(), to: [m.to], subject: m.subject, html: m.html, text: m.text, headers: m.headers, tags: m.tag ? [{ name: "type", value: m.tag }] : undefined });

async function post(path: string, payload: unknown, idempotencyKey?: string): Promise<Response> {
  return fetch(`https://api.resend.com${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
}

/** One email; never throws. */
export async function sendMail(m: Mail, idempotencyKey?: string): Promise<{ ok: boolean; error?: string }> {
  if (!emailEnabled()) return { ok: false, error: "email off" };
  try {
    const r = await post("/emails", body(m), idempotencyKey);
    return r.ok ? { ok: true } : { ok: false, error: `${r.status} ${(await r.text()).slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: (e as Error).name };
  }
}

/** Many emails, 100 per request (Resend's batch limit). Returns how many were accepted. */
export async function sendMails(ms: Mail[], idempotencyKey?: string): Promise<{ sent: number; errors: string[] }> {
  let sent = 0;
  const errors: string[] = [];
  for (let i = 0; i < ms.length; i += 100) {
    const chunk = ms.slice(i, i + 100);
    try {
      const r = await post("/emails/batch", chunk.map(body), idempotencyKey && `${idempotencyKey}:${i / 100}`);
      if (r.ok) sent += chunk.length; else errors.push(`${r.status} ${(await r.text()).slice(0, 200)}`);
    } catch (e) {
      errors.push((e as Error).name);
    }
  }
  return { sent, errors };
}

/** RFC 8058 one-click unsubscribe headers, so Gmail and others show their own Unsubscribe button. */
export const unsubHeaders = (token: string) => ({
  "List-Unsubscribe": `<${EMAIL_SITE}/api/lead/unsubscribe?t=${token}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});
export const unsubUrl = (token: string) => `${EMAIL_SITE}/unsubscribe?t=${token}`;
