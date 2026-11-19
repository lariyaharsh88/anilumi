import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import MadeBy from "@/components/MadeBy";
import SectionNav from "@/components/fx/SectionNav";
import { fitTitle, fitDescription } from "@/lib/titles";
import { FILMS_CHECKED, HINDI_LABEL, filmFranchise, filmFranchises, filmsPath, newestFirst, type Film } from "@/lib/franchisefilms";
import { hindiDubPath } from "@/lib/hindidub";
import { hindiDubIndexed } from "@/lib/indexing";

export const revalidate = 86400;
// Rendered on first request like the other Hindi pages (OpenNext 404s build-time pages with dynamicParams = false).
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ franchise: string }> };

/**
 * Every film of a big kids' franchise and whether it's in Hindi. Keyword Planner, India, Nov 2026: "doraemon movie in
 * hindi" 40.5K a month, "doraemon all movies list" 8.1K, "shinchan movie in hindi" 18.1K, "pokemon movies list"
 * 2.4K. Today's results are spam lists and partial fan pages with no Hindi status, so each film gets its status,
 * where, and a source.
 */
function load(slug: string) {
  const f = filmFranchise(slug);
  if (!f) notFound();
  const films = newestFirst(f.films);
  const hindi = films.filter((x) => x.hindi !== "none_found");
  return { f, films, hindi, now: films.filter((x) => x.hindi === "available"), latest: films[0] };
}
const checked = () => new Date(`${FILMS_CHECKED}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const title = (x: Film) => x.in && x.in !== x.en ? `${x.en} (${x.in})` : x.en;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { f, films, hindi, latest } = load((await params).franchise);
  const y = new Date().getFullYear();
  return {
    title: fitTitle([`${f.name} Movies in Hindi (${y}): All ${films.length} Films & Where to Watch`, `${f.name} Movies in Hindi (${y}): All ${films.length} Films`, `All ${f.name} Movies List in Hindi (${y})`, `${f.name} Movies in Hindi`]),
    description: fitDescription(`All ${films.length} ${f.name} movies in order, newest first: ${latest.en} (${latest.year}) and every earlier film, with which ${hindi.length} have a Hindi dub and where to watch them in India. Checked ${checked()}.`),
    alternates: { canonical: filmsPath(f.slug) },
  };
}

/** A franchise's films, newest first, with Hindi status, where and sources. */
export default async function FranchiseFilms({ params }: Props) {
  const { f, films, hindi, now, latest } = load((await params).franchise);
  const others = filmFranchises().filter((x) => x.slug !== f.slug);
  const faq = [
    { q: `What is the new ${f.name} movie?`, a: `${title(latest)}, released in Japan in ${latest.year}. ${latest.hindi === "available" ? `It's in Hindi on ${latest.where.join(", ")}.` : latest.hindi === "aired" ? `Its Hindi dub came out on ${latest.where.join(", ")}.` : "No Hindi dub has been announced yet."}` },
    { q: `How many ${f.name} movies are there?`, a: `${films.length} films so far, from ${films[films.length - 1].en} (${films[films.length - 1].year}) to ${latest.en} (${latest.year}).` },
    { q: `Which ${f.name} movies are in Hindi?`, a: hindi.length ? `${hindi.length} have had an official Hindi dub${now.length ? `, and ${now.length} can be watched in Hindi now: ${now.map((x) => `${x.en} (${x.where.join(", ")})`).join("; ")}` : ""}.` : "None that we could confirm." },
    { q: `Where can I watch ${f.name} movies in Hindi?`, a: now.length ? `${[...new Set(now.flatMap((x) => x.where))].join(", ")}. Films that only aired on TV come back on those channels from time to time; check their schedules.` : "Right now, only on TV reruns: check the channels listed on each film." },
  ];
  const Badge = ({ x }: { x: Film }) => (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${x.hindi === "available" ? "bg-emerald-500/15 text-emerald-300" : x.hindi === "aired" ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-muted"}`}>{HINDI_LABEL[x.hindi]}</span>
  );

  return (
    <div className="container-x pb-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${f.name} movies`, numberOfItems: films.length, itemListElement: films.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: `${x.en} (${x.year})` })) }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: "/hindi-dub/movies", label: "Movies" }, { href: filmsPath(f.slug), label: f.name }]}
        eyebrow="🇮🇳 Hindi dub"
        title={<>{f.name} movies in <span className="text-gradient">Hindi</span></>}
        subtitle={`Every ${f.name} film, newest first, with whether it has an official Hindi dub and where to watch it in India.`}
        facts={[
          { value: String(films.length), label: "films" },
          { value: String(hindi.length), label: "with a Hindi dub" },
          { value: String(now.length), label: "in Hindi now" },
        ]}
        hue={25}
      />
      <MadeBy className="mt-4" date={FILMS_CHECKED} method="Each Hindi status is from the platform's own page, the broadcaster's or distributor's announcement, or news reports; fan wikis count only as support for TV dubs. No unofficial uploads." />

      <SectionNav sections={[{ id: "latest", label: "Newest film" }, { id: "list", label: `All ${films.length}` }, { id: "faq", label: "FAQ" }]} />

      <section id="latest" data-section className="reveal pt-10" aria-labelledby="latest-h">
        <h2 id="latest-h" className="h-section mb-3">The newest {f.name} movie</h2>
        <div className="card p-4">
          <p className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold text-ink">{title(latest)}</span><span className="text-sm text-muted">{latest.year}</span><Badge x={latest} /></p>
          {latest.where.length > 0 && <p className="mt-1 text-sm text-ink/90">{latest.where.join(" · ")}</p>}
          {latest.note && <p className="mt-1 text-sm text-muted">{latest.note}</p>}
        </div>
      </section>

      <section id="list" data-section className="reveal pt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">All {films.length} {f.name} movies</h2>
        <p className="mb-4 text-sm text-muted">Newest first. Checked {checked()}. &ldquo;Hindi dub aired&rdquo; means it was shown in Hindi on TV or in cinemas but isn&apos;t streaming legally right now.</p>
        <ol className="space-y-2">
          {films.map((x) => (
            <li key={`${x.year}-${x.en}`} className="card p-3 text-sm">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="w-12 shrink-0 font-semibold text-muted">{x.year}</span><span className="font-semibold text-ink">{title(x)}</span><Badge x={x} />{x.live_action && <span className="text-[11px] text-muted">Live action</span>}</p>
              <p className="mt-0.5 pl-14 text-xs text-muted" lang="ja-Latn">{x.jp}</p>
              {(x.where.length > 0 || x.sources.length > 0) && (
                <p className="mt-1 flex flex-wrap gap-x-3 pl-14 text-xs text-muted">
                  {x.where.length > 0 && <span className="text-ink/85">{x.where.join(" · ")}</span>}
                  {x.sources.slice(0, 2).map((u, i) => <a key={u} href={u} target="_blank" rel="noopener nofollow" className="underline">Source {i + 1}</a>)}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        {hindiDubIndexed(f.series) && <Link href={hindiDubPath(f.series)} className="chip">{f.name} series in Hindi</Link>}
        <Link href="/hindi-dub/movies" className="chip">🎬 All anime movies in Hindi</Link>
        {others.map((o) => <Link key={o.slug} href={filmsPath(o.slug)} className="chip">{o.name} movies in Hindi</Link>)}
      </p>

      <div id="faq" data-section className="pt-2"><Faq title={`${f.name} movies: FAQ`} items={faq} /></div>
    </div>
  );
}
