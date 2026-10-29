// Query-string variants (?page=, ?sort=, filters). Reached only through the rewrites in next.config.ts;
// the plain URL is served by ../page.tsx from the ISR cache.
import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { listAnime, getCategories, runtimeMinutes, fmtMinutes, posterUrl, animePath, subtypeLabel, uniqueById, Anime } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import WatchButton from "@/components/WatchButton";
import TonightForm from "@/components/TonightForm";
import { TIMES, type TonightValues } from "@/lib/tonight";

type SP = { minutes?: string; genre?: string; type?: string; min?: string; all?: string };
type Props = { searchParams: Promise<SP> };

function parse(sp: SP): TonightValues {
  const minutes = TIMES.some((t) => t.m === Number(sp.minutes)) ? Number(sp.minutes) : 120;
  const type = ["any", "series", "movies"].includes(sp.type || "") ? sp.type! : "any";
  const min = [0, 7, 8].includes(Number(sp.min)) ? Number(sp.min) : 0;
  const genre = /^[a-z0-9-]{1,60}$/.test(sp.genre || "") ? sp.genre! : "";
  return { minutes, genre, type, min, all: sp.all === "1" };
}
const label = (m: number) => TIMES.find((t) => t.m === m)?.label.toLowerCase() ?? `${m} minutes`;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const v = parse(await searchParams);
  const onlyTime = !v.genre && v.type === "any" && !v.min && !v.all;
  const t = v.minutes >= 600 ? "a Day" : TIMES.find((x) => x.m === v.minutes)!.label.replace(/^1 hour$/, "an Hour");
  return {
    title: `Anime You Can Finish in ${t} – What to Watch Tonight`,
    description: `Complete anime series and movies that fit into ${label(v.minutes)}, ranked by community score, with exact runtimes. Filter by genre and format.`,
    alternates: { canonical: `/tonight${v.minutes !== 120 ? `?minutes=${v.minutes}` : ""}` },
    robots: onlyTime ? undefined : { index: false, follow: true },
  };
}

type Pick = { a: Anime; runtime: number };

