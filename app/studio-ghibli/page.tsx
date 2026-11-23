import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { GHIBLI_CHECKED, ghibliFilms, ghibliHindi, ghibliWhere, type GhibliFilm, type GhibliRegion } from "@/lib/ghibli";

export const revalidate = 86400;

const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const REGIONS: GhibliRegion[] = ["US", "IN", "GB"];
const RNAME: Record<GhibliRegion, string> = { US: "the US", IN: "India", GB: "the UK" };

/** The service most Ghibli films stream on in a region, how many, and the films that are elsewhere. */
function mainService(films: GhibliFilm[], r: GhibliRegion) {
  const count = films.reduce<Record<string, number>>((m, f) => { for (const s of ghibliWhere(f, r)) m[s] = (m[s] || 0) + 1; return m; }, {});
  const [service, n] = Object.entries(count).sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
  return { service, n, others: films.filter((f) => !ghibliWhere(f, r).includes(service)) };
}

export function generateMetadata(): Metadata {
  const films = ghibliFilms();
  const us = mainService(films, "US"), india = mainService(films, "IN");
  return {
    title: fitTitle([`Where to Watch Studio Ghibli Movies (${y}): US, India & UK`, `Where to Watch Studio Ghibli Films (${y})`, "Where to Watch Studio Ghibli Movies"]),
    description: fitDescription(`All ${films.length} Studio Ghibli films and where they stream: ${us.n} on ${us.service} in the US, ${india.n} on ${india.service} in India and the UK, and the ${films.filter(ghibliHindi).length} with Hindi audio. From Nausicaä to The Boy and the Heron. Checked ${fmt(GHIBLI_CHECKED)}.`),
    alternates: { canonical: "/studio-ghibli" },
  };
}

