import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, vaPath, vaIdFromParam, sameName, cleanBio, alSequelFrom } from "../lib/anilist";
import { sequelVerdict, seasonGaps, humanMonths, monthsBetween } from "../lib/sequel";
import type { Anime } from "../lib/kitsu";

test("voice actor paths are stable and parse back to the id", () => {
  assert.equal(slugify("Yūki Kaji"), "yuki-kaji");
  assert.equal(vaPath({ id: 95672, name: "Yuuki Kaji" }), "/voice-actor/95672-yuuki-kaji");
  assert.equal(vaIdFromParam("95672-yuuki-kaji"), 95672);
  assert.equal(vaIdFromParam("95672"), 95672);
  assert.equal(vaIdFromParam("kaji"), null);
});

test("sameName ignores order, case and accents", () => {
  assert.ok(sameName("Eren Yeager", "yeager eren"));
  assert.ok(sameName("Rimuru Tempest", "Rímuru  Tempest"));
  assert.ok(!sameName("Eren Yeager", "Zeke Yeager"));
  assert.ok(!sameName("", ""));
});

test("cleanBio strips links, spoilers and role lists, and extracts facts", () => {
  const md = "[Profile](https://x.jp) | [Twitter](https://t.co/x)\n\n__Height:__ 168 cm\n__Blood Type:__ AB\n\nKaji won Best Actor at the [Seiyu Awards](https://a.b). ~!Secret twist!~\n\n__Non-Anime Roles:__\n- [Link](https://anilist.co/character/1) - Hyrule Warriors\n\nHe married in 2019.";
  const { text, facts } = cleanBio(md);
  assert.deepEqual(facts, [{ label: "Height", value: "168 cm" }, { label: "Blood Type", value: "AB" }]);
  assert.match(text, /^Kaji won Best Actor at the Seiyu Awards\./);
  assert.ok(!/Twitter|Secret|Hyrule|https/.test(text), text);
  assert.match(text, /He married in 2019\./);
  assert.deepEqual(cleanBio(null), { text: "", facts: [] });
});

test("alSequelFrom picks the anime sequel and keeps partial dates as 'expected'", () => {
  const node = (status: string, startDate: { year: number | null; month: number | null; day: number | null }, type = "ANIME") => ({ id: 9, type, format: "TV", status, title: { romaji: "Foo 2", english: null }, startDate });
  assert.equal(alSequelFrom([{ relationType: "SEQUEL", node: node("NOT_YET_RELEASED", { year: 2027, month: 1, day: 9 }, "MANGA") }]), null);
  const dated = alSequelFrom([{ relationType: "PREQUEL", node: node("FINISHED", { year: 2020, month: 1, day: 1 }) }, { relationType: "SEQUEL", node: node("NOT_YET_RELEASED", { year: 2027, month: 1, day: 9 }) }])!;
  assert.equal(dated.startDate, "2027-01-09");
  assert.equal(dated.status, "upcoming");
  const partial = alSequelFrom([{ relationType: "SEQUEL", node: node("NOT_YET_RELEASED", { year: 2027, month: 4, day: null }) }])!;
  assert.equal(partial.startDate, null);
  assert.equal(partial.expected, "April 2027");
  assert.equal(alSequelFrom([{ relationType: "SEQUEL", node: node("CANCELLED", { year: null, month: null, day: null }) }]), null);
});

const anime = (p: Partial<Anime>) => ({ title: "Show", status: "finished", startDate: null, endDate: null, ...p }) as Anime;
const NOW = new Date("2026-10-23T00:00:00Z");

test("sequelVerdict covers every state", () => {
  const a = anime({ title: "Frieren", endDate: "2024-03-22" });
  assert.equal(sequelVerdict(a, anime({ title: "S2", status: "finished", startDate: "2025-01-01" }), NOW).kind, "out");
  assert.equal(sequelVerdict(a, anime({ title: "S2", status: "current" }), NOW).kind, "airing");
  const dated = sequelVerdict(a, anime({ title: "S2", status: "upcoming", startDate: "2027-01-09" }), NOW);
  assert.equal(dated.kind, "dated");
  assert.match(dated.headline, /January 9, 2027/);
  assert.equal(sequelVerdict(a, anime({ title: "S2", status: "upcoming", startDate: "2026-01-01" }), NOW).kind, "announced", "a past date on an unreleased entry is not a date");
  assert.match(sequelVerdict(a, { title: "S2", status: "upcoming", startDate: null, endDate: null, expected: "April 2027" }, NOW).detail, /April 2027/);
  assert.equal(sequelVerdict(anime({ status: "current" }), null, NOW).kind, "still-airing");
  const none = sequelVerdict(a, null, NOW);
  assert.equal(none.kind, "none");
  assert.match(none.detail, /ended 2\.5 years ago/);
});

test("season gaps and month formatting", () => {
  assert.equal(monthsBetween("2013-09-28", "2017-04-01"), 42);
  assert.deepEqual(seasonGaps([{ startDate: "2013-04-07", endDate: "2013-09-28" }, { startDate: "2017-04-01", endDate: "2017-06-17" }, { startDate: "2018-07-23", endDate: null }]), [42, 13]);
  assert.equal(humanMonths(1), "1 month");
  assert.equal(humanMonths(13), "13 months");
  assert.equal(humanMonths(42), "3.5 years");
});
