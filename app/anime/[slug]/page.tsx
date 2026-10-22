import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAnimeBySlug, getCharacters, getEpisodes, listAnime, getTrending, getRelations, getLastAired, episodePath, posterUrl, fmtDate, statusLabel, subtypeLabel, animePath, weekdayOf, runtimeMinutes, fmtMinutes, Anime } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import Faq, { FaqItem } from "@/components/Faq";
import AnimeRail from "@/components/AnimeRail";
import AdSlot from "@/components/AdSlot";
import BingePlanner from "@/components/BingePlanner";
import Countdown from "@/components/Countdown";
import LocalTime from "@/components/LocalTime";

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const t = await getTrending(20);
    return t.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const year = a.startDate?.slice(0, 4);
  const title = `${a.title}${year ? ` (${year})` : ""} – Episodes, Release Date & Where to Watch`;
  const description = `${a.title}: ${a.episodeCount ? `${a.episodeCount} episodes` : subtypeLabel(a.subtype)}, ${statusLabel(a.status).toLowerCase()}${a.rating ? `, rated ${(a.rating / 10).toFixed(1)}/10` : ""}. ${a.synopsis.slice(0, 120).replace(/\s+\S*$/, "")}…`;
  return {
    title,
    description,
    alternates: { canonical: animePath(a) },
    openGraph: { title, description, type: "video.tv_show" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function buildFaq(a: Anime): FaqItem[] {
  const items: FaqItem[] = [];
  const next = a.nextRelease ? fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : null;
  if (a.status === "current") {
    items.push({ q: `When does the next episode of ${a.title} come out?`, a: next ? `The next episode of ${a.title} is scheduled for ${next} (Japan time). New episodes air weekly on ${weekdayOf(a.nextRelease)}s.` : `${a.title} is currently airing. Check the episode list for the latest air dates.` });
  }
  if (a.status === "upcoming") {
    items.push({ q: `When does ${a.title} release?`, a: a.startDate ? `${a.title} is scheduled to premiere on ${fmtDate(a.startDate, { month: "long", day: "numeric", year: "numeric" })}.` : `${a.title} is announced but does not have a confirmed release date yet.` });
  }
  items.push({ q: `How many episodes does ${a.title} have?`, a: a.episodeCount ? `${a.title} has ${a.episodeCount} episode${a.episodeCount === 1 ? "" : "s"}${a.episodeLength ? `, each around ${a.episodeLength} minutes` : ""}.` : a.status === "current" ? `${a.title} is still airing and the final episode count has not been announced.` : `The episode count for ${a.title} has not been published yet.` });
  if (a.streaming.length) {
    items.push({ q: `Where can I watch ${a.title}?`, a: `${a.title} is available to stream on ${a.streaming.map((s) => s.site).join(", ")}. Availability varies by region.` });
  }
  items.push({ q: `Is ${a.title} finished?`, a: a.status === "finished" ? `Yes. ${a.title} finished airing${a.endDate ? ` on ${fmtDate(a.endDate)}` : ""}.` : a.status === "current" ? `No, ${a.title} is currently airing.` : `${a.title} has not started airing yet.` });
  const rt = runtimeMinutes(a);
  if (rt) items.push({ q: `How long does it take to watch ${a.title}?`, a: `${a.title} runs about ${fmtMinutes(rt)} in total${a.episodeCount && a.episodeLength ? ` (${a.episodeCount} episodes of ${a.episodeLength} minutes)` : ""}. At two hours a day you can finish it in ${Math.max(1, Math.ceil(rt / 120))} day${Math.ceil(rt / 120) === 1 ? "" : "s"}.` });
  if (a.rating) items.push({ q: `Is ${a.title} worth watching?`, a: `${a.title} holds a community score of ${(a.rating / 10).toFixed(1)}/10 from ${a.userCount.toLocaleString()} Kitsu users${a.ratingRank ? ` and ranks #${a.ratingRank} among all anime by rating` : ""}.` });
  return items;
}

export default async function AnimePage({ params }: Props) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();

  const mainGenre = a.categories[0];
  const [characters, episodes, related, relations, latestInfo] = await Promise.all([
    getCharacters(a.id, 12),
    a.subtype === "movie" ? Promise.resolve({ items: [], total: 0, limit: 0, offset: 0 }) : getEpisodes(a.id, 1, 6),
    mainGenre ? listAnime({ filter: { categories: mainGenre.slug }, sort: "-userCount", limit: 13 }) : Promise.resolve({ items: [], total: 0, limit: 0, offset: 0 }),
    getRelations(a.id),
    a.status === "current" ? getLastAired(a.id) : Promise.resolve({ count: 0, lastAired: 0, lastAiredDate: null, reliable: false }),
  ]);
  const relatedItems = related.items.filter((r) => r.id !== a.id).slice(0, 12);
  const franchise = relations.filter((r) => ["sequel", "prequel", "side_story", "spinoff", "summary", "alternative_version", "other", "character"].includes(r.role));
  const runtime = runtimeMinutes(a);
  const lastAired = latestInfo.lastAired;
  const nextN = a.status === "current" && a.nextRelease && latestInfo.reliable ? lastAired + 1 : null;
  const poster = posterUrl(a, "large");
  const cover = a.cover?.large || a.cover?.original || null;
  const faq = buildFaq(a);
  const year = a.startDate?.slice(0, 4);

  const ld = {
    "@context": "https://schema.org",
    "@type": a.subtype === "movie" ? "Movie" : "TVSeries",
    name: a.title,
    alternateName: [a.titleEn, a.titleJp].filter(Boolean),
    url: abs(animePath(a)),
    image: poster || undefined,
    description: a.synopsis,
    genre: a.categories.map((c) => c.title),
    datePublished: a.startDate || undefined,
    numberOfEpisodes: a.episodeCount || undefined,
    contentRating: a.ageRating || undefined,
    aggregateRating: a.rating ? { "@type": "AggregateRating", ratingValue: (a.rating / 10).toFixed(1), bestRating: 10, worstRating: 1, ratingCount: a.userCount } : undefined,
    trailer: a.youtubeVideoId ? { "@type": "VideoObject", name: `${a.title} trailer`, embedUrl: `https://www.youtube.com/embed/${a.youtubeVideoId}`, thumbnailUrl: `https://img.youtube.com/vi/${a.youtubeVideoId}/hqdefault.jpg`, uploadDate: a.startDate || undefined, description: `Official trailer for ${a.title}` } : undefined,
  };

  const facts: [string, string | null][] = [
    ["Type", subtypeLabel(a.subtype)],
    ["Status", statusLabel(a.status)],
    ["Episodes", a.episodeCount ? String(a.episodeCount) : a.status === "current" ? "Ongoing" : "TBA"],
    ["Episode length", a.episodeLength ? `${a.episodeLength} min` : null],
    ["Total runtime", runtime ? fmtMinutes(runtime) : null],
    ["Aired", a.startDate ? `${fmtDate(a.startDate)}${a.endDate ? ` → ${fmtDate(a.endDate)}` : a.status === "current" ? " → present" : ""}` : "TBA"],
    ["Next episode", a.nextRelease ? fmtDate(a.nextRelease, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" }) + " JST" : null],
    ["Age rating", a.ageRating ? `${a.ageRating}${a.ageRatingGuide ? ` – ${a.ageRatingGuide}` : ""}` : null],
    ["Japanese title", a.titleJp],
    ["Popularity rank", a.popularityRank ? `#${a.popularityRank}` : null],
    ["Rating rank", a.ratingRank ? `#${a.ratingRank}` : null],
  ];

  return (
    <article>
      <JsonLd data={ld} />
      <div className="relative">
        {cover && (
          <div className="absolute inset-0 -z-10 h-72 overflow-hidden">
            <Image src={cover} alt="" fill className="object-cover opacity-30 blur-sm" sizes="100vw" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/20 to-bg" />
          </div>
        )}
        <div className="container-x pt-8">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, ...(mainGenre ? [{ href: `/genre/${mainGenre.slug}`, label: mainGenre.title }] : []), { href: animePath(a), label: a.title }]} />
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="relative aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card sm:w-56">
              {poster && <Image src={poster} alt={`${a.title} poster`} fill sizes="224px" className="object-cover" priority />}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{a.title}</h1>
              {a.titleEn && a.titleEn !== a.title && <p className="mt-1 text-muted">{a.titleEn}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {a.rating && <span className="rounded-md bg-gold/15 px-2 py-1 font-bold text-gold">★ {(a.rating / 10).toFixed(1)}</span>}
                <span className="chip">{subtypeLabel(a.subtype)}</span>
                <span className={`chip ${a.status === "current" ? "chip-active" : ""}`}>{statusLabel(a.status)}</span>
                {year && <span className="chip">{year}</span>}
                {a.episodeCount && <span className="chip">{a.episodeCount} episodes</span>}
                {a.ageRating && <span className="chip">{a.ageRating}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.categories.map((c) => (
                  <Link key={c.id} href={`/genre/${c.slug}`} className="chip">{c.title}</Link>
                ))}
              </div>
              {a.status === "current" && a.nextRelease && (
                <Link href={nextN ? episodePath(a, nextN) : `${animePath(a)}/episodes`} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm transition hover:border-accent">
                  <span><strong className="text-accent-2">{nextN ? `Episode ${nextN}:` : "Next episode:"}</strong> {fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" })} JST<LocalTime iso={a.nextRelease} /></span>
                  <Countdown iso={a.nextRelease} label="in" />
                </Link>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/watch-order/${a.slug}`} className="btn-primary">
                  {franchise.length ? `Watch order · ${franchise.length + 1} entries` : "Watch order & binge time"}
                </Link>
                {runtime > 0 && <span className="btn-outline cursor-default">⏱ {fmtMinutes(runtime)} to binge</span>}
              </div>
              {a.streaming.length > 0 && (
                <div className="mt-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Where to watch</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.streaming.map((s) => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener nofollow sponsored" className="btn-outline capitalize">
                        ▶ {s.site}{s.dubs.includes("en") ? " (dub)" : ""}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-x mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <section>
            <h2 className="h-section mb-2">Synopsis</h2>
            <p className="prose-anime whitespace-pre-line">{a.synopsis || "No synopsis available yet."}</p>
          </section>

          {(runtime > 0 || (a.episodeCount && a.episodeLength)) && (
            <BingePlanner title={a.title} episodes={a.episodeCount || 0} episodeLength={a.episodeLength || 24} totalMinutes={runtime} status={a.status} />
          )}

          {franchise.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="h-section">Franchise</h2>
                <Link href={`/watch-order/${a.slug}`} className="text-sm font-medium text-violet hover:underline">Full watch order →</Link>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {franchise.slice(0, 8).map((r) => (
                  <li key={r.anime.id}>
                    <Link href={animePath(r.anime)} className="card flex items-center gap-3 p-2 text-sm transition hover:border-violet">
                      <span className="w-20 shrink-0 rounded bg-bg-2 px-1.5 py-0.5 text-center text-[10px] font-bold uppercase text-muted">{r.role.replace("_", " ")}</span>
                      <span className="truncate font-medium">{r.anime.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {a.youtubeVideoId && (
            <section className="mt-8">
              <h2 className="h-section mb-3">Trailer</h2>
              <div className="aspect-video overflow-hidden rounded-xl border border-line">
                <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${a.youtubeVideoId}`} title={`${a.title} trailer`} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
              </div>
            </section>
          )}

          <AdSlot slot="anime-mid" />

          {episodes.items.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="h-section">Episodes{episodes.total ? ` (${episodes.total})` : ""}</h2>
                <Link href={`${animePath(a)}/episodes`} className="text-sm font-medium text-violet hover:underline">Full episode list →</Link>
              </div>
              <ol className="card divide-y divide-line">
                {episodes.items.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 p-3 text-sm">
                    <span className="w-10 shrink-0 font-bold text-muted">#{e.number ?? "–"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{e.number ? <Link href={episodePath(a, e.number)} className="hover:text-violet">{e.title || `Episode ${e.number}`}</Link> : e.title}</p>
                      {e.airdate && <p className="text-xs text-muted">Aired {fmtDate(e.airdate)}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {characters.length > 0 && (
            <section className="mt-8">
              <h2 className="h-section mb-3">Characters</h2>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {characters.map((c) => (
                  <li key={c.id} className="text-center">
                    <div className="relative mx-auto aspect-[5/6] w-full overflow-hidden rounded-lg border border-line bg-bg-2">
                      {c.image && <Image src={c.image} alt={c.name} fill sizes="120px" className="object-cover" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs font-medium">{c.name}</p>
                    <p className="text-[10px] uppercase text-muted">{c.role}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Faq items={faq} title={`${a.title} FAQ`} />
        </div>

        <aside>
          <div className="card p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Details</h2>
            <dl className="space-y-2 text-sm">
              {facts.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-3"><dt className="text-muted">Members</dt><dd className="font-medium">{a.userCount.toLocaleString()}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Favorites</dt><dd className="font-medium">{a.favoritesCount.toLocaleString()}</dd></div>
            </dl>
          </div>
          <AdSlot slot="anime-side" />
        </aside>
      </div>

      <div className="container-x">
        {mainGenre && <AnimeRail title={`More ${mainGenre.title} anime`} href={`/genre/${mainGenre.slug}`} items={relatedItems} />}
      </div>
    </article>
  );
}
