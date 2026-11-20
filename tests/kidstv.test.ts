import { test } from "node:test";
import assert from "node:assert/strict";
import { airingLabel, channelHref, channelPremieres, dateLabel, kidsChannels, latestTimings, kidsPageChannels, kidsShow, recentlyOnAir, showIndex, showHref, streamsNow, KIDS_TV_CHECKED } from "../lib/kidstv";
import { dubBySlug, hindiPlatform, platformKind } from "../lib/hindidub";

test("kids TV: every channel–show pair has a source that isn't only Wikipedia, and dates are well-formed", () => {
  for (const c of kidsChannels()) {
    assert.ok(c.summary && c.shows.length, c.slug);
    for (const r of c.shows) {
      kidsShow(r.show); // throws on an unknown show id
      assert.ok(r.sources.length >= 1 && r.sources.every((u) => /^https:\/\//.test(u)), `${c.slug}/${r.show} sources`);
      assert.ok(r.sources.some((u) => !/wikipedia\.org/.test(u)), `${c.slug}/${r.show} needs a non-Wikipedia source`);
      if (r.lastSeen) {
        assert.match(r.lastSeen, /^\d{4}-\d{2}$/, `${c.slug}/${r.show} lastSeen`);
        assert.ok(r.lastSeen <= KIDS_TV_CHECKED.slice(0, 7), `${c.slug}/${r.show} lastSeen after the check`);
      }
    }
    if (c.parent) assert.ok(kidsChannels().some((p) => p.slug === c.parent && p.page), `${c.slug} parent`);
  }
});

test("kids TV: channel pages are Hindi platform pages, TV-kind, and linked shows have an available dub", () => {
  for (const c of kidsPageChannels()) {
    const p = hindiPlatform(c.slug);
    assert.ok(p, `${c.slug} is in HINDI_PLATFORMS`);
    assert.equal(platformKind(p.label), "tv", c.slug);
    assert.equal(channelHref(c), `/hindi-dub/${c.slug}`);
  }
  assert.equal(channelHref(kidsChannels().find((c) => c.slug === "sonic")!), "/hindi-dub/nickelodeon#sonic");
  for (const { s } of showIndex()) {
    if (s.dub) assert.equal(dubBySlug(s.dub)?.status, "available", s.id);
    assert.equal(Boolean(showHref(s)), Boolean(s.dub), s.id);
    assert.ok(streamsNow(s).every((x) => platformKind(x.name) !== "tv"), s.id);
  }
});

test("kids TV: 'still airing' says yes only for a report within three months", () => {
  const row = (lastSeen: string | null) => ({ show: "naruto", since: "2022", lastSeen, note: "", sources: [] });
  assert.equal(recentlyOnAir(row("2026-10"), "2026-11-20"), true);
  assert.equal(recentlyOnAir(row("2026-04"), "2026-11-20"), false);
  assert.equal(airingLabel(row("2026-10"), "2026-11-20"), "Yes, as of Oct 2026");
  assert.match(airingLabel(row("2025-09"), "2026-11-20"), /^Last reported Sept? 2025$/);
  assert.equal(airingLabel(row(null), "2026-11-20"), "Not confirmed");
  // Shows on several channels come first in the "which channel?" index.
  const idx = showIndex();
  assert.ok(idx[0].on.length >= idx[idx.length - 1].on.length);
});

test("kids TV: premieres are dated, sourced, on the channel's own list, and give one latest episode slot per show", () => {
  for (const c of kidsChannels()) {
    const ps = channelPremieres(c);
    for (const p of ps) {
      assert.ok(c.shows.some((r) => r.show === p.show), `${c.slug}/${p.show} premiere of a show not on the channel`);
      assert.match(p.date, /^\d{4}-\d{2}(-\d{2})?$/, `${c.slug}/${p.show} date`);
      assert.ok(p.date <= KIDS_TV_CHECKED, `${c.slug}/${p.show} premiere after the check`);
      assert.ok(p.sources.length && p.sources.every((u) => /^https:\/\//.test(u) && !/wikipedia\.org|fandom\.com/.test(u)), `${c.slug}/${p.show} sources`);
    }
    for (let i = 1; i < ps.length; i++) assert.ok(ps[i - 1].date >= ps[i].date, `${c.slug} premieres newest first`);
    const t = latestTimings(c);
    assert.equal(new Set(t.map((p) => p.show)).size, t.length, `${c.slug} one timing per show`);
    assert.ok(t.every((p) => p.slot && !p.film), `${c.slug} timings are episode slots`);
  }
  const yay = kidsChannels().find((c) => c.slug === "sony-yay")!;
  assert.ok(latestTimings(yay).length >= 5);
  assert.equal(dateLabel("2026-11-08"), "8 Nov 2026");
  assert.equal(dateLabel("2026-01"), "Jan 2026");
});
