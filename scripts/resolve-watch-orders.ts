/** Dev tool: resolve each slug to its franchise root and print the generated core sequence.
 *  Usage: npx tsx scripts/resolve-watch-orders.ts slug1 slug2 …   (no args = all override keys) */
import { getAnimeBySlug, buildWatchOrder } from "../lib/kitsu";
import { WATCH_ORDER_OVERRIDES } from "../data/watch-orders";

async function main() {
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(WATCH_ORDER_OVERRIDES);
  for (const slug of slugs) {
    const a = await getAnimeBySlug(slug);
    if (!a) { console.log(`${slug}\tNOT_FOUND`); continue; }
    const wo = await buildWatchOrder(a);
    const keyed = Boolean(wo.intro);
    const mains = wo.entries.filter((e) => e.kind === "main").map((e) => `${e.anime.slug}[${e.anime.subtype} ${e.anime.startDate?.slice(0, 4) ?? "?"}]`);
    const movies = wo.entries.filter((e) => e.kind === "movie").map((e) => e.anime.slug);
    const skipped = wo.entries.filter((e) => e.kind === "recap" || e.kind === "alt").length;
    console.log(`${slug}\tfirst=${wo.root.slug}\toverride=${keyed ? "yes" : "no"}\n   main: ${mains.join(" > ")}\tskippable=${skipped}\n   movies: ${movies.join(", ") || "-"}`);
  }
}
main();
