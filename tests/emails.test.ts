import { test } from "node:test";
import assert from "node:assert/strict";
import { confirmMail, digestMail, episodeMail, type LeadDoc } from "../lib/emails";
import { buildDigest } from "../lib/pushplan";
import type { AiringShow } from "../lib/airing";

const lead: LeadDoc = { email: "fan@example.com", kind: "alert", animeId: "7442", animeTitle: "Attack <on> Titan", token: "tok_abcdefghijklmnopqrst" };

test("confirmation email: confirm link, no unsubscribe headers, escaped titles", () => {
  const m = confirmMail(lead);
  assert.equal(m.to, "fan@example.com");
  assert.match(m.html, /\/api\/lead\/confirm\?t=tok_abcdefghijklmnopqrst/);
  assert.match(m.text, /\/api\/lead\/confirm\?t=tok_abcdefghijklmnopqrst/);
  assert.ok(!m.html.includes("<on>") && m.html.includes("&lt;on&gt;"));
  assert.equal(m.headers, undefined);
});

test("cheat sheet confirmation links the cheat sheet straight away", () => {
  const m = confirmMail({ ...lead, kind: "cheatsheet", page: "/season/2027/winter/preview" });
  assert.match(m.html, /\/season\/2027\/winter\/cheatsheet/);
});

test("episode and digest emails carry one-click unsubscribe", () => {
  const e = episodeMail(lead, { key: "a:7442:5", topic: "a:7442", title: "Show: episode 5 is out", body: "Where to watch", url: "/anime/show/episode/5" });
  assert.equal(e.headers?.["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.match(e.headers?.["List-Unsubscribe"] || "", /\/api\/lead\/unsubscribe\?t=tok_/);
  assert.match(e.html, /\/unsubscribe\?t=tok_/);
  assert.match(e.html, /https:\/\/anilumi\.in\/anime\/show\/episode\/5/);
});

test("digest: next 7 days only, premieres apart from episodes, most popular kept", () => {
  const now = Date.UTC(2026, 10, 6, 3);
  const at = (days: number) => Math.floor((now + days * 86400_000) / 1000);
  const show = (a: number, p: number, n: [number, number][]): AiringShow => ({ a, k: String(a), s: `show-${a}`, t: `Show ${a}`, p, e: 12, d: null, n });
  const d = buildDigest([show(1, 900, [[5, at(2)]]), show(2, 500, [[1, at(3)]]), show(3, 800, [[9, at(9)]]), show(4, 100, [[4, at(-1)], [5, at(6)]])], [{ title: "News", url: "https://x.test/n", source: "ANN" }], now);
  assert.deepEqual(d.premieres.map((x) => x.title), ["Show 2"]);
  assert.deepEqual(d.episodes.map((x) => [x.title, x.episode]), [["Show 1", 5], ["Show 4", 5]]);
  const m = digestMail({ ...lead, kind: "digest" }, d);
  assert.match(m.subject, /This week in anime/);
  assert.match(m.html, /show-2/);
});

test("digest: the week's birthdays, most-favourited first, listed soonest first with a link", async () => {
  const { weekBirthdays } = await import("../lib/pushplan");
  const now = Date.parse("2026-11-09T03:00:00Z"); // Mon 9 Nov in Japan
  const c = (id: number, n: string, m: number, d: number, f: number) => ({ id, n, i: null, m, d, f, s: null, t: "Show" });
  const chars = [c(1, "Later", 11, 14, 500), c(2, "Today", 11, 9, 100), c(3, "Next week", 11, 16, 9000), c(4, "Tiny", 11, 10, 1)];
  const w = weekBirthdays(chars, (id) => (id === 2 ? "/character/today" : null), now);
  assert.deepEqual(w.map((x) => x.name), ["Today", "Tiny", "Later"]); // 16 Nov is 8 days on
  assert.equal(w[0].url, "/character/today");
  assert.equal(w[2].url, "/birthdays/november/14");
  assert.match(w[0].day, /Mon 9 Nov/);
  const m = digestMail({ ...lead, kind: "digest" }, { week: "9–16 Nov", premieres: [], episodes: [], news: [], birthdays: w });
  assert.match(m.html, /Birthdays this week/);
  assert.match(m.text, /BIRTHDAYS THIS WEEK\n- Today, Show/);
});
