import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Minimums for the researched page types added in Nov 2026, so none of them can turn into a thin template page
 * (Google's scaled-content policy): each indexed page must carry its own sourced facts, not just a shell.
 */

test("strongest rankings: 15+ characters in 3+ tiers, every placement with a reason and a source", async () => {
  const { rankingSlugs, ranking, ranked } = await import("../lib/strongest");
  for (const s of rankingSlugs()) {
    const r = ranking(s)!, all = ranked(r);
    assert.ok(all.length >= 15, `${s}: ${all.length} characters`);
    assert.ok(r.tiers.length >= 3, `${s}: ${r.tiers.length} tiers`);
    assert.ok(r.basis && r.notes && r.asOf, `${s}: basis, notes and asOf`);
    for (const c of all) {
      assert.ok(c.why.length >= 40, `${s}/${c.name}: reason too short`);
      assert.ok(c.sources.length >= 1, `${s}/${c.name}: no source`);
    }
  }
});

test("powers pages: 4+ explained abilities, a summary, and sources on everything", async () => {
  const { powersSlugs, powersFor } = await import("../lib/powers");
  for (const s of powersSlugs()) {
    const p = powersFor(s)!;
    assert.ok(p.abilities.length >= 4, `${s}: ${p.abilities.length} abilities`);
    assert.ok(p.summary.length >= 80, `${s}: summary`);
    for (const x of [...p.abilities, ...p.forms]) {
      assert.ok(x.what.length >= 30, `${s}/${x.name}: explanation too short`);
      assert.ok((x.sources?.length ?? 0) >= 1, `${s}/${x.name}: no source`);
    }
  }
});

test("classic films: each director page has 4+ films, every film has sources and data for all three countries", async () => {
  const { DIRECTORS, filmsBy, classicFilms, REGIONS } = await import("../lib/classicfilms");
  for (const d of Object.keys(DIRECTORS) as (keyof typeof DIRECTORS)[]) assert.ok(filmsBy(d).length >= 4, `${d}: ${filmsBy(d).length} films`);
  for (const f of classicFilms()) {
    assert.ok(f.sources.length >= 1, `${f.t}: no source`);
    for (const r of REGIONS) assert.ok(Array.isArray(f.regions[r]), `${f.t}: ${r} not researched`);
  }
});

test("lists: underrated, overpowered MC and bounties stay substantial and sourced", async () => {
  const { gems } = await import("../lib/underrated");
  assert.ok(gems().length >= 40, `underrated: ${gems().length}`);
  const op = (await import("../data/op-mc-anime.json")).default as { titles: { t: string; how: string; sources: string[] }[] };
  assert.ok(op.titles.length >= 20, `op mc: ${op.titles.length}`);
  for (const x of op.titles) assert.ok(x.how.length >= 40 && x.sources.length >= 1, `op mc ${x.t}`);
  const b = (await import("../data/one-piece-bounties.json")).default as { bounties: { name: string; sources: string[] }[] };
  assert.ok(b.bounties.length >= 30, `bounties: ${b.bounties.length}`);
  for (const x of b.bounties) assert.ok(x.sources.length >= 2, `bounty ${x.name}: needs two sources`);
});

test("franchise watch sections: every TV and streaming line is specific, TV lines are sourced", async () => {
  const { filmFranchises } = await import("../lib/franchisefilms");
  for (const f of filmFranchises()) {
    if (!f.watch) continue;
    assert.ok(f.watch.about.length >= 80, `${f.slug}: about`);
    for (const t of f.watch.tv) assert.ok(t.note.length >= 40 && t.sources.length >= 1, `${f.slug}/${t.channel}`);
    for (const x of f.watch.streaming) assert.ok(x.what.length >= 20, `${f.slug}/${x.service}`);
  }
});

test("season India guides: every streaming, region and earlier-season claim has a source; enough shows researched", async () => {
  const d = (await import("../data/season-india.json")).default as unknown as { seasons: Record<string, { checked: string; shows: { anilistId: number; streaming: { service: string; sources: string[] }[]; notIndia?: { sources: string[] } | null; previousSeasonIndia: { sources: string[] } | null }[] }> };
  const https = (xs: string[]) => xs.some((u) => /^https:\/\//.test(u));
  for (const [k, s] of Object.entries(d.seasons)) {
    assert.ok(s.shows.length >= 20, `${k}: only ${s.shows.length} shows researched`);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(s.checked), `${k}: checked date`);
    for (const x of s.shows) {
      for (const st of x.streaming) assert.ok(st.service && https(st.sources), `${k}/${x.anilistId}: ${st.service} without a source`);
      if (x.notIndia) assert.ok(https(x.notIndia.sources), `${k}/${x.anilistId}: region exclusion without a source`);
      if (x.previousSeasonIndia) assert.ok(https(x.previousSeasonIndia.sources), `${k}/${x.anilistId}: earlier season without a source`);
    }
  }
});
