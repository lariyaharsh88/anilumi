import { test } from "node:test";
import assert from "node:assert/strict";
import { groupEntries, indexXml, sitemapGroup, urlsetXml } from "../lib/sitemap-xml";

test("sitemap: each URL lands in its page type's child sitemap", () => {
  const g = (p: string) => sitemapGroup(`https://anilumi.in${p}`);
  assert.equal(g("/anime/one-piece"), "anime");
  assert.equal(g("/anime/one-piece/how-long-to-watch"), "anime");
  assert.equal(g("/anime/Black-Clover-Season-2/episode/7"), "episodes");
  assert.equal(g("/character/eren-jager"), "characters");
  assert.equal(g("/watch-order/naruto"), "watch-orders");
  assert.equal(g("/birthdays/october/31"), "birthdays");
  assert.equal(g("/hi/anime/naruto"), "hindi");
  assert.equal(g("/anime/one-piece/hindi-dub"), "hindi");
  assert.equal(g("/anime-streaming-sites"), "hindi");
  assert.equal(g("/free-anime-websites"), "hindi");
  assert.equal(g("/anime/naruto/tamil-dub"), "hindi");
  assert.equal(g("/anime/naruto/telugu-dub"), "hindi");
  assert.equal(g("/similar"), "lists");
  assert.equal(g("/best-anime"), "lists");
  assert.equal(g("/anime-salt-alternatives"), "hindi");
  assert.equal(g("/download-anime-in-hindi"), "hindi");
  assert.equal(g("/crunchyroll-price-india"), "hindi");
  assert.equal(g("/hindi-dub/this-week"), "hindi");
  assert.equal(g("/voice-actor/95869-saori-hayami"), "people");
  assert.equal(g("/hindi-voice-artist/sanket-mhatre"), "people");
  assert.equal(g("/hindi-voice-artists"), "people");
  assert.equal(g("/genre/action"), "lists");
  assert.equal(g("/about"), "pages");
});

test("sitemap: XML escapes, carries images and hreflang, and the index lists non-empty groups", () => {
  const xml = urlsetXml([{ url: "https://anilumi.in/a?x=1&y=2", lastModified: new Date("2026-11-09T00:00:00Z"), images: ["https://img/x.jpg"], alternates: { languages: { hi: "https://anilumi.in/hi/a" } } }]);
  assert.match(xml, /<loc>https:\/\/anilumi.in\/a\?x=1&amp;y=2<\/loc>/);
  assert.match(xml, /<image:image><image:loc>https:\/\/img\/x.jpg<\/image:loc><\/image:image>/);
  assert.match(xml, /hreflang="hi" href="https:\/\/anilumi.in\/hi\/a"/);
  const groups = groupEntries([{ url: "https://anilumi.in/character/l" }]);
  assert.equal(groups.get("characters")!.length, 1);
  assert.match(indexXml([{ group: "characters", lastModified: null }]), /<loc>[^<]*\/sitemaps\/characters.xml<\/loc>/);
});
