import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAnimeBySlug, buildWatchOrder, getRelations, kitsuByAniListIds, animePath, posterUrl, fmtDate, statusLabel, subtypeLabel, type Anime } from "@/lib/kitsu";
import { getAniListSequel } from "@/lib/anilist";
import { sequelVerdict, seasonGaps, humanMonths, type SequelLike, type SequelKind } from "@/lib/sequel";
import { continuationFor } from "@/lib/filler";
import PageHero from "@/components/PageHero";
import Countdown from "@/components/Countdown";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

const HUE: Record<SequelKind, number> = { out: 140, airing: 350, dated: 40, announced: 40, "still-airing": 262, none: 220 };
const BADGE: Record<SequelKind, string> = { out: "Already out", airing: "Airing now", dated: "Confirmed", announced: "Confirmed", "still-airing": "Still airing", none: "Not announced" };

async function load(slug: string) {
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const [wo, rels, al] = await Promise.all([buildWatchOrder(a), getRelations(a.id), getAniListSequel(a.id)]);
  const chain = wo.entries.filter((e) => e.kind === "main").map((e) => e.anime);
  const idx = chain.findIndex((x) => x.id === a.id);
  let next: (SequelLike & { anime?: Anime }) | null = null;
  const kitsuNext = (idx >= 0 ? chain[idx + 1] : undefined) ?? rels.find((r) => r.role === "sequel")?.anime;
  if (kitsuNext) next = { ...kitsuNext, anime: kitsuNext };
  else if (al) {
    // Kitsu doesn't list it yet; AniList does. Link it if Kitsu has the entry under another relation.
    const k = (await kitsuByAniListIds([al.anilistId])).get(al.anilistId);
    next = k ? { ...k, anime: k } : { title: al.title, status: al.status, startDate: al.startDate, endDate: null, expected: al.expected };
  }
  const verdict = sequelVerdict(a, next);
  const first = idx <= 0;
  const label = first ? `${a.title} Season 2` : `${a.title} Next Season`;
  return { a, chain, idx, next, verdict, label, first };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { a, next, verdict, label, first } = await load(slug);
  // The answer goes in the title: "Akame ga Kill Season 2: Not Announced (Oct 2026)" beats a question.
  const asOf = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  const movie = next?.anime?.subtype === "movie";
  const answer: Record<SequelKind, string> = {
    none: `Not Announced Yet (${asOf})`,
    dated: next?.startDate ? `Release Date ${fmtDate(next.startDate, { month: "short", day: "numeric", year: "numeric" })}` : "Release Date Confirmed",
    announced: `Confirmed${next?.expected ? ` for ${next.expected}` : ""}, Date TBA`,
    out: movie ? `The Story Continues in a Movie` : `Yes, ${next?.title || "It"} Is Out`,
    airing: movie ? "New Movie in Theaters" : `Airing Now: ${next?.title || "New Season"}`,
    "still-airing": `Still Airing, No Sequel Yet (${asOf})`,
  };
  const title = `${label}: ${answer[verdict.kind]}`;
  return {
    title,
    description: `${first ? `Is there a ${a.title} season 2?` : `Will ${a.title} get another season?`} ${verdict.headline} ${verdict.detail}`.slice(0, 300),
    alternates: { canonical: `${animePath(a)}/next-season` },
    ...(a.subtype === "TV" || a.subtype === "ONA" ? {} : { robots: { index: false } }),
  };
}

