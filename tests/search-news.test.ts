import { test } from "node:test";
import assert from "node:assert/strict";
import { norm, editDistance, buildIndex, aliasLookup, type AliasEntry } from "../lib/aliases";
import { parseRss, buildMatchers, animeInHeadline, newsAbout, type NewsItem } from "../lib/news";

const E = (i: string, t: string, r: number, n: string[]): AliasEntry => ({ i, s: t.toLowerCase().replace(/\W+/g, "-"), t, r, n: n.map(norm) });
const idx = buildIndex([
  E("1", "Attack on Titan", 0, ["Attack on Titan", "Shingeki no Kyojin", "SnK", "AoT"]),
  E("2", "Attack on Titan Chibi Theatre", 900, ["Attack on Titan Chibi Theatre", "SnK Chibi"]),
  E("3", "Jujutsu Kaisen", 40, ["Jujutsu Kaisen", "JJK"]),
  E("4", "Jujutsu Kaisen Season 2", 60, ["Jujutsu Kaisen Season 2", "JJK"]),
  E("5", "One Piece", 13, ["One Piece", "OP"]),
]);

test("norm strips accents, case and punctuation", () => {
  assert.equal(norm("Re:Zero – Kara Hajimeru!"), "rezerokarahajimeru");
  assert.equal(norm("Pokémon"), "pokemon");
});

test("editDistance counts swaps as one and stops early", () => {
  assert.equal(editDistance("onepeice", "onepiece", 2), 1);
  assert.equal(editDistance("attak", "attack", 2), 1);
  assert.equal(editDistance("abcdef", "uvwxyz", 2), 3);
});

test("aliasLookup: exact nickname, most popular first", () => {
  assert.deepEqual(aliasLookup("snk", 5, idx).map((h) => [h.id, h.kind]), [["1", "exact"]]);
  assert.deepEqual(aliasLookup("JJK", 5, idx).map((h) => h.id), ["3", "4"]);
});

test("aliasLookup: prefix, then typo tolerance, else nothing", () => {
  assert.deepEqual(aliasLookup("shingeki", 5, idx).map((h) => [h.id, h.kind]), [["1", "prefix"]]);
  assert.deepEqual(aliasLookup("one peice", 5, idx).map((h) => [h.id, h.kind]), [["5", "fuzzy"]]);
  assert.deepEqual(aliasLookup("zzzzzzzz", 5, idx), []);
  assert.deepEqual(aliasLookup("x", 5, idx), []);
});

test("parseRss decodes entities and CDATA, skips items without a link", () => {
  const xml = `<rss><channel>
    <item><title>Frieren &amp; Fern Return</title><link>https://ann.example/a</link><guid>g1</guid><pubDate>Wed, 28 Oct 2026 08:44:31 -0400</pubDate><category>Anime</category><description><![CDATA[New <b>trailer</b> &#8212; out now]]></description></item>
    <item><title>Manga</title><link>https://ann.example/b</link><description>&lt;cite&gt;Kimi to Sakura&lt;/cite&gt; debuts</description></item>
    <item><title>No link</title></item>
  </channel></rss>`;
  const items = parseRss(xml);
  assert.equal(items.length, 2);
  assert.equal(items[1].summary, "Kimi to Sakura debuts");
  assert.equal(items[0].title, "Frieren & Fern Return");
  assert.equal(items[0].summary, "New trailer — out now");
  assert.equal(items[0].date, "2026-10-28T12:44:31.000Z");
  assert.equal(items[0].category, "Anime");
});

test("animeInHeadline prefers the most specific title and ignores short names", () => {
  const ms = buildMatchers([E("3", "Jujutsu Kaisen", 40, []), E("4", "Jujutsu Kaisen Season 2", 60, []), E("6", "K", 5, []), E("5", "One Piece", 13, [])]);
  assert.deepEqual(animeInHeadline("Jujutsu Kaisen Season 2 Gets New Trailer", ms).map((a) => a.title), ["Jujutsu Kaisen Season 2"]);
  assert.deepEqual(animeInHeadline("One Piece and Jujutsu Kaisen top polls", ms).map((a) => a.title), ["Jujutsu Kaisen", "One Piece"]);
  assert.deepEqual(animeInHeadline("K-pop star joins cast", ms), []);
});

test("newsAbout matches any title variant", () => {
  const n = (title: string): NewsItem => ({ id: title, title, summary: "", url: "https://x", date: "", category: "Anime", anime: [] });
  const items = [n("Sousou no Frieren Season 3 Teaser"), n("Frieren: Beyond Journey's End Wins Award"), n("Unrelated Game")];
  assert.equal(newsAbout(items, ["Sousou no Frieren", "Frieren: Beyond Journey's End"]).length, 2);
});
