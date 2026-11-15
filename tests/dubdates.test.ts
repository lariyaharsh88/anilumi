import { test } from "node:test";
import assert from "node:assert/strict";
import hindi from "../data/hindi-dubs.json";
import regional from "../data/regional-dubs.json";
import { dubEvents, dubWeeks, weekOf, BIG_WEEK, type DubEvent } from "../lib/dubupdates";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

test("every available dub records when it was added (the data check sets it for new entries)", () => {
  for (const e of (hindi as { entries: { s: string; status: string; added?: string }[] }).entries) if (e.status === "available") assert.match(e.added ?? "", DATE, `hindi ${e.s}`);
  for (const e of (regional as unknown as { entries: { s: string; ta?: { status: string; added?: string }; te?: { status: string; added?: string } }[] }).entries)
    for (const l of ["ta", "te"] as const) if (e[l]?.status === "available") assert.match(e[l]!.added ?? "", DATE, `${l} ${e.s}`);
});

test("weeks start on Monday; a big first check becomes one line; newest week first", () => {
  assert.equal(weekOf("2026-11-15"), "2026-11-09"); // Sunday
  assert.equal(weekOf("2026-11-16"), "2026-11-16"); // Monday
  const ev = (date: string, lang: DubEvent["lang"], t: string, kind: DubEvent["kind"] = "added"): DubEvent => ({ date, lang, kind, t, href: "/x", where: "Crunchyroll" });
  const many = Array.from({ length: BIG_WEEK + 1 }, (_, i) => ev("2026-11-15", "Tamil", `T${i}`));
  const weeks = dubWeeks([ev("2026-11-17", "Hindi", "New one"), ...many, ev("2026-11-12", "Hindi", "Older", "started")]);
  assert.deepEqual(weeks.map((w) => w.start), ["2026-11-16", "2026-11-09"]);
  assert.deepEqual(weeks[1].bulk, [{ lang: "Tamil", count: BIG_WEEK + 1, href: "/tamil-dub", first: true }]);
  assert.deepEqual(weeks[1].events.map((e) => e.t), ["Older"]);
});

test("real data: events are dated, newest first, never in the future", () => {
  const now = Date.parse("2026-11-15T12:00:00Z");
  const ev = dubEvents(now);
  assert.ok(ev.length > 100);
  assert.ok(ev.every((e, i) => i === 0 || ev[i - 1].date >= e.date));
  assert.ok(ev.every((e) => Date.parse(e.date) <= now));
});
