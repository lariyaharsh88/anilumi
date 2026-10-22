/** Compare Kitsu vs MyAnimeList (Jikan) "last aired episode" for currently airing shows.
 *  Run with JIKAN_ENRICH=1: `JIKAN_ENRICH=1 npx tsx scripts/check-jikan.ts [slug …]` */
import { getAnimeBySlug, listAnime, getLastAired, getMalLastAired, getLastAiredBest, getMalId, seasonOf, uniqueById, Anime } from "../lib/kitsu";

async function main() {
  if (process.env.JIKAN_ENRICH !== "1") console.warn("JIKAN_ENRICH is not 1; MAL lookups will be skipped");
  let shows: Anime[];
  if (process.argv.length > 2) {
    shows = (await Promise.all(process.argv.slice(2).map((s) => getAnimeBySlug(s)))).filter((a): a is Anime => Boolean(a));
  } else {
    const { season, year } = seasonOf();
    const [seasonal, longRunning] = await Promise.all([
      listAnime({ filter: { status: "current", season, seasonYear: String(year) }, sort: "-userCount", limit: 10 }),
      listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 8 }),
    ]);
    shows = uniqueById([...longRunning.items, ...seasonal.items]);
  }
  let improved = 0, malOk = 0;
  for (const a of shows) {
    const t0 = Date.now();
    const [k, malId, m, best] = await Promise.all([getLastAired(a.id), getMalId(a.id), getMalLastAired(a.id), getLastAiredBest(a.id)]);
    const src = best.source ?? "kitsu";
    if (m) malOk++;
    const nextBefore = a.nextRelease && k.reliable ? k.lastAired + 1 : null;
    const nextAfter = (best.nextAt || a.nextRelease) && best.reliable ? best.lastAired + 1 : null;
    if (!nextBefore && nextAfter) improved++;
    console.log(
      [a.slug.padEnd(42), `mal=${malId ?? "-"}`.padEnd(11),
       `kitsu=${k.lastAired}${k.reliable ? "" : "(stale " + (k.lastAiredDate ?? "none") + ")"}`.padEnd(30),
       `mal=${m ? `${m.lastAired} ${m.lastAiredDate}` : "null"}`.padEnd(22),
       `next ep: ${nextBefore ?? "-"} -> ${nextAfter ?? "-"} via ${src}${best.nextAt ? ` @ ${best.nextAt.slice(0, 16)}Z` : ""}`.padEnd(48), `${Date.now() - t0}ms`].join(" "),
    );
  }
  console.log(`\n${shows.length} airing shows · MAL answered for ${malOk} · numbered next-episode pages gained: ${improved}`);
}
main();
