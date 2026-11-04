/**
 * Web push alerts: topics, the push services we accept and the VAPID public key. Shared by the subscribe route
 * (app/api/push), the bell button (components/PushButton.tsx) and the sender (scripts/send-push.mts). Pure.
 * Topics: "a:<Kitsu anime id>" = a new episode (or the premiere) aired · "c:<AniList character id>" = birthday.
 */
import vapid from "@/data/vapid.json";

/** The public half of the VAPID key pair (data/vapid.json); null until it's generated, which hides the buttons. */
export const VAPID_PUBLIC_KEY: string | null = (vapid as { publicKey: string | null }).publicKey;

export const MAX_TOPICS = 60;
export const isTopic = (t: unknown): t is string => typeof t === "string" && /^[ac]:\d{1,9}$/.test(t);
export const animeTopic = (kitsuId: string) => `a:${kitsuId}`;
export const charTopic = (anilistId: number) => `c:${anilistId}`;

// Browser push services only, so a stored subscription can't make the sender call some other server.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /\.notify\.windows\.com$/, /^push\.services\.mozilla\.com$/];

export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };

/** A browser PushSubscription (toJSON) from an accepted push service, or null. */
export function cleanSub(s: unknown): PushSub | null {
  const o = s as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  if (!o || typeof o.endpoint !== "string" || o.endpoint.length > 1000) return null;
  let u: URL;
  try { u = new URL(o.endpoint); } catch { return null; }
  if (u.protocol !== "https:" || !PUSH_HOSTS.some((h) => h.test(u.hostname))) return null;
  const { p256dh, auth } = o.keys || {};
  const b64 = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max && /^[A-Za-z0-9_-]+=*$/.test(v);
  if (!b64(p256dh, 120) || !b64(auth, 40)) return null;
  return { endpoint: o.endpoint, keys: { p256dh, auth } };
}