export default async function NextSeasonPage({ params }: Props) {
  const { slug } = await params;
  const { a, chain, next, verdict, label, first } = await load(slug);
  const gaps = seasonGaps(chain);
  const avgGap = gaps.length ? Math.round(gaps.reduce((n, g) => n + g, 0) / gaps.length) : null;
  const cont = continuationFor(a.slug);
  const nextAnime = next?.anime;
  const latest = chain[chain.length - 1];
  const upcomingLater = chain.filter((x, i) => i > chain.findIndex((y) => y.id === a.id) && ["upcoming", "unreleased", "tba"].includes(x.status) && x.id !== nextAnime?.id);
  const then = upcomingLater[0];
  const thenNote = then && (verdict.kind === "out" || verdict.kind === "airing") ? ` After that, ${then.title} is confirmed${then.startDate ? ` for ${fmtDate(then.startDate, { month: "long", year: "numeric" })}` : ""}.` : "";
  const question = first ? `Is there a ${a.title} season 2?` : `Will ${a.title} get another season?`;

  const faq: FaqItem[] = [
    { q: question, a: `${verdict.headline} ${verdict.detail}${thenNote}` },
    ...(verdict.kind === "dated" && next?.startDate ? [{ q: `When does ${next.title} come out?`, a: `${next.title} is scheduled to premiere on ${fmtDate(next.startDate, { month: "long", day: "numeric", year: "numeric" })} in Japan.` }] : []),
    ...(avgGap !== null ? [{ q: `How long is the wait between ${a.title} seasons?`, a: `Across ${gaps.length} gap${gaps.length === 1 ? "" : "s"} so far, new entries in the main story have arrived on average ${humanMonths(avgGap)} after the previous one ended. That's a pattern, not an announcement.` }] : []),
    ...(cont ? [{ q: `Where does the ${a.title} anime end in the ${cont.medium}?`, a: `To keep going, start the ${cont.medium} from ${cont.chapter ? `chapter ${cont.chapter}` : `volume ${cont.volume}`}.${cont.note ? ` ${cont.note}` : ""}` }] : []),
    { q: `How many seasons does ${a.title} have?`, a: chain.length > 1 ? `The main story has ${chain.length} entries so far: ${chain.map((x) => x.title).join(", ")}.` : `${a.title} is a single season so far.` },
  ];

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/next-season`, label: first ? "Season 2" : "Next season" }]}
        eyebrow={<><span className="mr-2 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] tracking-normal text-ink normal-case">{BADGE[verdict.kind]}</span>{label}</>}
        title={question}
        subtitle={<><strong className="text-ink">{verdict.headline}</strong> {verdict.detail}{thenNote}</>}
        facts={[
          { value: String(chain.length || 1), label: chain.length === 1 ? "season so far" : "entries in the main story" },
          ...(avgGap !== null ? [{ value: humanMonths(avgGap), label: "typical wait between seasons" }] : []),
          ...(a.endDate && a.status === "finished" ? [{ value: fmtDate(a.endDate, { month: "short", year: "numeric" }) || "", label: "this season ended" }] : []),
        ]}
        hue={HUE[verdict.kind]}
        backdrop={a.cover?.large || null}
        posters={[posterUrl(a, "medium"), nextAnime ? posterUrl(nextAnime, "medium") : null]}
      >
        {verdict.kind === "dated" && next?.startDate && <Countdown iso={`${next.startDate.slice(0, 10)}T00:00:00+09:00`} big label="Premieres in" />}
      </PageHero>

      {next && (
        <section className="reveal mt-10" aria-labelledby="next-h">
          <h2 id="next-h" className="h-section mb-3">{verdict.kind === "out" || verdict.kind === "airing" ? "Watch next" : "What's coming"}</h2>
          <div className="card flex gap-4 p-4">
            <span className="relative h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-bg-2">{nextAnime && posterUrl(nextAnime, "small") && <Image src={posterUrl(nextAnime, "small")!} alt="" fill sizes="96px" className="object-cover" />}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">{BADGE[verdict.kind]}</p>
              <p className="mt-1 text-xl font-bold text-ink">{nextAnime ? <Link href={animePath(nextAnime)} className="hover:text-violet-2">{next.title}</Link> : next.title}</p>
              <p className="mt-1 text-sm text-muted">
                {nextAnime ? `${subtypeLabel(nextAnime.subtype)} · ${statusLabel(nextAnime.status)}` : "Announced on AniList"}
                {next.startDate ? ` · ${fmtDate(next.startDate, { month: "long", day: "numeric", year: "numeric" })}` : next.expected ? ` · expected ${next.expected}` : ""}
                {nextAnime?.episodeCount ? ` · ${nextAnime.episodeCount} episodes` : ""}
              </p>
              {nextAnime && (
                <p className="mt-3 flex flex-wrap gap-2 text-sm">
                  <Link href={animePath(nextAnime)} className="chip">Details</Link>
                  {(nextAnime.status === "current" || nextAnime.status === "upcoming") && <Link href={`${animePath(nextAnime)}/episodes`} className="chip">Episode dates</Link>}
                  <Link href={`/watch-order/${a.slug}`} className="chip">Full watch order</Link>
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {chain.length > 1 && (
        <section className="reveal mt-10" aria-labelledby="tl-h">
          <h2 id="tl-h" className="h-section mb-1">Season timeline</h2>
          <p className="mb-4 text-sm text-muted">Every entry in the main story, with the wait before each one.{latest && latest.id !== a.id ? ` Latest: ${latest.title}.` : ""}</p>
          <ol className="relative space-y-3 border-l border-line pl-5">
            {chain.map((x, i) => {
              const gap = i > 0 ? seasonGaps([chain[i - 1], x])[0] : undefined;
              const here = x.id === a.id;
              return (
                <li key={x.id} className="relative">
                  <span className={`absolute -left-[27px] top-3 h-3 w-3 rounded-full border-2 ${here ? "border-accent bg-accent" : ["upcoming", "unreleased", "tba"].includes(x.status) ? "border-accent-2 bg-bg" : "border-white/40 bg-bg"}`} aria-hidden />
                  {gap !== undefined && <p className="mb-1 text-xs text-muted">⏱ {gap ? `${humanMonths(gap)} later` : "straight after"}</p>}
                  <Link href={animePath(x)} className={`card flex flex-wrap items-center justify-between gap-2 p-3 transition hover:border-white/20 ${here ? "border-accent/50 bg-accent/5" : ""}`}>
                    <span className="font-semibold text-ink">{x.title}{here && <span className="ml-2 text-xs font-normal text-accent-2">you are here</span>}</span>
                    <span className="text-xs text-muted">{x.startDate ? fmtDate(x.startDate, { month: "short", year: "numeric" }) : "TBA"} · {statusLabel(x.status)}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {upcomingLater.length > 0 && <p className="mt-3 text-sm text-muted">Also announced: {upcomingLater.map((x) => x.title).join(", ")}.</p>}
        </section>
      )}

      {cont && (
        <section className="card reveal mt-10 border-violet/40 bg-violet/10 p-4" aria-label="Continue the story">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-2">Can&apos;t wait?</p>
          <p className="mt-1 text-sm leading-6 text-ink/90">The anime leaves off at {cont.medium} {cont.chapter ? `chapter ${cont.chapter}` : `volume ${cont.volume}`}. {cont.note || ""}{!cont.reviewed && <span className="text-muted"> (Draft, being verified.)</span>}</p>
          <Link href={`${animePath(a)}/manga`} className="mt-2 inline-block text-sm text-violet hover:underline">Where the anime ends in the {cont.medium} →</Link>
        </section>
      )}

      <AdSlot slot="nextseason-mid" />

      <p className="mt-8 text-sm text-muted">
        <Link href={animePath(a)} className="text-violet hover:underline">{a.title} overview</Link> ·{" "}
        <Link href={`/watch-order/${a.slug}`} className="text-violet hover:underline">Watch order</Link> ·{" "}
        <Link href="/upcoming-seasons" className="text-violet hover:underline">All confirmed sequels</Link>
      </p>

      <Faq items={faq} />
    </div>
  );
}
