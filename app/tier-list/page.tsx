import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import { listAnime, getSeason, seasonOf, uniqueById, posterUrl, cap, type Anime } from "@/lib/kitsu";
import { decodeTiers } from "@/lib/tierlist";
import PageHero from "@/components/PageHero";
import TierMaker, { type TierItem } from "@/components/TierMaker";
import Faq from "@/components/Faq";
import MadeBy from "@/components/MadeBy";
import { kitsuByAniListIds } from "@/lib/kitsu";
import { snapshotOrder } from "@/lib/wosnap";
import { fanTiers, seasonTiers, type SeasonEntry } from "@/lib/picks";
import { anilist } from "@/lib/anilist";
import { editorWatched } from "@/lib/editor";

export const metadata: Metadata = {
  title: `Anime Tier List (${seasonOf().year}): ${cap(seasonOf().season)} Season + All-Time, Make Your Own`,
  description: fitDescription("The most-watched anime in S, A, B and C tiers by fan score, then make your own tier list in seconds: start from popular, this season or top rated, add any title, download or share it."),
  alternates: { canonical: "/tier-list" },
};

type Props = { searchParams: Promise<{ preset?: string; s?: string; title?: string }> };
const toItem = (a: Anime): TierItem => ({ id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small") });

export default async function TierListPage({ searchParams }: Props) {
  const { preset = "popular", s, title } = await searchParams;
  const now = seasonOf();
  const tiers = decodeTiers(s);
  const placed = Object.values(tiers).flat();
  const [base, placedItems] = await Promise.all([
    preset === "season" ? getSeason(now.year, now.season, 1, 20).then(async (p1) => [...p1.items, ...(await getSeason(now.year, now.season, 2, 20)).items])
    : preset === "rated" ? Promise.all([0, 20].map((offset) => listAnime({ sort: "-averageRating", limit: 20, offset, filter: { subtype: "TV" }, revalidate: 86400 }))).then((ps) => ps.flatMap((p) => p.items))
    : Promise.all([0, 20].map((offset) => listAnime({ sort: "-userCount", limit: 20, offset, filter: { subtype: "TV" }, revalidate: 86400 }))).then((ps) => ps.flatMap((p) => p.items)),
    placed.length ? Promise.all([0, 20, 40].map((i) => placed.slice(i, i + 20)).filter((c) => c.length).map((c) => listAnime({ filter: { id: c.join(",") }, limit: 20, revalidate: 86400 }))).then((ps) => ps.flatMap((p) => p.items)) : Promise.resolve([] as Anime[]),
  ]);
  const season = s ? null : await seasonTierData();
  const items = uniqueById([...placedItems, ...(s ? [] : base)]).map(toItem);
  const presets: [string, string][] = [["popular", "Most popular"], ["season", `${cap(now.season)} ${now.year}`], ["rated", "Top rated"]];
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/tier-list", label: "Tier list maker" }]}
        eyebrow="🏆 Tier list maker"
        title={s ? <span className="text-gradient">{(title || "Anime tier list").slice(0, 60)}</span> : <>Make an anime <span className="text-gradient">tier list</span></>}
        subtitle={s ? "Someone shared their ranking. Change anything you disagree with and share your own." : "Pick a starting set, rank by tapping or dragging, add any title, then download the image or share the link."}
        hue={40}
        posters={items.slice(0, 3).map((i) => i.poster)}
      >
        <div className="flex flex-wrap gap-2">{presets.map(([k, l]) => <Link key={k} href={`/tier-list?preset=${k}`} className={`chip ${!s && preset === k ? "chip-active" : ""}`}>{l}</Link>)}</div>
      </PageHero>
      <TierMaker key={`${preset}|${s || ""}`} items={items} initialTiers={tiers} initialTitle={title?.slice(0, 60) || ""} />
      {season && <SeasonTierList data={season} />}
      {!s && <FanTierList extraFaq={season?.faq ?? []} />}
    </div>
  );
}


const SEASON_Q = "query($season:MediaSeason,$year:Int){Page(perPage:50){media(season:$season,seasonYear:$year,type:ANIME,isAdult:false,sort:POPULARITY_DESC){id title{romaji english} averageScore popularity format}}}";

/** This season's anime in tiers by AniList score, refreshed daily: what people search as "<season> anime tier list". */
async function seasonTierData() {
  const now = seasonOf();
  const d = await anilist<{ Page: { media: { id: number; title: { romaji: string; english: string | null }; averageScore: number | null; popularity: number; format: string | null }[] } }>(SEASON_Q, { season: now.season.toUpperCase(), year: now.year }, 86400).catch(() => null);
  const entries: SeasonEntry[] = (d?.Page.media ?? []).filter((m) => m.format !== "MUSIC").map((m) => ({ anilistId: m.id, title: m.title.english || m.title.romaji, score: (m.averageScore ?? 0) / 10, popularity: m.popularity }));
  const tiers = seasonTiers(entries);
  if (tiers.reduce((n, t) => n + t.entries.length, 0) < 6) return null;
  const kitsu = await kitsuByAniListIds(tiers.flatMap((t) => t.entries.map((e) => e.anilistId))).catch(() => new Map<number, Anime>());
  const label = `${cap(now.season)} ${now.year}`;
  const best = tiers[0].entries;
  const faq = [
    { q: `What is the best anime of ${label}?`, a: `By AniList fan score so far: ${best.slice(0, 3).map((e) => `${e.title} (${e.score.toFixed(1)})`).join(", ")}.` },
    { q: `How is the ${label} tier list made?`, a: "From the 50 most-watched shows of the season on AniList, with at least 10,000 members each, placed only by their average fan score with fixed cut-offs. It updates daily as scores change." },
  ];
  return { tiers, kitsu, label, faq };
}

function SeasonTierList({ data: { tiers, kitsu, label } }: { data: NonNullable<Awaited<ReturnType<typeof seasonTierData>>> }) {
  return (
    <section className="mt-12" aria-labelledby="season-tiers-h">
      <h2 id="season-tiers-h" className="h-section mb-1">{label} anime tier list</h2>
      <p className="mb-4 max-w-3xl text-sm text-muted">This season&apos;s most-watched shows placed by their AniList fan score so far, updated daily: S is 8.4 and up, A 7.9 to 8.4, B 7.4 to 7.9, C below. Scores move as episodes air. <Link href="/tier-list?preset=season" className="text-violet hover:underline">Rank them yourself →</Link></p>
      <div className="card divide-y divide-line">
        {tiers.map((t) => (
          <div key={t.tier} className="flex gap-3 p-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-extrabold ${TIER_STYLE[t.tier]}`}>{t.tier}</span>
            <ul className="flex flex-wrap gap-1.5">
              {t.entries.map((e) => { const a = kitsu.get(e.anilistId); return <li key={e.anilistId}>{a ? <Link href={`/anime/${a.slug}`} className="chip text-xs">{e.title} <span className="text-muted">{e.score.toFixed(1)}</span></Link> : <span className="chip text-xs">{e.title} <span className="text-muted">{e.score.toFixed(1)}</span></span>}</li>; })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

const TIER_STYLE: Record<string, string> = { S: "bg-[#f43f5e] text-snow", A: "bg-[#fb923c] text-snow", B: "bg-[#facc15] text-bg", C: "bg-[#4ade80] text-bg" };

/** The most-watched anime tiered by AniList score: one entry per franchise, its best-rated season or film. */
async function FanTierList({ extraFaq }: { extraFaq: { q: string; a: string }[] }) {
  const tiers = fanTiers();
  const kitsu = await kitsuByAniListIds(tiers.flatMap((t) => t.ids)).catch(() => new Map<number, Anime>());
  const seen = new Set<string>();
  const rows = tiers.map((t) => ({ ...t, anime: t.ids.flatMap((id) => {
    const a = kitsu.get(id);
    if (!a) return [];
    const root = snapshotOrder(a.id)?.root.slug ?? a.slug;
    if (seen.has(root)) return [];
    seen.add(root);
    return [a];
  }) })).filter((t) => t.anime.length);
  if (!rows.length) return null;
  const name = (a: Anime) => (a.titleEn && a.titleEn.length <= 40 ? a.titleEn : a.title);
  return (
    <section className="mt-12" aria-labelledby="fan-tiers-h">
      <h2 id="fan-tiers-h" className="h-section mb-1">The anime tier list by fan scores</h2>
      <p className="mb-4 max-w-3xl text-sm text-muted">The most-watched anime (over 100,000 scores each on AniList), one per series at its best-rated season or film, placed by average score: S is 8.6 and up, A 8.2 to 8.6, B 7.8 to 8.2, C below. Disagree? Drag them into your own tiers above. ✓ marks the ones I&apos;ve watched.</p>
      <div className="card divide-y divide-line">
        {rows.map((t) => (
          <div key={t.tier} className="flex gap-3 p-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-extrabold ${TIER_STYLE[t.tier]}`}>{t.tier}</span>
            <ul className="flex flex-wrap gap-1.5">
              {t.anime.map((a) => <li key={a.id}><Link href={`/anime/${a.slug}`} className="chip text-xs">{name(a)}{editorWatched(a) ? " ✓" : ""}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <MadeBy className="mt-3" method="Scores are AniList's community averages from the monthly snapshot; the tier cut-offs are fixed, not hand-picked." />
      <Faq title="Anime tier list FAQ" items={[
        ...extraFaq,
        { q: "What is the best anime of all time?", a: `By AniList fan score among the most-watched anime: ${rows[0].anime.slice(0, 5).map(name).join(", ")} sit in S tier (8.6 or higher).` },
        { q: "How do I make my own anime tier list?", a: "Pick a starting set above (most popular, this season or top rated), drag or tap each anime into a tier, add any title with search, then download the image or copy the share link." },
        { q: "How are the tiers decided?", a: "Only by AniList's average fan score, with fixed cut-offs: S 8.6+, A 8.2+, B 7.8+, C below. One entry per series, shown at its best-rated season or film." },
      ]} />
    </section>
  );
}
