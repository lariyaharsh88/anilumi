import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import ClassicFilmsTable from "@/components/ClassicFilmsTable";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { CLASSIC_CHECKED, DIRECTORS, filmsBy, directorPath, whereSentence, hindiIn, type DirectorSlug } from "@/lib/classicfilms";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ director: string }> };

const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const clean = (t: string) => t.replace(/\.$/, "");

function load(slug: string) {
  if (!(slug in DIRECTORS)) notFound();
  const s = slug as DirectorSlug;
  return { s, d: DIRECTORS[s], films: filmsBy(s) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { s, d, films } = load((await params).director);
  return {
    title: fitTitle([`All ${films.length} ${d.name} Movies in Order (${y}) & Where to Watch`, `${d.name} Movies in Order (${y}): Where to Watch`, `${d.name} Movies (${y})`]),
    description: fitDescription(`All ${films.length} ${d.name} films in order, from ${clean(films[0].t)} (${films[0].year}) to ${clean(films[films.length - 1].t)} (${films[films.length - 1].year}), and where each streams in the US, India and the UK.`),
    alternates: { canonical: directorPath(s) },
  };
}

/** One director's feature films in order and where each streams. */
export default async function DirectorFilms({ params }: Props) {
  const { s, d, films } = load((await params).director);
  const others = (Object.keys(DIRECTORS) as DirectorSlug[]).filter((x) => x !== s);
  const hindi = films.filter((f) => hindiIn(f).length);

  const faq: FaqItem[] = [
    { q: `How many movies has ${d.name} made?`, a: `${films.length} feature films so far: ${list(films.map((f) => `${clean(f.t)} (${f.year})`))}.` },
    ...films.map((f) => ({ q: `Where can I watch ${clean(f.t)}?`, a: `${whereSentence(f)}.` })),
    ...(hindi.length ? [{ q: `Which ${d.name} films are in Hindi?`, a: `${list(hindi.map((f) => `${clean(f.t)} (${[...new Set(hindiIn(f).map((x) => x.service))].join(", ")})`))}.` }] : []),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList(`${d.name} movies`, films.map((f) => ({ url: `/anime/${f.kitsu}`, name: `${f.t} (${f.year})` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/classic-anime-movies", label: "Classic anime films" }, { href: directorPath(s), label: d.name }]}
        eyebrow="🎬 Director"
        title={<>{d.name} movies <span className="text-gradient">in order</span></>}
        subtitle={d.blurb}
        facts={[{ value: String(films.length), label: "feature films" }, { value: String(hindi.length), label: "with Hindi audio" }]}
        hue={210}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          {others.map((o) => <Link key={o} href={directorPath(o)} className="chip">{DIRECTORS[o].name} movies</Link>)}
          <Link href="/classic-anime-movies" className="chip">All classic anime films</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(CLASSIC_CHECKED)}>
        {d.name}&apos;s {films.length} films in order: {list(films.map((f) => `${clean(f.t)} (${f.year})`))}. {films[films.length - 1] && `Where to watch the newest, ${clean(films[films.length - 1].t)}: ${whereSentence(films[films.length - 1])}.`}
      </AnswerLead>

      <section className="reveal pt-10" aria-labelledby="films-h">
        <h2 id="films-h" className="h-section mb-1">Every {d.name} film and where it streams</h2>
        <p className="mb-4 text-sm text-muted">In release order.</p>
        <ClassicFilmsTable films={films} />
      </section>

      <MadeBy className="mt-8" method="Each film is checked on JustWatch's US, India and UK pages and the platforms' own title pages; Hindi audio is read from the platform's page or confirmed by Anime News Network." date={CLASSIC_CHECKED} />
      <Faq title={`${d.name} movies: FAQ`} items={faq} />
    </div>
  );
}
