import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import ClassicFilmsTable from "@/components/ClassicFilmsTable";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { CLASSIC_CHECKED, DIRECTORS, classicFilms, filmsBy, directorPath, whereSentence, hindiIn, type DirectorSlug } from "@/lib/classicfilms";

export const revalidate = 86400;

const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
// The films people search "where to watch" for (Keyword Planner, US): Your Name 5.4K, Akira 2.9K, Perfect Blue 2.4K, Paprika 2.4K.
const ASKED = ["Akira", "Perfect Blue", "Paprika", "Your Name.", "Ghost in the Shell", "Suzume", "A Silent Voice"];

export function generateMetadata(): Metadata {
  const n = classicFilms().length;
  return {
    title: fitTitle([`Where to Watch Akira, Perfect Blue & Your Name: ${n} Classic Anime Films`, `Classic Anime Movies (${y}): Where to Watch ${n} Films`, `Where to Watch Classic Anime Movies (${y})`]),
    description: fitDescription(`Where ${n} classic anime films stream in the US, India and the UK: Akira, Ghost in the Shell, Satoshi Kon's, Mamoru Hosoda's and Makoto Shinkai's films, A Silent Voice and more, with Hindi audio marked.`),
    alternates: { canonical: "/classic-anime-movies" },
  };
}

/** Classic non-Ghibli anime films and where each streams in the US, India and the UK, with director pages. */
export default function ClassicAnimeMovies() {
  const films = classicFilms();
  const classics = films.filter((f) => f.group === "classic");
  const asked = ASKED.map((t) => films.find((f) => f.t === t)).filter((f) => f !== undefined);
  const hindi = films.filter((f) => hindiIn(f).length);

  const faq: FaqItem[] = [
    ...asked.map((f) => ({ q: `Where can I watch ${f.t.replace(/\.$/, "")}?`, a: `${whereSentence(f)}.` })),
    ...(hindi.length ? [{ q: "Which of these anime films are in Hindi?", a: `${list(hindi.map((f) => `${f.t.replace(/\.$/, "")} (${[...new Set(hindiIn(f).map((s) => s.service))].join(", ")})`))}.` }] : []),
    { q: "Where are the Studio Ghibli films?", a: "On their own page: every Ghibli film and where it streams in the US, India and the UK." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Classic anime films and where to watch them", films.map((f) => ({ url: `/anime/${f.kitsu}`, name: `${f.t} (${f.year})` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/classic-anime-movies", label: "Classic anime films" }]}
        eyebrow="🎞️ Anime films"
        title={<>Where to watch <span className="text-gradient">classic anime films</span></>}
        subtitle={`${films.length} landmark films beyond Studio Ghibli, from Akira and Ghost in the Shell to Satoshi Kon, Mamoru Hosoda and Makoto Shinkai, with where each streams in the US, India and the UK.`}
        facts={[{ value: String(films.length), label: "films" }, { value: "3", label: "directors with their own page" }, { value: String(hindi.length), label: "with Hindi audio" }]}
        hue={210}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          {(Object.keys(DIRECTORS) as DirectorSlug[]).map((s) => <Link key={s} href={directorPath(s)} className="chip">{DIRECTORS[s].name} movies</Link>)}
          <Link href="/studio-ghibli" className="chip">Studio Ghibli</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(CLASSIC_CHECKED)}>
        {asked.slice(0, 3).map((f) => `${f.t.replace(/\.$/, "")}: ${whereSentence(f)}.`).join(" ")}
      </AnswerLead>

      <section className="reveal pt-10" aria-labelledby="classics-h">
        <h2 id="classics-h" className="h-section mb-4">Classics: Akira, Ghost in the Shell and more</h2>
        <ClassicFilmsTable films={classics} />
      </section>

      {(Object.keys(DIRECTORS) as DirectorSlug[]).map((s) => (
        <section key={s} className="reveal pt-10" aria-labelledby={`d-${s}`}>
          <h2 id={`d-${s}`} className="h-section mb-1"><Link href={directorPath(s)} className="hover:text-violet-2">{DIRECTORS[s].name}&apos;s films →</Link></h2>
          <p className="mb-3 max-w-3xl text-sm text-muted">{DIRECTORS[s].blurb}</p>
          {/* The full where-to-watch table lives on the director's page; here, the films and a one-line answer each. */}
          <ul className="grid gap-2 md:grid-cols-2">
            {filmsBy(s).map((f) => (
              <li key={f.t} className="card p-3 text-sm">
                <Link href={`/anime/${f.kitsu}`} className="font-semibold text-ink hover:text-violet-2">{f.t.replace(/\.$/, "")}</Link> <span className="text-muted">({f.year})</span>
                <p className="mt-0.5 text-xs leading-5 text-ink/75">{whereSentence(f)}.</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm"><Link href={directorPath(s)} className="font-medium text-violet hover:underline">All {DIRECTORS[s].name} films, with Hindi audio and free options marked →</Link></p>
        </section>
      ))}

      <MadeBy className="mt-8" path="/classic-anime-movies" method="Each film is checked on JustWatch's US, India and UK pages and the platforms' own title pages; Hindi audio is read from the platform's page or confirmed by Anime News Network. Rent-only films are marked." date={CLASSIC_CHECKED} />
      <Faq title="Classic anime films: FAQ" items={faq} />
    </div>
  );
}
