import { fitDescription, fitTitle } from "@/lib/titles";
import type { Metadata } from "next";
import EditorWatched from "@/components/EditorWatched";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { getAnimeBySlug, listAnime, uniqueById, animePath, Anime, posterUrl, publicGenres } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import FanRecs from "@/components/FanRecs";
import { getFanRecommendations } from "@/lib/anilist";
import { getAniListInsight } from "@/lib/insights";
import { robotsFor, similarIndexed } from "@/lib/indexing";
import PickList from "@/components/PickList";
import { fanPicks } from "@/lib/picks";
import HindiDubCallout from "@/components/HindiDubCallout";
import { getAniListId } from "@/lib/kitsu";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import { editorPicks } from "@/lib/similarpicks";
import { englishName } from "@/lib/searchname";
import AnswerLead from "@/components/AnswerLead";
import { animeBySlugs } from "@/lib/kitsu";
import Image from "next/image";
import SectionNav from "@/components/fx/SectionNav";
import { hasHindiDub, dubFor, platformKind } from "@/lib/hindidub";
import { indexedSimilar } from "@/lib/similarhub";

// Kitsu's totalLength is sometimes negative or missing: fall back to episodes × length.
const hours = (x: Anime) => { const m = (x.totalLength && x.totalLength > 0 ? x.totalLength : 0) || (x.episodeCount && x.episodeLength ? x.episodeCount * x.episodeLength : 0); return m ? (m >= 120 ? `${Math.round(m / 60)} h` : `${m} min`) : null; };

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

/** Candidates sharing the title's top genres, scored by genre overlap then popularity. */
async function similarTo(a: Anime): Promise<Anime[]> {
  const cats = a.categories.map((c) => c.slug).slice(0, 4);
  if (!cats.length) return [];
  const queries = [cats.slice(0, 3).join(","), cats.slice(0, 2).join(","), cats[0]].filter((q, i, arr) => q && arr.indexOf(q) === i);
  const pages = await Promise.all(queries.map((q) => listAnime({ filter: { categories: q }, sort: "-userCount", limit: 20 })));
  const seen = new Set<string>();
  const scored: { a: Anime; score: number }[] = [];
  pages.forEach((p, qi) => {
    for (const x of p.items) {
      if (x.id === a.id || seen.has(x.id)) continue;
      seen.add(x.id);
      scored.push({ a: x, score: (queries.length - qi) * 1000 + Math.log10(x.userCount + 1) });
    }
  });
  return uniqueById(scored.sort((x, y) => y.score - x.score).map((s) => s.a)).slice(0, 20);
}

