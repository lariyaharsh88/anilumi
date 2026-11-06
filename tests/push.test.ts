import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanSub, isTopic } from "../lib/push";
import { dueBirthdays, dueEpisodes, dueJobs, isoWeek, LOOKBACK_MS } from "../lib/pushplan";
import type { AiringShow } from "../lib/airing";
import type { BdChar } from "../lib/birthdays";

const keys = { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" };

test("push topics: anime and character ids only", () => {
  assert.ok(isTopic("a:7442") && isTopic("c:127691"));
  for (const bad of ["x:1", "a:", "a:12ab", "a:1234567890", 5, null]) assert.equal(isTopic(bad), false);
});

test("push subscriptions: browser push services over https only", () => {
  assert.ok(cleanSub({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys }));
  assert.ok(cleanSub({ endpoint: "https://wns2-par02p.notify.windows.com/w/?token=abc", keys }));
  assert.ok(cleanSub({ endpoint: "https://web.push.apple.com/QF3k", keys }));
  assert.equal(cleanSub({ endpoint: "https://evil.example.com/fcm.googleapis.com", keys }), null);
  assert.equal(cleanSub({ endpoint: "http://fcm.googleapis.com/fcm/send/abc", keys }), null);
  assert.equal(cleanSub({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "a b", auth: "c" } }), null);
  assert.equal(cleanSub("nope"), null);
});

test("due episodes: aired within the lookback, once per episode, with the episode page", () => {
  const now = Date.UTC(2026, 10, 4, 12);
  const t = (msAgo: number) => Math.floor((now - msAgo) / 1000);
  const shows: AiringShow[] = [
    { a: 1, k: "100", s: "show-a", t: "Show A", p: 1, e: 12, d: null, n: [[5, t(30 * 60_000)], [6, t(-7 * 86400_000)]] },
    { a: 2, k: "200", s: "show-b", t: "Show B", p: 1, e: 12, d: null, n: [[1, t(60_000)]] },
    { a: 3, k: "300", s: "show-c", t: "Show C", p: 1, e: 12, d: null, n: [[3, t(LOOKBACK_MS + 60_000)]] },
    { a: 4, k: null, s: null, t: "Unmatched", p: 1, e: 12, d: null, n: [[2, t(60_000)]] },
  ];
  const due = dueEpisodes(shows, now);
  assert.deepEqual(due.map((x) => x.key), ["a:100:5", "a:200:1"]);
  assert.equal(due[0].url, "/anime/show-a/episode/5");
  assert.equal(due[0].topic, "a:100");
  assert.match(due[1].title, /premiered/);
});

test("due birthdays: today's characters, linked to their page or the date page", () => {
  const c = (id: number, m: number, d: number): BdChar => ({ id, n: `Char ${id}`, i: null, m, d, f: 1, s: null, t: "Some Anime" });
  const due = dueBirthdays([c(1, 11, 4), c(2, 11, 5), c(3, 11, 4)], (id) => (id === 1 ? "/character/char-1" : null), new Date(Date.UTC(2026, 10, 4, 3, 30)));
  assert.deepEqual(due.map((x) => x.key), ["c:1:2026", "c:3:2026"]);
  assert.equal(due[0].url, "/character/char-1");
  assert.equal(due[1].url, "/birthdays/november/4");
});

test("dueJobs: birthdays from 03:30 UTC; the digest from Friday 03:30 UTC through Sunday", () => {
  const at = (iso: string) => dueJobs(new Date(iso));
  assert.deepEqual(at("2026-11-06T03:29:00Z"), { birthdays: false, digest: false }); // Friday, before
  assert.deepEqual(at("2026-11-06T07:18:00Z"), { birthdays: true, digest: true }); // Friday, after
  assert.deepEqual(at("2026-11-07T01:00:00Z"), { birthdays: false, digest: true }); // Saturday catch-up
  assert.deepEqual(at("2026-11-09T12:00:00Z"), { birthdays: true, digest: false }); // Monday
});

test("isoWeek: one key per Monday-to-Sunday week, across the year boundary", () => {
  assert.equal(isoWeek(new Date("2026-11-06T07:00:00Z")), "2026-W45");
  assert.equal(isoWeek(new Date("2026-11-08T23:00:00Z")), "2026-W45"); // Sunday, same week
  assert.equal(isoWeek(new Date("2026-11-09T00:00:00Z")), "2026-W46");
  assert.equal(isoWeek(new Date("2027-01-01T00:00:00Z")), "2026-W53");
});
