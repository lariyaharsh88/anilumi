/**
 * My list sync without accounts: a private code identifies one shared copy of the list. Pure helpers for the
 * code format and for merging two copies, shared by the client (lib/sync.ts) and the API (app/api/sync).
 */
import type { WatchItem } from "./watchlist";

export type SyncDoc = { items: WatchItem[]; removed: Record<string, number> };

// Crockford base32: no I, L, O or U, so codes read aloud and typed by hand survive.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const MAX_ITEMS = 3000;
const TOMBSTONE_DAYS = 365;

/** 16 random characters as XXXX-XXXX-XXXX-XXXX (80 bits). `bytes` must hold 16 random bytes. */
export function formatCode(bytes: Uint8Array): string {
  const chars = [...bytes.slice(0, 16)].map((b) => ALPHABET[b % 32]).join("");
  return chars.match(/.{4}/g)!.join("-");
}

/** Accepts lower case, spaces, missing dashes and look-alikes (O→0, I/L→1); null if it isn't a code. */
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  return /^[0-9A-HJKMNP-TV-Z]{16}$/.test(s) ? s.match(/.{4}/g)!.join("-") : null;
}

const edited = (i: WatchItem) => i.editedAt ?? i.addedAt ?? 0;

/**
 * Merge two copies: for each show the more recently edited copy wins; a removal wins over any edit made
 * before it. Old removal markers are dropped after a year. Pure.
 */
export function mergeLists(a: SyncDoc, b: SyncDoc, now = Date.now()): SyncDoc {
  const removed: Record<string, number> = {};
  for (const src of [a.removed, b.removed]) for (const [id, t] of Object.entries(src || {})) if (t > (removed[id] || 0)) removed[id] = t;
  const byId = new Map<string, WatchItem>();
  for (const it of [...(a.items || []), ...(b.items || [])]) {
    const prev = byId.get(it.id);
    if (!prev || edited(it) > edited(prev)) byId.set(it.id, it);
  }
  const items = [...byId.values()].filter((i) => !(removed[i.id] > edited(i))).sort((x, y) => (x.addedAt || 0) - (y.addedAt || 0)).slice(-MAX_ITEMS);
  const cutoff = now - TOMBSTONE_DAYS * 86400000;
  for (const id of Object.keys(removed)) if (removed[id] < cutoff || byId.get(id) && !(removed[id] > edited(byId.get(id)!))) delete removed[id];
  return { items, removed };
}

/** Stable fingerprint of a list, to skip pushes when nothing changed. Pure. */
export function listHash(d: SyncDoc): string {
  const items = [...d.items].sort((x, y) => x.id.localeCompare(y.id)).map((i) => `${i.id}:${edited(i)}:${i.progress ?? ""}:${i.listStatus ?? ""}`);
  const removed = Object.keys(d.removed).sort().map((k) => `${k}:${d.removed[k]}`);
  return `${items.join("|")}#${removed.join("|")}`;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const STATUSES = ["watching", "planning", "paused", "rewatching"] as const;

/** Keep only known fields with sane sizes: the server never stores arbitrary client JSON. Pure. */
export function cleanDoc(raw: unknown): SyncDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { items?: unknown; removed?: unknown };
  if (!Array.isArray(r.items)) return null;
  const items: WatchItem[] = [];
  for (const x of r.items.slice(0, MAX_ITEMS) as Record<string, unknown>[]) {
    const id = str(x?.id, 12), slug = str(x?.slug, 200), title = str(x?.title, 300);
    if (!id || !/^\d+$/.test(id) || !slug || !title) continue;
    const listStatus = STATUSES.find((s) => s === x.listStatus);
    items.push({
      id, slug, title,
      poster: str(x.poster, 500)?.startsWith("https://") ? str(x.poster, 500) : null,
      status: str(x.status, 20) || "finished",
      nextRelease: str(x.nextRelease, 40),
      addedAt: num(x.addedAt) ?? 0,
      ...(num(x.editedAt) !== undefined ? { editedAt: num(x.editedAt) } : {}),
      ...(num(x.progress) !== undefined ? { progress: Math.max(0, Math.min(100000, Math.floor(num(x.progress)!))) } : {}),
      ...(listStatus ? { listStatus } : {}),
    });
  }
  const removed: Record<string, number> = {};
  if (r.removed && typeof r.removed === "object") for (const [k, v] of Object.entries(r.removed as Record<string, unknown>).slice(0, MAX_ITEMS)) if (/^\d{1,12}$/.test(k) && num(v)) removed[k] = num(v)!;
  return { items, removed };
}
