import type { Metadata } from "next";
import MadeBy from "@/components/MadeBy";
import EditorWatched from "@/components/EditorWatched";
import { fitTitle, fitDescription } from "@/lib/titles";
import { sequelNews, newsOverrides, NEWS_CHECKED, NEWS_REVIEWED, OUTLOOK_LABEL } from "@/lib/sequelnews";
import PickList from "@/components/PickList";
import { fanPicks } from "@/lib/picks";
import { getFanRecommendations } from "@/lib/anilist";
import { robotsFor, nextSeasonIndexed } from "@/lib/indexing";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAnimeBySlug, getAniListId, buildWatchOrder, getRelations, kitsuByAniListIds, animePath, posterUrl, fmtDate, statusLabel, subtypeLabel, type Anime } from "@/lib/kitsu";
import { getAniListSequel } from "@/lib/anilist";
import { sequelVerdict, seasonGaps, humanMonths, type SequelLike, type SequelKind } from "@/lib/sequel";
import { continuationFor } from "@/lib/filler";
import { previewSnapshot } from "@/lib/preview";
import PageHero from "@/components/PageHero";
import { pageAbout } from "@/lib/ld";
import JsonLd from "@/components/JsonLd";
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
  // The name people search ("Demon Slayer Season 2", not "Kimetsu no Yaiba Season 2").
  const name = a.titleEn && a.titleEn.length <= 35 ? a.titleEn : a.title;
  const label = first ? `${name} Season 2` : `${name} Next Season`;
  return { a, chain, idx, next, verdict, label, first, name };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { a, next, verdict, label, first } = await load(slug);
  // The answer goes in the title: "Akame ga Kill Season 2: Not Announced (Oct 2026)" beats a question.
  const asOf = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  const movie = next?.anime?.subtype === "movie";
  // "Release date" is how most of these searches are phrased ("relife season 2 release date"); every answer
  // carries a date so it reads as current.
  const outYear = next?.startDate?.slice(0, 4);
  const answer: Record<SequelKind, string> = {
    none: `Not Announced Yet (${asOf})`,
    dated: next?.startDate ? fmtDate(next.startDate, { month: "short", day: "numeric", year: "numeric" })! : "Confirmed",
    announced: `Confirmed${next?.expected ? ` for ${next.expected}` : ""}, Day TBA (${asOf})`,
    out: movie ? `The Story Continues in a Movie${outYear ? ` (${outYear})` : ""}` : `Yes, Out Since ${outYear || "Release"} (${asOf})`,
    airing: movie ? `New Movie in Theaters (${asOf})` : `Airing Now (${asOf})`,
    "still-airing": `Still Airing, No Sequel Yet (${asOf})`,
  };
  const dateQuestion = verdict.kind === "none" || verdict.kind === "dated" || verdict.kind === "announced";
  // Official news beats a database status that hasn't caught up (lib/sequelnews.ts).
  const news = sequelNews(a.slug);
  const override = newsOverrides(news, verdict.kind);
  const title = override ? fitTitle([news!.window && news!.window !== "TBA" ? `${label}: Announced for ${news!.window}` : null, `${label}: Announced (${asOf})`, `${label}: Announced`]) : `${label}${dateQuestion ? " Release Date" : ""}: ${answer[verdict.kind]}`;
  return {
    title,
    description: fitDescription(`${first ? `Is there a ${a.title} season 2?` : `Will ${a.title} get another season?`} ${override ? `${news!.what}${news!.announced ? ` (announced ${fmtDate(news!.announced, { month: "long", day: "numeric", year: "numeric" })})` : ""}.` : `${verdict.headline} ${verdict.detail}`}`.slice(0, 300)),
    alternates: { canonical: `${animePath(a)}/next-season` },
    // Films and OVAs never; a series when there's news, or it's popular enough that people ask anyway.
    ...(a.subtype === "TV" || a.subtype === "ONA" ? { robots: robotsFor(nextSeasonIndexed(`${animePath(a)}/next-season`, override || (verdict.kind !== "none" && verdict.kind !== "still-airing"), a.userCount)) } : { robots: { index: false } }),
  };
}

