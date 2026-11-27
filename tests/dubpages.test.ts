import { test } from "node:test";
import assert from "node:assert/strict";
import { dubPageEntry, hindiStatus, notDubbed, statusIndexed, statusSlugs, STATUS_PAGES } from "../lib/hindidub";
import { REGIONAL_PLATFORM_MIN, regionalPlatform, regionalPlatforms, platformLabel } from "../lib/regionaldub";
import { HINDI_PLATFORMS } from "../lib/hindidub";

test("Hindi status pages: announced dubs and the most-watched without one, never a show that's already in Hindi", () => {
  const slugs = statusSlugs();
  assert.ok(slugs.length >= STATUS_PAGES, `only ${slugs.length} status pages`);
  for (const s of slugs) {
    const st = hindiStatus(s)!;
    assert.ok(st, s);
    assert.equal(dubPageEntry(s), null, `${s} is already dubbed`);
    assert.ok(st.checked && st.t, s);
    if (st.kind === "announced") assert.ok(st.service, s);
    assert.ok(statusIndexed(s));
  }
  assert.ok(slugs.some((s) => hindiStatus(s)!.kind === "announced"));
  // A show checked without a dub, beyond the indexed top, still answers (noindexed).
  const tail = notDubbed().slice(STATUS_PAGES).find((d) => hindiStatus(d.s));
  if (tail) assert.equal(statusIndexed(tail.s), false);
  // A show with a Hindi dub gets the dub page, not a status page.
  assert.equal(hindiStatus("shingeki-no-kyojin"), null);
});

test("Tamil and Telugu platform pages: real platforms with enough titles, YouTube left to Muse India", () => {
  for (const l of ["ta", "te"] as const) {
    const ps = regionalPlatforms(l);
    assert.ok(ps.length >= 2, l);
    assert.ok(ps.every((x) => x.titles.length >= REGIONAL_PLATFORM_MIN));
    assert.ok(ps.every((x) => HINDI_PLATFORMS.some((p) => p.slug === x.p.slug)));
    assert.equal(regionalPlatform(l, "youtube"), null);
    assert.ok(regionalPlatform(l, "crunchyroll"));
  }
  assert.equal(platformLabel(HINDI_PLATFORMS.find((p) => p.slug === "muse-india")!), "Muse India");
});
