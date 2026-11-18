/**
 * Original chart images for the top ranking pages, drawn once from the site's own data and saved as static files
 * (public/charts/*.png), with data/charts.json listing them per page (src, alt). Pages show them as a figure and
 * serve them as their share image, so nothing is drawn per visit (drawing cards on request caused the Workers'
 * "Exceeded Memory" errors, Nov 2026). Posters are not used: every pixel here is ours.
 *
 *   node --import tsx scripts/make-charts.mts            # all charts
 *   node --import tsx scripts/make-charts.mts naruto     # only charts whose page path contains "naruto"
 *
 * Watch orders come from the live watch-order builder (Kitsu plus data/watch-orders.ts), filler from
 * data/filler.json, prices from data/hindi-platform-prices.json. Re-run when those change.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/dist/compiled/@vercel/og/index.node.js";
import { compactPng } from "../lib/pngcompact.ts";
import { markDataUri, BRAND } from "../lib/brand.ts";
import { getAnimeBySlug, buildWatchOrder, type WatchOrder } from "../lib/kitsu.ts";
import { fillerFor, kindRuns, type EpisodeKind } from "../lib/filler.ts";
import { pricesFor } from "../lib/platformprices.ts";
import { dubsOn, hindiPlatform } from "../lib/hindidub.ts";

const ROOT = process.cwd();
const W = 1200, H = 630;
const C = { bg: "linear-gradient(135deg,#0b0d13 0%,#161b28 65%,#2a2550 100%)", ink: "#e8ecf5", muted: "#8f9ab3", line: "#242b3b", card: "rgba(255,255,255,.05)", canon: BRAND.violet, mixed: "#ffc857", filler: BRAND.pink, recap: "#5b6478" };

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (El | string | number | null | false)[]): El => ({ type, props: { style: { display: "flex", ...style }, children: children.filter((c) => c !== null && c !== false) } });
const img = (src: string, size: number): El => ({ type: "img", props: { src, width: size, height: size, style: {} } });

const fonts = await Promise.all(([500, 800] as const).map(async (weight) => ({ name: "Inter", data: await readFile(join(ROOT, "public/fonts", `Inter-${weight}.ttf`)), weight, style: "normal" as const })));

/** The shared frame: kicker, title, subtitle, the chart body, then the brand and the page's address. */
function frame(kicker: string, title: string, sub: string, body: El, url: string): El {
  return h("div", { width: W, height: H, flexDirection: "column", padding: "44px 56px 36px", background: C.bg, color: C.ink, fontFamily: "Inter" },
    h("div", { fontSize: 20, fontWeight: 800, letterSpacing: 3, color: BRAND.pink, textTransform: "uppercase" }, kicker),
    h("div", { marginTop: 8, fontSize: title.length > 34 ? 44 : 52, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }, title),
    h("div", { marginTop: 10, fontSize: 24, fontWeight: 500, color: C.muted }, sub),
    h("div", { flex: 1, marginTop: 22, flexDirection: "column" }, body),
    h("div", { marginTop: 14, alignItems: "center", justifyContent: "space-between", fontSize: 20, color: C.muted },
      h("div", { alignItems: "center", gap: 10, fontSize: 26, fontWeight: 800, color: "#fff" }, img(markDataUri(), 32), "AniLumi"),
      h("div", {}, url)));
}