export default async function NextSeasonPage({ params }: Props) {
  const { slug } = await params;
  const { a, chain, next, verdict, label, first, name } = await load(slug);
  const gaps = seasonGaps(chain);
  const avgGap = gaps.length ? Math.round(gaps.reduce((n, g) => n + g, 0) / gaps.length) : null;
  const cont = continuationFor(a.slug);
  const nextAnime = next?.anime;
  const latest = chain[chain.length - 1];
  const upcomingLater = chain.filter((x, i) => i > chain.findIndex((y) => y.id === a.id) && ["upcoming", "unreleased", "tba"].includes(x.status) && x.id !== nextAnime?.id);
  // The season it premieres in, when that season's preview page has a line-up ("Winter 2027 line-up").
  const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  // The next entry if it's still to come, else the next announced one ("Also announced: Season 2").
  const ahead = next && (verdict.kind === "dated" || verdict.kind === "announced") ? next : upcomingLater[0];
  const ym = ahead?.startDate ? { y: Number(ahead.startDate.slice(0, 4)), m: Number(ahead.startDate.slice(5, 7)) }
    : ahead && "expected" in ahead && ahead.expected ? { y: Number(ahead.expected.match(/\d{4}/)?.[0]), m: MONTH_NAMES.indexOf(ahead.expected.split(" ")[0].toLowerCase()) + 1 } : null;
  const nextSeason = ym && ym.y && ym.m ? { y: ym.y, s: (["winter", "spring", "summer", "fall"] as const)[Math.floor((ym.m - 1) / 3)] } : null;
  const seasonLink = nextSeason && previewSnapshot().seasons[`${nextSeason.y}-${nextSeason.s}`]?.length ? `/season/${nextSeason.y}/${nextSeason.s}/preview` : null;
  const then = upcomingLater[0];
  const thenNote = then && (verdict.kind === "out" || verdict.kind === "airing") ? ` After that, ${then.title} is confirmed${then.startDate ? ` for ${fmtDate(then.startDate, { month: "long", year: "numeric" })}` : ""}.` : "";
  const question = first ? `Is there a ${a.title} season 2?` : `Will ${a.title} get another season?`;
  const news = sequelNews(a.slug);
  const override = newsOverrides(news, verdict.kind);
  // No sequel to wait for: what fans of the show watch instead.
  const waiting = !override && (verdict.kind === "none" || verdict.kind === "still-airing");
  const [recs, alId] = waiting ? await Promise.all([getFanRecommendations(a.id, 12).catch(() => []), getAniListId(a.id).catch(() => null)]) : [[], null];
  const picks = fanPicks(recs, alId, name).slice(0, 6);
  const why = news?.status === "none" && news.why ? news.why : null;
  const newsLine = news ? `${news.what}${news.announced && news.status !== "none" ? `, announced ${fmtDate(news.announced, { month: "long", day: "numeric", year: "numeric" })}${news.by ? ` by ${news.by}` : ""}` : ""}${news.window && news.window !== "TBA" && news.status !== "none" ? `; expected ${news.window}` : ""}.` : "";

  const faq: FaqItem[] = [
    { q: question, a: override ? newsLine : `${verdict.headline} ${verdict.detail}${thenNote}` },
    ...(why ? [{ q: `Why is there no ${name} ${first ? "season 2" : "new season"}?`, a: why }] : []),
    ...(verdict.kind === "dated" && next?.startDate ? [{ q: `When does ${next.title} come out?`, a: `${next.title} is scheduled to premiere on ${fmtDate(next.startDate, { month: "long", day: "numeric", year: "numeric" })} in Japan.` }] : []),
    ...(avgGap !== null ? [{ q: `How long is the wait between ${a.title} seasons?`, a: `Across ${gaps.length} gap${gaps.length === 1 ? "" : "s"} so far, new entries in the main story have arrived on average ${humanMonths(avgGap)} after the previous one ended. That's a pattern, not an announcement.` }] : []),
    ...(cont ? [{ q: `Where does the ${a.title} anime end in the ${cont.medium}?`, a: `To keep going, start the ${cont.medium} from ${cont.chapter ? `chapter ${cont.chapter}` : `volume ${cont.volume}`}.${cont.note ? ` ${cont.note}` : ""}` }] : []),
    { q: `How many seasons does ${a.title} have?`, a: chain.length > 1 ? `The main story has ${chain.length} entries so far: ${chain.map((x) => x.title).join(", ")}.` : `${a.title} is a single season so far.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={pageAbout(a, `${animePath(a)}/next-season`, `${a.title} next season`)} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/next-season`, label: first ? "Season 2" : "Next season" }]}
        eyebrow={<><span className="mr-2 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] tracking-normal text-ink normal-case">{BADGE[verdict.kind]}</span>{label}</>}
        title={question}
        subtitle={override ? <><strong className="text-ink">{newsLine}</strong></> : <><strong className="text-ink">{verdict.headline}</strong> {verdict.detail}{thenNote}</>}
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
      <EditorWatched anime={a} className="mt-4" />
      <MadeBy className="mt-3" method="Sequel status comes from the studio's and publisher's own announcements and anime news, two sources where possible; release dates from AniList." />

      {news && (
        <section className="card reveal mt-8 p-4" aria-labelledby="news-h">
          <h2 id="news-h" className="text-xs font-semibold uppercase tracking-wider text-muted">Latest official news</h2>
          <p className="mt-1 text-sm text-ink/90">{newsLine}</p>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
            <span>{NEWS_REVIEWED ? "Checked" : `Draft, checked${NEWS_CHECKED ? ` on ${fmtDate(NEWS_CHECKED, { day: "numeric", month: "short", year: "numeric" })}` : ""}`} against official announcements and news reports.</span>
            {news.sources.slice(0, 3).map((u, i) => <a key={u} href={u} target="_blank" rel="noopener nofollow" className="underline">Source {i + 1}</a>)}
          </p>
        </section>
      )}

      {why && news && (
        <section className="reveal mt-8" aria-labelledby="why-h">
          <h2 id="why-h" className="h-section mb-3">Why there&apos;s no {first ? "season 2" : "new season"} yet</h2>
          <div className="card p-4">
            {news.outlook && <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">{OUTLOOK_LABEL[news.outlook]}</p>}
            <p className="mt-1 text-sm leading-6 text-ink/90">{why}</p>
          </div>
        </section>
      )}

      {next && (
        <section className="reveal mt-10" aria-labelledby="next-h">
          <h2 id="next-h" className="h-section mb-3">{verdict.kind === "out" || verdict.kind === "airing" ? "Watch next" : "What's coming"}</h2>
          <div className="card flex gap-4 p-4">
            <span className="relative h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-bg-2">{nextAnime && posterUrl(nextAnime, "small") && <Image src={posterUrl(nextAnime, "small")!} alt={`${nextAnime.title} poster`} fill sizes="96px" className="object-cover" />}</span>
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
      {seasonLink && nextSeason && (
        <p className="mt-4 text-sm"><Link href={seasonLink} className="font-medium text-violet hover:underline">📅 Every {nextSeason.s[0].toUpperCase() + nextSeason.s.slice(1)} {nextSeason.y} anime and its premiere date →</Link></p>
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

      {picks.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="wait-h">
          <h2 id="wait-h" className="h-section mb-1">While you wait: what {name} fans watch next</h2>
          <p className="mb-4 text-sm text-muted">The titles AniList members most often recommend to {name} fans, with what each has in common. <Link href={`/similar/${a.slug}`} className="text-violet hover:underline">More anime like {name} →</Link></p>
          <PickList picks={picks} />
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
