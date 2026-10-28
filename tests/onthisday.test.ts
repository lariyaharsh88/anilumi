import { test } from "node:test";
import assert from "node:assert/strict";
import { dateLike, dayNumber, pickOfDay, toPremieres, nowJst } from "../lib/onthisday";
import { toPreview, premiereCalendar, premiereKey } from "../lib/preview";

test("dateLike pads month and day for AniList's YYYYMMDD wildcard", () => {
  assert.equal(dateLike(10, 28), "%1028");
  assert.equal(dateLike(1, 5), "%0105");
});

test("pickOfDay cycles through every title before repeating", () => {
  const top = Array.from({ length: 300 }, (_, i) => i);
  const seen = new Set(Array.from({ length: 300 }, (_, k) => pickOfDay(top, dayNumber(2026, 1, 1) + k)));
  assert.equal(seen.size, 300);
  assert.equal(pickOfDay([], 5), null);
  assert.notEqual(pickOfDay(top, -3), undefined);
});

test("nowJst rolls over at midnight Japan time", () => {
  assert.deepEqual(nowJst(new Date("2026-10-28T15:30:00Z")), { y: 2026, m: 10, d: 29 });
  assert.deepEqual(nowJst(new Date("2026-10-28T14:30:00Z")), { y: 2026, m: 10, d: 28 });
});

test("toPremieres drops unknown years, low popularity and adult-rated matches", () => {
  const row = (id: number, year: number | null, popularity: number) => ({ id, title: { romaji: `r${id}`, english: id === 1 ? "One" : null }, startDate: { year }, format: "TV", popularity });
  const kitsu = new Map([[3, { nsfw: false, ageRating: "R18" }], [1, { nsfw: false, ageRating: "PG" }]] as [number, never][]);
  const out = toPremieres([row(1, 2010, 5000), row(2, null, 9000), row(3, 2012, 9000), row(4, 2015, 100)], kitsu);
  assert.deepEqual(out.map((p) => p.title), ["One"]);
  assert.equal(out[0].format, "TV series");
});

test("toPreview flags sequels by anime prequel, ignoring music videos; calendar groups by date", () => {
  const base = { format: "TV", episodes: 12, source: "MANGA", popularity: 1000, genres: ["Action", "Comedy", "Drama", "Sports"], studios: { nodes: [{ name: "MAPPA" }] }, coverImage: { large: null } };
  const edge = (relationType: string, format: string) => ({ relationType, node: { id: 9, type: "ANIME", format, title: { romaji: "Prev", english: null } } });
  const a = toPreview({ ...base, id: 1, title: { romaji: "A", english: null }, startDate: { year: 2027, month: 1, day: 8 }, relations: { edges: [edge("PREQUEL", "TV")] } });
  const b = toPreview({ ...base, id: 2, title: { romaji: "B", english: "Bee" }, startDate: { year: 2027, month: 1, day: 8 }, relations: { edges: [edge("PREQUEL", "MUSIC")] } });
  const c = toPreview({ ...base, id: 3, format: "MOVIE", title: { romaji: "C", english: null }, startDate: { year: 2027, month: 1, day: null }, relations: { edges: [] } });
  assert.equal(a.kind, "sequel");
  assert.equal(a.prequel?.title, "Prev");
  assert.equal(b.kind, "new");
  assert.equal(b.title, "Bee");
  assert.equal(c.kind, "movie");
  assert.equal(a.genres.length, 3);
  assert.equal(premiereKey(c.date), null);
  assert.deepEqual(premiereCalendar([c, b, a]).map((d) => [d.date, d.items.length]), [["2027-01-08", 2]]);
});
