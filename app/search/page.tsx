import type { Metadata } from "next";
import { searchAnime } from "@/lib/kitsu";
import { onNow } from "@/lib/trending";
import AnimeGrid from "@/components/AnimeGrid";
import SearchBox from "@/components/SearchBox";
import PageHero from "@/components/PageHero";
import Link from "@/components/Link";
import { searchPeople } from "@/lib/peoplesearch";
import LeadForm from "@/components/LeadForm";
import { dbEnabled } from "@/lib/db";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" – Search results` : "Search anime, characters and voice actors", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const results = q ? await searchAnime(q, 20) : [];
  const people = q ? searchPeople(q, 12) : [];
  const trending = q ? [] : (await onNow()).trending.slice(0, 10);
  return (
    <div className="container-x pb-8">
      <PageHero
        eyebrow="Search"
        title={q ? <>Results for <span className="text-gradient">“{q}”</span></> : <>Search <span className="text-gradient">anime</span></>}
        subtitle={q ? `${results.length} anime${people.length ? ` and ${people.length} ${people.length === 1 ? "character or voice actor" : "characters and voice actors"}` : ""}. English and Japanese names both work.` : "Anime, characters and voice actors. English or Japanese names both work."}
        hue={190}
      >
        <div className="max-w-xl"><SearchBox defaultValue={q} label="Search again" /></div>
      </PageHero>
      {people.length > 0 && (
        <section className="mt-8" aria-labelledby="people-h">
          <h2 id="people-h" className="h-section mb-3">Characters and voice actors</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="card flex items-center gap-3 p-2.5 transition hover:border-violet/60">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-bg-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image ? <img src={p.image} alt={p.name} width={48} height={48} loading="lazy" className="h-full w-full object-cover object-top" /> : <span aria-hidden className="grid h-full w-full place-items-center text-lg">🎙️</span>}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{p.name}</span>
                    <span className="block truncate text-xs text-muted">{p.sub}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-8">
        {q && people.length > 0 && <h2 className="h-section mb-3">Anime</h2>}
        {q ? <AnimeGrid items={results} emptyText={`No anime matched “${q}”. Try the Japanese or English title.`} /> : <><h2 className="h-section mb-3">Trending searches</h2><AnimeGrid items={trending} /></>}
      </div>
      {/* /search is the second most-viewed page (Nov 2026), mostly visitors from India looking for a show to watch. */}
      {dbEnabled() && <LeadForm compact className="card mt-8 p-4" kind="hindi" source="search-hindi" title="🇮🇳 Get an email the day a new anime gets an official Hindi dub" blurb="With where to watch it and whether it's free. No pirate links." button="Notify me" />}
      <p className="mt-8 text-xs text-muted">Search understands nicknames and common misspellings, using alternative titles from the <a href="https://github.com/manami-project/anime-offline-database" rel="noopener nofollow" className="underline">anime-offline-database</a> (ODbL).</p>
    </div>
  );
}