export default async function TonightPage({ searchParams }: Props) {
  const v = parse(await searchParams);
  const base: Record<string, string> = { ...(v.all ? {} : { status: "finished" }), ...(v.genre ? { categories: v.genre } : {}) };
  // Episodes are rarely shorter than ~12 min, so this bounds the count without excluding real fits.
  const maxEp = Math.max(1, Math.min(60, Math.floor(v.minutes / 12)));
  const wantSeries = v.type !== "movies";
  const wantMovies = v.type !== "series";
  const [seriesPages, moviePages, longPage, genres] = await Promise.all([
    wantSeries ? Promise.all([0, 20, 40].map((offset) => listAnime({ filter: { ...base, subtype: "TV,ONA,OVA", episodeCount: `1..${maxEp}` }, sort: "ratingRank", limit: 20, offset }))) : Promise.resolve([]),
    wantMovies ? Promise.all([0, 20].map((offset) => listAnime({ filter: { ...base, subtype: "movie" }, sort: "ratingRank", limit: 20, offset }))) : Promise.resolve([]),
    wantSeries ? listAnime({ filter: { ...base, subtype: "TV", episodeCount: `${maxEp + 1}..200` }, sort: "ratingRank", limit: 20 }) : Promise.resolve(null),
    getCategories(30),
  ]);
  const passes = (a: Anime) => !v.min || ((a.rating || 0) / 10 >= v.min);
  // One pick per franchise so a single series' films don't crowd out everything else.
  const franchiseKey = (t: string) => t.toLowerCase().split(/[:：]| - | movie\b| season\b| \d/)[0].trim();
  const seenFranchise = new Set<string>();
  const finish: Pick[] = uniqueById([...seriesPages, ...moviePages].flatMap((p) => p.items))
    .map((a) => ({ a, runtime: runtimeMinutes(a), id: a.id }))
    .filter((p) => p.runtime > 0 && p.runtime <= v.minutes && passes(p.a))
    .sort((x, y) => (y.a.rating || 0) - (x.a.rating || 0))
    .filter((p) => { const k = franchiseKey(p.a.title); if (seenFranchise.has(k)) return false; seenFranchise.add(k); return true; })
    .slice(0, 12);
  const start = (longPage?.items || [])
    .filter((a) => a.episodeLength && a.episodeCount && passes(a))
    .slice(0, 6)
    .map((a) => {
      const perNight = Math.max(1, Math.floor(v.minutes / a.episodeLength!));
      return { a, perNight, nights: Math.ceil(a.episodeCount! / perNight) };
    });
  const genreTitle = v.genre ? genres.find((g) => g.slug === v.genre)?.title || v.genre : null;

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }, { href: "/tonight", label: "What to watch tonight" }]}
        eyebrow="🌙 Tonight"
        title={<>What to watch <span className="text-gradient">tonight</span></>}
        subtitle={`Tell us how much time you have. We find ${v.all ? "anime" : "complete anime"} you can actually finish in it, using real runtimes, best-rated first.`}
        hue={262}
        posters={finish.slice(0, 3).map((p) => posterUrl(p.a, "medium"))}
      >
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/quiz" className="chip">Take the 30-second quiz 🎯</Link>
          <Link href="/random" prefetch={false} className="chip">Random pick 🎲</Link>
        </div>
      </PageHero>

      <TonightForm v={v} genres={genres.map((g) => ({ slug: g.slug, title: g.title }))} />

      <section className="mt-8">
        <h2 className="h-section">Finish it in {label(v.minutes)}{genreTitle ? ` · ${genreTitle}` : ""}</h2>
        <p className="mt-1 text-sm text-muted">{finish.length ? `${finish.length} picks that fit, highest score first. The bar shows how much of your time each one uses.` : ""}</p>
        {finish.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {finish.map(({ a, runtime }) => {
              const spare = v.minutes - runtime;
              return (
                <li key={a.id} className="card flex gap-3 p-3">
                  <Link href={animePath(a)} className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md bg-bg-2" aria-hidden tabIndex={-1}>
                    {posterUrl(a, "small") && <Image src={posterUrl(a, "small")!} alt="" fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={animePath(a)} className="line-clamp-2 font-semibold hover:text-violet">{a.title}</Link>
                    <p className="mt-0.5 text-xs text-muted">{a.rating ? `★ ${(a.rating / 10).toFixed(1)} · ` : ""}{subtypeLabel(a.subtype)}{a.episodeCount && a.episodeCount > 1 ? ` · ${a.episodeCount} × ${a.episodeLength} min` : ""}</p>
                    <div className="mt-2" role="meter" aria-valuemin={0} aria-valuemax={v.minutes} aria-valuenow={runtime} aria-label={`Uses ${fmtMinutes(runtime)} of ${fmtMinutes(v.minutes)}`}>
                      <div className="h-2 overflow-hidden rounded-full bg-viz-1/20"><div className="h-full rounded-full bg-viz-1" style={{ width: `${Math.min(100, (runtime / v.minutes) * 100)}%` }} /></div>
                      <p className="mt-1 text-xs text-ink/80">{fmtMinutes(runtime)} <span className="text-muted">· {spare > 0 ? `${fmtMinutes(spare)} to spare` : "fits exactly"}</span></p>
                    </div>
                    <div className="mt-2"><WatchButton compact item={{ id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), status: a.status, nextRelease: a.nextRelease }} /></div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="card mt-4 p-6 text-sm text-muted">Nothing fits those filters. Try more time, a different genre, or a lower minimum score.</p>
        )}
      </section>

      <AdSlot slot="tonight-mid" />

      {start.length > 0 && (
        <section className="mt-10">
          <h2 className="h-section">Or start something longer</h2>
          <p className="mt-1 text-sm text-muted">Top-rated series that won&apos;t fit tonight, and how many nights they take at this pace.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {start.map(({ a, perNight, nights }) => (
              <li key={a.id}>
                <Link href={animePath(a)} className="card flex gap-3 p-3 transition hover:border-violet">
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(a, "tiny") && <Image src={posterUrl(a, "tiny")!} alt="" fill sizes="56px" className="object-cover" />}</div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-semibold">{a.title}</p>
                    <p className="text-xs text-muted">{a.rating ? `★ ${(a.rating / 10).toFixed(1)} · ` : ""}{a.episodeCount} episodes</p>
                    <p className="mt-1 text-xs text-ink/80">{perNight} episode{perNight === 1 ? "" : "s"} tonight · done in {nights} night{nights === 1 ? "" : "s"}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Faq
        items={[
          { q: "How are runtimes worked out?", a: "Episode count multiplied by episode length from Kitsu, or the listed total runtime for movies. Openings and endings are included, so most series run a few minutes shorter if you skip them." },
          { q: `What anime can I finish in ${label(v.minutes)}?`, a: finish.length ? `${finish.slice(0, 3).map((p) => `${p.a.title} (${fmtMinutes(p.runtime)})`).join(", ")} are the best-rated picks that fit${genreTitle ? ` in ${genreTitle.toLowerCase()}` : ""}.` : "Adjust the filters above to see picks." },
          { q: "Why only finished shows?", a: "So you get an ending tonight. Tick “Include shows still airing” to see series that are still releasing episodes." },
        ]}
      />
    </div>
  );
}