/** Every Ghibli film with where it streams in each country and which have Hindi audio in India. */
export default function StudioGhibliPage() {
  const films = ghibliFilms();
  const main = Object.fromEntries(REGIONS.map((r) => [r, mainService(films, r)])) as Record<GhibliRegion, ReturnType<typeof mainService>>;
  const hindi = films.filter(ghibliHindi);
  const exceptions = (r: GhibliRegion) => main[r].others.map((f) => (ghibliWhere(f, r).length ? `${f.t} is on ${ghibliWhere(f, r).join(", ")} instead` : `${f.t} isn't streaming`));
  const count = (r: GhibliRegion) => (main[r].n === films.length ? `all ${films.length}` : `${main[r].n}`);

  const faq: FaqItem[] = [
    { q: "Where can I watch Studio Ghibli movies?", a: `In the US, ${main.US.n} of the ${films.length} films are on ${main.US.service}${main.US.others.length ? `; ${list(exceptions("US"))}` : ""}. In India, ${count("IN")} are on ${main.IN.service}; in the UK, ${count("GB")} are on ${main.GB.service}.` },
    { q: "Is Studio Ghibli on Netflix?", a: `Yes in India and the UK, where ${main.IN.service === "Netflix" ? main.IN.n : 0} and ${main.GB.service === "Netflix" ? main.GB.n : 0} of the films are on Netflix. In the US the films are on ${main.US.service} instead${main.US.others.some((f) => ghibliWhere(f, "US").includes("Netflix")) ? `, apart from ${list(main.US.others.filter((f) => ghibliWhere(f, "US").includes("Netflix")).map((f) => f.t))}, which is on Netflix` : ""}.` },
    { q: "Which Studio Ghibli movies are in Hindi?", a: hindi.length ? `${hindi.length} have Hindi audio on Netflix India: ${list(hindi.map((f) => f.t))}. The others have English and Japanese audio there.` : "None has Hindi audio on Netflix India right now." },
    { q: "Which Ghibli film should I watch first?", a: "Spirited Away is the best known, and it won the Oscar for Best Animated Feature; My Neighbor Totoro is the gentlest start for younger viewers. The Boy and the Heron, the newest, also won the Oscar." },
    { q: "Is Grave of the Fireflies a Ghibli film?", a: `Yes: Isao Takahata made it at Studio Ghibli in 1988. It streams on ${REGIONS.map((r) => `${ghibliWhere(films.find((f) => f.t === "Grave of the Fireflies")!, r).join(", ") || "nothing"} in ${RNAME[r]}`).join(", ")}${main.US.others.some((f) => f.t === "Grave of the Fireflies") ? `, so in the US it's the one Ghibli film that isn't on ${main.US.service}` : ""}.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Studio Ghibli films and where to watch them", films.map((f) => ({ url: `/anime/${f.kitsu}`, name: f.t })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/studio-ghibli", label: "Studio Ghibli" }]}
        eyebrow="🎬 Studio Ghibli"
        title={<>Where to watch <span className="text-gradient">Studio Ghibli</span> movies</>}
        subtitle="Every Studio Ghibli feature film, from Nausicaä to The Boy and the Heron, with where it streams in the US, India and the UK, and which have Hindi audio."
        facts={[
          { value: String(films.length), label: "films" },
          { value: `${main.US.n}`, label: `on ${main.US.service} (US)` },
          { value: `${main.IN.n}`, label: `on ${main.IN.service} (India)` },
          { value: String(hindi.length), label: "with Hindi audio" },
        ]}
        hue={150}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/top/movies" className="chip">Best anime movies</Link>
          <Link href="/where-to-watch" className="chip">Where to watch anime</Link>
          <Link href="/hindi-dub" className="chip">Hindi dubbed anime</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(GHIBLI_CHECKED)}>
        In the US, {main.US.n} of the {films.length} Studio Ghibli films stream on {main.US.service}{main.US.others.length ? `; ${list(exceptions("US"))}` : ""}. In India, {count("IN")} are on {main.IN.service}, {hindi.length} of them with Hindi audio ({list(hindi.map((f) => f.t))}). In the UK, {count("GB")} are on {main.GB.service}.
      </AnswerLead>

      <section className="reveal pt-10" aria-labelledby="films-h">
        <h2 id="films-h" className="h-section mb-1">Every Studio Ghibli film and where it streams</h2>
        <p className="mb-4 text-sm text-muted">In release order. All need a subscription; none is free.</p>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line"><th className="py-2 pr-3 font-semibold">Film</th><th className="py-2 pr-3 font-semibold">🇺🇸 US</th><th className="py-2 pr-3 font-semibold">🇮🇳 India</th><th className="py-2 pr-3 font-semibold">🇬🇧 UK</th><th className="py-2 font-semibold">Hindi</th></tr>
            </thead>
            <tbody>
              {films.map((f) => (
                <tr key={f.t} className="border-b border-line/50 align-top">
                  <td className="py-2.5 pr-3"><Link href={`/anime/${f.kitsu}`} className="font-medium text-ink hover:text-violet-2">{f.t}</Link><span className="block text-xs text-muted">{f.year} · {f.director}</span></td>
                  {REGIONS.map((r) => <td key={r} className="py-2.5 pr-3 text-ink/85">{ghibliWhere(f, r).join(", ") || <span className="text-muted">Not streaming</span>}</td>)}
                  <td className="py-2.5">{ghibliHindi(f) ? <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-semibold text-orange-300">Hindi audio</span> : <span className="text-xs text-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {hindi.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="hi-h">
          <h2 id="hi-h" className="h-section mb-1">🇮🇳 Studio Ghibli movies in Hindi</h2>
          <p className="mb-3 max-w-3xl text-sm text-muted">These {hindi.length} have Hindi audio on Netflix India, read from each title&apos;s page. Switch the audio from the player&apos;s Audio &amp; Subtitles menu.</p>
          <ul className="flex flex-wrap gap-1.5 text-sm">{hindi.map((f) => <li key={f.t}><Link href={`/anime/${f.kitsu}`} className="chip">{f.t}</Link></li>)}</ul>
        </section>
      )}

      <MadeBy className="mt-8" method="Each film is checked on JustWatch's US, India and UK pages and the platform's own title page; Hindi audio is read from Netflix India's title pages." date={GHIBLI_CHECKED} />
      <Faq title="Studio Ghibli: where to watch, FAQ" items={faq} />
    </div>
  );
}
