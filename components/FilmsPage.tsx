import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import MadeBy from "@/components/MadeBy";
import SectionNav from "@/components/fx/SectionNav";
import { fitTitle, fitDescription } from "@/lib/titles";
import { FILMS_CHECKED, FILM_LANG, STATUS_LABEL, filmDub, filmFranchise, filmFranchises, filmsPath, hasLang, newestFirst, type Film, type FilmLang } from "@/lib/franchisefilms";
import { hindiDubPath } from "@/lib/hindidub";
import { hindiDubIndexed } from "@/lib/indexing";

/**
 * Every film of a big kids' franchise and whether it's dubbed in one language, newest first, with where and a
 * source. Keyword Planner, India, Nov 2026: "doraemon movie in hindi" 40.5K a month, "doraemon movie in telugu"
 * 8.1K, "doraemon movie in tamil" 6.6K, "shinchan movie in hindi" 18.1K, "shinchan movie in tamil" 2.4K. Today's
 * results are spam lists and partial fan pages with no dub status. Rendered by /hindi-dub, /tamil-dub and
 * /telugu-dub/movies/[franchise].
 */
function load(slug: string, lang: FilmLang) {
  const f = filmFranchise(slug);
  if (!f || !hasLang(f, lang)) notFound();
  const films = newestFirst(f.films).map((x) => ({ x, dub: filmDub(x, lang) }));
  const dubbed = films.filter((r) => r.dub.status !== "none_found");
  return { f, films, dubbed, now: films.filter((r) => r.dub.status === "available"), latest: films[0] };
}
const checked = () => new Date(`${FILMS_CHECKED}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const title = (x: Film) => (x.in && x.in !== x.en ? `${x.en} (${x.in})` : x.en);

export function filmsMetadata(slug: string, lang: FilmLang): Metadata {
  const { f, films, dubbed, latest } = load(slug, lang);
  const L = FILM_LANG[lang].name;
  const y = new Date().getFullYear();
  return {
    title: fitTitle([`${f.name} Movies in ${L} (${y}): All ${films.length} Films & Where to Watch`, `${f.name} Movies in ${L} (${y}): All ${films.length} Films`, `All ${f.name} Movies List in ${L} (${y})`, `${f.name} Movies in ${L}`]),
    description: fitDescription(`All ${films.length} ${f.name} movies in order, newest first: ${latest.x.en} (${latest.x.year}) and every earlier film, with which ${dubbed.length} have a ${L} dub and where to watch them in India. Checked ${checked()}.`),
    alternates: { canonical: filmsPath(f.slug, lang) },
  };
}

/** A franchise's films, newest first, with the dub status in `lang`, where and sources. */
export default function FilmsPage({ slug, lang }: { slug: string; lang: FilmLang }) {
  const { f, films, dubbed, now, latest } = load(slug, lang);
  const L = FILM_LANG[lang].name;
  const label = STATUS_LABEL(lang);
  const others = filmFranchises().filter((x) => x.slug !== f.slug && hasLang(x, lang));
  const langs = (Object.keys(FILM_LANG) as FilmLang[]).filter((l) => l !== lang && hasLang(f, l));
  const oldest = films[films.length - 1].x;
  const faq = [
    { q: `What is the new ${f.name} movie?`, a: `${title(latest.x)}, released in Japan in ${latest.x.year}. ${latest.dub.status === "available" ? `It's in ${L} on ${latest.dub.where.join(", ")}.` : latest.dub.status === "aired" ? `Its ${L} dub came out on ${latest.dub.where.join(", ")}.` : `No ${L} dub has been announced yet.`}` },
    { q: `How many ${f.name} movies are there?`, a: `${films.length} films so far, from ${oldest.en} (${oldest.year}) to ${latest.x.en} (${latest.x.year}).` },
    { q: `Which ${f.name} movies are in ${L}?`, a: dubbed.length ? `${dubbed.length} have had an official ${L} dub${now.length ? `, and ${now.length} can be watched in ${L} now: ${now.map((r) => `${r.x.en} (${r.dub.where.join(", ")})`).join("; ")}` : ""}.` : "None that we could confirm." },
    { q: `Where can I watch ${f.name} movies in ${L}?`, a: now.length ? `${[...new Set(now.flatMap((r) => r.dub.where))].join(", ")}. Films that only aired on TV come back on those channels from time to time; check their schedules.` : "Right now, only on TV reruns: check the channels listed on each film." },
  ];
  const Badge = ({ s }: { s: keyof typeof label }) => (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s === "available" ? "bg-emerald-500/15 text-emerald-300" : s === "aired" ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-muted"}`}>{label[s]}</span>
  );

  return (
    <div className="container-x pb-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${f.name} movies`, numberOfItems: films.length, itemListElement: films.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: `${r.x.en} (${r.x.year})` })) }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: FILM_LANG[lang].hub, label: FILM_LANG[lang].hubLabel }, ...(lang === "hi" ? [{ href: "/hindi-dub/movies", label: "Movies" }] : []), { href: filmsPath(f.slug, lang), label: `${f.name} movies` }]}
        eyebrow={`🇮🇳 ${L} dub`}
        title={<>{f.name} movies in <span className="text-gradient">{L}</span></>}
        subtitle={`Every ${f.name} film, newest first, with whether it has an official ${L} dub and where to watch it in India.`}
        facts={[
          { value: String(films.length), label: "films" },
          { value: String(dubbed.length), label: `with a ${L} dub` },
          { value: String(now.length), label: `in ${L} now` },
        ]}
        hue={25}
      />
      <MadeBy className="mt-4" date={FILMS_CHECKED} method={`Each ${L} status is from the platform's own page, the broadcaster's or distributor's announcement, or news reports; fan wikis count only as support for TV dubs. No unofficial uploads.`} />

      <SectionNav sections={[{ id: "latest", label: "Newest film" }, { id: "list", label: `All ${films.length}` }, { id: "faq", label: "FAQ" }]} />

      <section id="latest" data-section className="reveal pt-10" aria-labelledby="latest-h">
        <h2 id="latest-h" className="h-section mb-3">The newest {f.name} movie</h2>
        <div className="card p-4">
          <p className="flex flex-wrap items-center gap-2"><span className="text-lg font-bold text-ink">{title(latest.x)}</span><span className="text-sm text-muted">{latest.x.year}</span><Badge s={latest.dub.status} /></p>
          {latest.dub.where.length > 0 && <p className="mt-1 text-sm text-ink/90">{latest.dub.where.join(" · ")}</p>}
          {lang === "hi" && latest.x.note && <p className="mt-1 text-sm text-muted">{latest.x.note}</p>}
        </div>
      </section>

      <section id="list" data-section className="reveal pt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">All {films.length} {f.name} movies</h2>
        <p className="mb-4 text-sm text-muted">Newest first. Checked {checked()}. &ldquo;{label.aired}&rdquo; means it was shown in {L} on TV or in cinemas but isn&apos;t streaming legally right now.</p>
        <ol className="space-y-2">
          {films.map(({ x, dub }) => (
            <li key={`${x.year}-${x.en}`} className="card p-3 text-sm">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="w-12 shrink-0 font-semibold text-muted">{x.year}</span><span className="font-semibold text-ink">{title(x)}</span><Badge s={dub.status} />{x.live_action && <span className="text-[11px] text-muted">Live action</span>}</p>
              <p className="mt-0.5 pl-14 text-xs text-muted" lang="ja-Latn">{x.jp}</p>
              {(dub.where.length > 0 || dub.sources.length > 0) && (
                <p className="mt-1 flex flex-wrap gap-x-3 pl-14 text-xs text-muted">
                  {dub.where.length > 0 && <span className="text-ink/85">{dub.where.join(" · ")}</span>}
                  {dub.sources.slice(0, 2).map((u, i) => <a key={u} href={u} target="_blank" rel="noopener nofollow" className="underline">Source {i + 1}</a>)}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        {langs.map((l) => <Link key={l} href={filmsPath(f.slug, l)} className="chip">{f.name} movies in {FILM_LANG[l].name}</Link>)}
        {lang === "hi" && hindiDubIndexed(f.series) && <Link href={hindiDubPath(f.series)} className="chip">{f.name} series in Hindi</Link>}
        {lang === "hi" ? <Link href="/hindi-dub/movies" className="chip">🎬 All anime movies in Hindi</Link> : <Link href={FILM_LANG[lang].hub} className="chip">All {L} dubbed anime</Link>}
        {others.map((o) => <Link key={o.slug} href={filmsPath(o.slug, lang)} className="chip">{o.name} movies in {L}</Link>)}
      </p>

      <div id="faq" data-section className="pt-2"><Faq title={`${f.name} movies in ${L}: FAQ`} items={faq} /></div>
    </div>
  );
}