/** Indexed only when Google already shows it (lib/similarhub.ts says why). */
async function strong(kitsuId: string, slug: string) {
  const alId = await getAniListId(kitsuId).catch(() => null);
  return { alId, indexed: similarIndexed(slug) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  // English name when it's what people search ("anime like my hero academia"), the real count and the year.
  // Official titles can end in a full stop ("Your Name."), which then reads "Anime Like Your Name.: …".
  const name = (WATCH_ORDER_OVERRIDES[a.slug]?.label ?? (a.titleEn && a.titleEn.length <= 40 ? a.titleEn : a.title)).replace(/\.$/, "");
  const n = (await similarTo(a)).length;
  const { indexed, alId } = await strong(a.id, a.slug);
  const fans = indexed ? fanPicks(await getFanRecommendations(a.id, 12), alId, name).length : 0;
  const editor = editorPicks(a.slug);
  return {
    title: editor
      ? fitTitle([`Anime Like ${name}: ${editor.picks.length} Picks, Why Each Fits & Where to Watch`, `Anime Like ${name}: ${editor.picks.length} Picks and Why (${new Date().getFullYear()})`, `Anime Like ${name}: ${editor.picks.length} Picks`, `Anime Like ${name}`])
      : indexed && fans >= 8
      ? fitTitle([`Anime Like ${name}: ${fans} Picks Fans Recommend, and Why (${new Date().getFullYear()})`, `Anime Like ${name}: ${fans} Picks Fans Recommend (${new Date().getFullYear()})`, `Anime Like ${name}: ${fans} Fan Picks`, `Anime Like ${name}`])
      : fitTitle([`Anime Like ${name}: ${n || 20} Shows to Watch Next (${new Date().getFullYear()})`, `Anime Like ${name}: ${n || 20} Shows to Watch Next`, `Anime Like ${name}`]),
    description: editor
      ? fitDescription(`Finished ${name}? ${editor.picks.length} anime to watch next, each with why it fits: ${editor.about.replace(/\.$/, "")}. With where to stream in India and which have Hindi dubs.`)
      : fitDescription(`Finished ${name}? These anime share its ${publicGenres(a.categories).slice(0, 3).map((c) => c.title.toLowerCase()).join(", ")} DNA, ranked by how many fans watch them, with what each one shares with ${name} from AniList's community tags.`),
    alternates: { canonical: `/similar/${a.slug}` },
    robots: robotsFor(indexed),
  };
}

export default async function SimilarPage({ params }: Props) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const [items, recs, insight, { alId }, hub] = await Promise.all([similarTo(a), getFanRecommendations(a.id, 12), getAniListInsight(a.id), strong(a.id, a.slug), indexedSimilar().catch(() => [])]);
  // Official titles can end in a full stop ("Your Name."), which then reads "Anime Like Your Name.: …".
  const name = (WATCH_ORDER_OVERRIDES[a.slug]?.label ?? (a.titleEn && a.titleEn.length <= 40 ? a.titleEn : a.title)).replace(/\.$/, "");
  const picks = fanPicks(recs, alId, name);
  // Hand-picked list first, when there is one (lib/similarpicks.ts).
  const editor = editorPicks(a.slug);
  const editorAnime = editor ? await animeBySlugs(editor.picks.map((p) => p.s), true).catch(() => new Map<string, Anime>()) : null;
  // Kitsu's multi-slug filter silently drops some titles (Dandadan, Nov 2026): fetch those one by one.
  if (editor && editorAnime) await Promise.all(editor.picks.filter((p) => !editorAnime.has(p.s)).map(async (p) => { const x = await getAnimeBySlug(p.s).catch(() => null); if (x) editorAnime.set(p.s, x); }));
  // English names where Kitsu has none ("Overgeared", not "Temppal: Item no Chikara"; lib/searchname.ts).
  const handPicked = editor && editorAnime ? editor.picks.flatMap((p) => { const x = editorAnime.get(p.s); return x ? [{ anime: p.name ? { ...x, titleEn: p.name } : x.titleEn ? x : { ...x, titleEn: englishName(x) }, why: p.why }] : []; }) : [];
  const shortName = (x: Anime) => x.titleEn || x.title;
  const handHindi = handPicked.filter((p) => hasHindiDub(p.anime.slug));
  // The closest picks side by side with the show itself; then the ones you can watch in Hindi.
  const cmp = [{ anime: a, why: "", votes: 0 }, ...picks.slice(0, 5)];
  // Compared as shown (one decimal), so ties all get the star.
  const shown = (x: Anime) => (x.rating ? Math.round(x.rating) / 10 : 0);
  const topScore = Math.max(...cmp.map((c) => shown(c.anime)));
  const pool = [...picks.map((p) => p.anime), ...items].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i);
  const hindi = pool.filter((x) => hasHindiDub(x.slug)).slice(0, 8);
  // Picks that have their own indexed "anime like" page: links between those pages, so each one gets found from its neighbours.
  const hubSlugs = new Set(hub.map((h) => h.slug));
  const next = pool.filter((x) => x.slug !== a.slug && hubSlugs.has(x.slug)).slice(0, 12);
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `/similar/${a.slug}`, label: "Similar anime" }]}
        eyebrow="What to watch next"
        title={<>Anime like <span className="text-gradient">{name}</span></>}
        subtitle={handPicked.length ? editor!.about : `Matched on ${publicGenres(a.categories).slice(0, 4).map((c) => c.title).join(", ")}. Titles that share more of these tags rank higher; ties go to the more popular show.`}
        hue={262}
        backdrop={a.cover?.large || null}
        posters={[posterUrl(a, "medium"), ...items.slice(0, 2).map((x) => posterUrl(x, "medium"))]}
      >
        <div className="flex flex-wrap gap-2">{publicGenres(a.categories).slice(0, 6).map((c) => <Link key={c.id} href={`/genre/${c.slug}`} className="chip">{c.title}</Link>)}</div>
      </PageHero>
      <EditorWatched anime={a} className="mt-4" />
      <HindiDubCallout anime={a} title={name} className="mt-4" />
      {handPicked.length >= 4 && (
        <AnswerLead>
          If you liked {name}, watch {handPicked.slice(0, 5).map((p) => shortName(p.anime)).join(", ")} next. {handHindi.length === 1 ? `1 of the ${handPicked.length} picks below has an official Hindi dub: ${shortName(handHindi[0].anime)}.` : handHindi.length ? `${handHindi.length} of the ${handPicked.length} picks below have an official Hindi dub, including ${handHindi.slice(0, 3).map((p) => shortName(p.anime)).join(", ")}.` : ""}
        </AnswerLead>
      )}
      <SectionNav sections={[
        ...(handPicked.length >= 4 ? [{ id: "ours", label: "Our picks" }] : []),
        { id: "picks", label: "Fan picks" },
        ...(picks.length >= 3 ? [{ id: "compare", label: "Compare" }] : []),
        ...(hindi.length >= 2 ? [{ id: "hindi", label: "In Hindi" }] : []),
        { id: "genres", label: "Same genres" },
        { id: "faq", label: "FAQ" },
      ]} />
      {handPicked.length >= 4 && (
        <section id="ours" data-section className="reveal scroll-mt-32 pt-10" aria-labelledby="ours-h">
          <h2 id="ours-h" className="h-section mb-1">{handPicked.length} anime like {name}, and why each fits</h2>
          <p className="mb-4 text-sm text-muted">Chosen and written by AniLumi, closest first, with where each streams in India and whether it&apos;s in Hindi.</p>
          <PickList picks={handPicked} region="IN" />
        </section>
      )}
      <div id="picks" data-section className="scroll-mt-32" />
      {picks.length >= 4 ? (
        <section className="reveal mt-10" aria-labelledby="picks-h">
          <h2 id="picks-h" className="h-section mb-1">{picks.length} anime {name} fans recommend, and why</h2>
          <p className="mb-4 text-sm text-muted">Ordered by how many AniList members recommend each to {name} fans. The reason line is what the two share, from AniList&apos;s community tags.</p>
          <PickList picks={picks} />
        </section>
      ) : <FanRecs title={a.title} recs={recs} heading={`What ${a.title} fans recommend`} tags={insight?.tags} />}
      {picks.length >= 3 && (
        <section id="compare" data-section className="reveal pt-10" aria-labelledby="cmp-h">
          <h2 id="cmp-h" className="h-section mb-1">Compare {name} with the top picks</h2>
          <p className="mb-3 text-sm text-muted">Score, length and audience side by side, so you can pick by how much time you have. ★ marks the best-rated.</p>
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-28" />
                  {cmp.map((c, i) => (
                    <th key={c.anime.id} scope="col" className={`px-3 pb-2 pt-3 text-left align-bottom ${i === 0 ? "bg-violet/[.07]" : ""}`}>
                      <span className="relative mb-1.5 block h-16 w-12 overflow-hidden rounded-lg bg-bg-2">{posterUrl(c.anime, "tiny") && <Image src={posterUrl(c.anime, "tiny")!} alt="" fill sizes="48px" className="object-cover" />}</span>
                      {i === 0 ? <span className="text-sm font-semibold text-ink">{c.anime.title}</span> : <Link href={animePath(c.anime)} className="text-sm font-semibold text-ink hover:text-violet-2">{c.anime.title}</Link>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  ["Fan score", (x: Anime) => (x.rating ? <span className={shown(x) === topScore ? "font-bold text-accent-2" : ""}>{shown(x).toFixed(1)}{shown(x) === topScore ? " ★" : ""}</span> : null)],
                  ["Episodes", (x: Anime) => (x.episodeCount ? String(x.episodeCount) : x.status === "current" ? "Airing" : null)],
                  ["Watch time", (x: Anime) => hours(x)],
                  ["First aired", (x: Anime) => x.startDate?.slice(0, 4) ?? null],
                  ["Fans (Kitsu)", (x: Anime) => (x.userCount ? x.userCount.toLocaleString("en-US") : null)],
                  ["Hindi dub", (x: Anime) => { const d = dubFor(x); return d?.status === "available" ? (d.platforms.some((p) => platformKind(p.name) === "free") ? "Yes, free" : "Yes") : "No"; }],
                ] as const).map(([label, cell]) => (
                  <tr key={label} className="border-t border-line/60">
                    <th scope="row" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">{label}</th>
                    {cmp.map((c, i) => <td key={c.anime.id} className={`px-3 py-2 text-ink/90 ${i === 0 ? "bg-violet/[.07]" : ""}`}>{cell(c.anime) ?? <span className="text-muted">–</span>}</td>)}
                  </tr>
                ))}
                <tr className="border-t border-line/60">
                  <th scope="row" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">Shares</th>
                  {cmp.map((c, i) => <td key={c.anime.id} className={`px-3 py-2 text-xs text-muted ${i === 0 ? "bg-violet/[.07]" : ""}`}>{i === 0 ? "–" : c.why || "–"}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {hindi.length >= 2 && (
        <section id="hindi" data-section className="reveal pt-10" aria-labelledby="hi-h">
          <h2 id="hi-h" className="h-section mb-1">🇮🇳 Hindi dubbed anime like {name}</h2>
          <p className="mb-4 text-sm text-muted">Picks from this page with an official Hindi dub. <Link href="/hindi-dub" className="text-violet hover:underline">All Hindi dubbed anime →</Link></p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {hindi.map((x) => {
              const d = dubFor(x);
              const free = d?.platforms.some((p) => platformKind(p.name) === "free");
              return (
                <li key={x.id} className="min-w-0">
                  <Link href={animePath(x)} className="group block">
                    <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2">
                      {posterUrl(x, "small") && <Image src={posterUrl(x, "small")!} alt={`${x.title} poster`} fill sizes="(max-width:640px) 30vw, 140px" className="object-cover transition duration-500 group-hover:scale-105" />}
                      {free && <span className="absolute left-1.5 top-1.5 rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white">FREE</span>}
                    </span>
                    <span className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-violet-2">{x.title}</span>
                  </Link>
                  {d && <span className="block truncate text-xs text-muted">{d.platforms.map((p) => p.name.replace(/ \(.*\)$/, "")).slice(0, 2).join(", ")}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <AdSlot slot="similar-top" />
      <h2 id="genres" data-section className="h-section mb-3 scroll-mt-32 pt-10">Same genres and themes</h2>
      <div><AnimeGrid items={items} startRank={1} ld={`Anime like ${a.title}`} emptyText="Not enough genre data to find matches yet." /></div>
      {next.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="next-h">
          <h2 id="next-h" className="h-section mb-3">Liked one of these? Keep going</h2>
          <div className="flex flex-wrap gap-2">
            {next.map((x) => <Link key={x.id} href={`/similar/${x.slug}`} className="chip">Anime like {x.titleEn && x.titleEn.length <= 40 ? x.titleEn : x.title}</Link>)}
            <Link href="/similar" className="chip">All &ldquo;anime like&rdquo; lists →</Link>
          </div>
        </section>
      )}
      <div id="faq" data-section className="pt-2">
      <Faq
        items={[
          ...(hindi.length ? [{ q: `Which anime like ${name} are dubbed in Hindi?`, a: `${hindi.slice(0, 6).map((x) => x.title).join(", ")} have an official Hindi dub.` }] : []),
          ...(picks.length >= 3 ? [{ q: `Which anime like ${name} is shortest to watch?`, a: (() => { const short = [...picks.slice(0, 8)].filter((p) => p.anime.episodeCount).sort((x, y) => (x.anime.episodeCount ?? 0) - (y.anime.episodeCount ?? 0)).slice(0, 3); return short.length ? `${short.map((p) => `${p.anime.title} (${p.anime.episodeCount} episodes)`).join(", ")}.` : "See the comparison table above."; })() }] : []),
          ...(recs[0] ? [{ q: `What do ${a.title} fans recommend?`, a: `AniList members most often recommend ${recs.slice(0, 3).map((r) => `${r.title} (${r.votes.toLocaleString("en-US")} votes)`).join(", ")}.` }] : []),
          { q: `What should I watch after ${a.title}?`, a: items[0] ? `${items.slice(0, 3).map((x) => x.title).join(", ")} are the closest matches: they share ${a.title}'s main genres and have large audiences.` : "Recommendations appear once the title has genre tags." },
          ...(handPicked.length >= 4 ? [{ q: `What is the best anime like ${name}?`, a: `${shortName(handPicked[0].anime)}: ${handPicked[0].why}` }] : []),
          { q: "How are these picked?", a: handPicked.length >= 4 ? `The first ${handPicked.length} are chosen and written by AniLumi. The fan picks come from AniList members' recommendations, and the rest automatically from genre and theme tags on Kitsu, weighted by overlap and then popularity.` : "Automatically, from genre and theme tags on Kitsu, weighted by how many tags overlap and then by popularity. No editorial opinion is involved, so treat it as a starting point." },
        ]}
      />
      </div>
    </div>
  );
}