async function save(name: string, tree: El): Promise<string> {
  const res = await compactPng(new ImageResponse(tree as never, { width: W, height: H, fonts }));
  const file = join(ROOT, "public/charts", `${name}.png`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return `/charts/${name}.png`;
}

const hours = (min: number) => (min >= 90 ? `${Math.round(min / 60).toLocaleString("en-IN")} h` : `${Math.round(min)} min`);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Watch order: the main story step by step, each with its year, length and a bar for how long it takes. */
async function watchOrderChart(slug: string) {
  const a = await getAnimeBySlug(slug);
  if (!a) throw new Error(`no anime ${slug}`);
  const wo: WatchOrder = await buildWatchOrder(a);
  const mains = wo.entries.filter((e) => e.kind === "main");
  const movies = wo.entries.filter((e) => e.kind === "movie").length;
  const extras = wo.entries.filter((e) => e.kind === "side").length;
  const name = (await import("../data/watch-orders.ts")).WATCH_ORDER_OVERRIDES[slug]?.label ?? wo.root.titleEn ?? wo.root.title;
  const label = (x: (typeof mains)[number]) => { const t = x.anime.titleEn && x.anime.titleEn.length <= 42 ? x.anime.titleEn : x.anime.title; return t.length > 38 ? `${t.slice(0, 36).trimEnd()}…` : t; };
  const mins = (x: (typeof mains)[number]) => (x.anime.episodeCount ?? 1) * (x.anime.episodeLength ?? (x.anime.subtype === "movie" ? 100 : 24));
  // One main series (One Piece, Pokémon): the films are the order, so they're listed too, in watch order.
  const steps = mains.length >= 3 ? mains : wo.entries.filter((e) => e.kind === "main" || e.kind === "movie");
  const shown = steps.length > 7 ? steps.slice(0, 6) : steps;
  const max = Math.max(...shown.map(mins));
  const mainMin = mains.reduce((n, x) => n + mins(x), 0);
  const rowH = Math.min(52, Math.floor(360 / (shown.length + (steps.length > shown.length ? 1 : 0))));
  const body = h("div", { flexDirection: "column" },
    ...shown.map((x, i) => h("div", { height: rowH, alignItems: "center", gap: 16 },
      h("div", { width: 38, height: 38, borderRadius: 19, background: `linear-gradient(135deg,${BRAND.pink},${BRAND.violet})`, alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" }, String(i + 1)),
      h("div", { width: 560, flexDirection: "column" },
        h("div", { fontSize: rowH < 44 ? 22 : 25, fontWeight: 800 }, label(x)),
        h("div", { fontSize: 17, color: C.muted }, [x.anime.startDate?.slice(0, 4), x.anime.subtype === "movie" ? "film" : x.anime.episodeCount ? plural(x.anime.episodeCount, "episode") : null].filter(Boolean).join(" · "))),
      h("div", { flex: 1, alignItems: "center", gap: 12 },
        h("div", { width: Math.max(8, Math.round((mins(x) / max) * 330)), height: 14, borderRadius: 7, background: `linear-gradient(90deg,${BRAND.pink},${BRAND.violet})` }),
        h("div", { fontSize: 18, color: C.muted }, hours(mins(x)))))),
    steps.length > shown.length ? h("div", { height: rowH, alignItems: "center", paddingLeft: 54, fontSize: 22, color: C.muted }, `+ ${steps.length - shown.length} more ${steps === mains ? "parts" : "entries"} in order`) : null);
  const extrasLine = [movies && plural(movies, "movie"), extras && plural(extras, "OVA")].filter(Boolean).join(" & ");
  const tree = frame("Watch order", `${name} watch order`, `${plural(mains.length, "part")} of the main story · about ${hours(mainMin)}${extrasLine ? ` · plus ${extrasLine}` : ""}`, body, `anilumi.in/watch-order/${slug}`);
  return { path: `/watch-order/${slug}`, src: await save(`watch-order-${slug}`, tree), alt: `${name} watch order chart: ${mains.map(label).join(", then ")}${extrasLine ? `, plus ${extrasLine}` : ""}.` };
}

/** Filler: what's left to watch, the time saved, the longest run, and every episode as a coloured strip. */
async function fillerChart(slug: string, name: string, total: number) {
  const f = fillerFor(slug, total);
  if (!f) throw new Error(`no filler list ${slug}`);
  const runs = kindRuns(f);
  const skip = f.count + f.recap.size;
  const a = await getAnimeBySlug(slug);
  const len = a?.episodeLength ?? 24;
  const longest = runs.filter((r) => r.kind === "filler" || r.kind === "recap").sort((x, y) => y.to - y.from - (x.to - x.from))[0];
  const color: Record<EpisodeKind, string> = { canon: C.canon, "anime-canon": C.canon, mixed: C.mixed, filler: C.filler, recap: C.recap };
  const stat = (v: string, l: string, c = C.ink) => h("div", { flex: 1, flexDirection: "column", padding: "14px 18px", borderRadius: 16, background: C.card, border: `1px solid ${C.line}` }, h("div", { fontSize: 40, fontWeight: 800, color: c }, v), h("div", { fontSize: 18, color: C.muted }, l));
  const stripW = W - 112;
  const body = h("div", { flexDirection: "column" },
    h("div", { gap: 14 },
      stat(String(f.total - skip), "episodes to watch", "#b9b1ff"),
      stat(String(skip), "filler & recaps to skip", BRAND.pink),
      stat(hours(skip * len), "saved by skipping"),
      ...(longest && longest.to > longest.from ? [stat(`${longest.from}–${longest.to}`, "longest filler run")] : [])),
    h("div", { marginTop: 26, fontSize: 18, color: C.muted }, `Every episode, 1 to ${f.total}`),
    h("div", { marginTop: 8, width: stripW, height: 54, borderRadius: 10, overflow: "hidden", background: C.line },
      ...runs.map((r) => h("div", { width: ((r.to - r.from + 1) / f.total) * stripW, height: 54, background: color[r.kind] }))),
    h("div", { marginTop: 12, gap: 26, fontSize: 18, color: C.muted },
      ...([["Canon", C.canon], ["Mixed (watch)", C.mixed], ["Filler", C.filler], ["Recap", C.recap]] as const).map(([l, c]) => h("div", { alignItems: "center", gap: 8 }, h("div", { width: 16, height: 16, borderRadius: 4, background: c }), l))));
  const tree = frame("Filler list", `${name} filler list`, `${f.count} of ${f.total} episodes are filler (${Math.round(f.share)}%)${f.recap.size ? ` plus ${f.recap.size} recaps` : ""}`, body, `anilumi.in/anime/${slug}/filler-list`);
  return { path: `/anime/${slug}/filler-list`, src: await save(`filler-${slug}`, tree), alt: `${name} filler chart: ${f.total - skip} of ${f.total} episodes to watch, ${skip} filler and recap episodes to skip, saving about ${hours(skip * len)}${longest && longest.to > longest.from ? `; the longest filler run is episodes ${longest.from} to ${longest.to}` : ""}.` };
}

/** Crunchyroll against Netflix and JioHotstar: cheapest monthly plan, Hindi dubbed anime, rupees per Hindi anime. */
async function priceChart() {
  const rows = (["crunchyroll", "netflix", "jiohotstar"] as const).flatMap((slug) => {
    const plat = hindiPlatform(slug);
    const plan = pricesFor(slug)?.plans.filter((x) => x.period === "month").sort((x, y) => x.price - y.price)[0];
    const n = plat ? dubsOn(plat).length : 0;
    return plat && plan && n ? [{ slug, label: plat.label.replace(/ India$/, ""), plan, n, per: plan.price / n }] : [];
  });
  const col = (w: number, align = "flex-start") => ({ width: w, justifyContent: align });
  const body = h("div", { flexDirection: "column" },
    h("div", { padding: "0 22px 10px", fontSize: 18, color: C.muted, textTransform: "uppercase", letterSpacing: 2 },
      h("div", col(330), "Service"), h("div", col(250), "Cheapest plan"), h("div", col(230, "flex-end"), "Hindi anime"), h("div", col(260, "flex-end"), "Per Hindi anime")),
    ...rows.map((r) => h("div", { marginTop: 10, padding: "16px 22px", borderRadius: 16, alignItems: "center", background: r.slug === "crunchyroll" ? "rgba(255,77,109,.14)" : C.card, border: `1px solid ${r.slug === "crunchyroll" ? BRAND.pink : C.line}`, fontSize: 30, fontWeight: 800 },
      h("div", col(330), r.label), h("div", { ...col(250), fontWeight: 500 }, `₹${r.plan.price} (${r.plan.name})`), h("div", col(230, "flex-end"), String(r.n)), h("div", { ...col(260, "flex-end"), color: r.slug === "crunchyroll" ? BRAND.pink : C.ink }, `₹${r.per.toFixed(r.per < 10 ? 1 : 0)}`))));
  const cr = rows.find((r) => r.slug === "crunchyroll")!;
  const tree = frame("Crunchyroll India", `Crunchyroll price in India: ₹${cr.plan.price} a month`, "Against Netflix and JioHotstar, for anime in Hindi", body, "anilumi.in/crunchyroll-price-india");
  return { path: "/crunchyroll-price-india", src: await save("crunchyroll-price-india", tree), alt: `Crunchyroll price comparison for India: ${rows.map((r) => `${r.label} from ₹${r.plan.price} a month with ${r.n} Hindi dubbed anime, ₹${r.per.toFixed(1)} per Hindi anime`).join("; ")}.` };
}

const WATCH_ORDERS = ["naruto", "dragon-ball", "kimetsu-no-yaiba", "bleach", "boku-no-hero-academia", "one-piece", "pokemon", "jujutsu-kaisen", "attack-on-titan", "hunter-x-hunter-2011"];
const FILLERS: [string, string, number][] = [["naruto-shippuden", "Naruto Shippuden", 500], ["one-piece", "One Piece", 1180], ["bleach", "Bleach", 366], ["boruto-naruto-next-generations", "Boruto", 293], ["naruto", "Naruto", 220], ["fairy-tail", "Fairy Tail", 175], ["black-clover-tv", "Black Clover", 170], ["dragon-ball-z", "Dragon Ball Z", 291]];

const only = process.argv[2];
await mkdir(join(ROOT, "public/charts"), { recursive: true });
const manifestFile = join(ROOT, "data/charts.json");
const manifest: { generated: string; pages: Record<string, { src: string; alt: string }> } = await readFile(manifestFile, "utf8").then((t) => JSON.parse(t)).catch(() => ({ generated: "", pages: {} }));
const jobs: (() => Promise<{ path: string; src: string; alt: string }>)[] = [
  ...WATCH_ORDERS.map((s) => () => watchOrderChart(s)),
  ...FILLERS.map(([s, n, t]) => () => fillerChart(s, n, t)),
  () => priceChart(),
];
for (const job of jobs) {
  try {
    const r = await job();
    if (only && !r.path.includes(only)) continue;
    manifest.pages[r.path] = { src: r.src, alt: r.alt };
    console.log("✓", r.path, "→", r.src);
  } catch (e) {
    console.error("✗", (e as Error).message);
  }
}
manifest.generated = new Date().toISOString().slice(0, 10);
await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
