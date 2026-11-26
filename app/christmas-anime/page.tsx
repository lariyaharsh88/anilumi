import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import data from "@/data/christmas-anime.json";

export const revalidate = 86400;

/**
 * Christmas anime: films set over Christmas and series with a well-known Christmas episode or arc, with where each
 * streams legally in the US, India and the UK. "christmas anime movies" is 720 searches a month in India and 4.4K in
 * December, "anime xmas" 1.9K in December (Keyword Planner, Nov 2026). Christmas connections from ANN, the Japan
 * Times, CBR and episode lists; availability from JustWatch's regional pages (data/christmas-anime.json).
 */
type Offer = { service: string; kind: "subscription" | "free" | "buy"; note?: string; url: string };
type Title = { t: string; kind: "film" | "special" | "episode" | "series-arc"; year: number; what: string; why: string; slug: string; regions: Record<"US" | "IN" | "GB", Offer[]>; sources: string[]; confidence: "high" | "medium" };
const D = data as unknown as { checked: string; titles: Title[] };
const REGIONS = [["US", "🇺🇸 US"], ["IN", "🇮🇳 India"], ["GB", "🇬🇧 UK"]] as const;
const KIND_LABEL: Record<Title["kind"], string> = { film: "Film", special: "OVA / special", episode: "Episode", "series-arc": "Story arc" };
const OFFER: Record<Offer["kind"], string> = { subscription: "", free: "free", buy: "rent/buy" };
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const safe = (u: string) => (/^https:\/\/[^\s"<>]+$/.test(u) ? u : null);
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const films = D.titles.filter((t) => t.kind === "film" || t.kind === "special");
const episodes = D.titles.filter((t) => t.kind === "episode" || t.kind === "series-arc");
const streams = (t: Title, r: "US" | "IN" | "GB") => t.regions[r].filter((o) => o.kind !== "buy");

export function generateMetadata(): Metadata {
  return {
    title: fitTitle([`Christmas Anime: ${D.titles.length} Movies & Episodes and Where to Stream (${new Date(D.checked).getUTCFullYear()})`, `Christmas Anime: ${D.titles.length} Movies & Episodes to Watch`, "Christmas Anime Movies & Episodes"]),
    description: fitDescription(`${films.length} Christmas anime films and ${episodes.length} series with Christmas episodes, from ${films[0]?.t} to ${episodes[0]?.t}, with where each streams legally in the US, India and the UK. Checked ${fmt(D.checked)}.`),
    alternates: { canonical: "/christmas-anime" },
  };
}

export default function ChristmasAnime() {
  const onNetflix = D.titles.filter((t) => (["US", "IN", "GB"] as const).some((r) => t.regions[r].some((o) => /netflix/i.test(o.service))));
  const nowhereIN = D.titles.filter((t) => t.regions.IN.length === 0);
  const tg = D.titles.find((t) => t.slug === "tokyo-godfathers");
  const faq: FaqItem[] = [
    { q: "What is the best Christmas anime movie?", a: `${tg ? `${tg.t} (${tg.year}), Satoshi Kon's film about three homeless people who find a baby on Christmas Eve, is the classic. ` : ""}Others set over Christmas: ${list(films.filter((t) => t !== tg).map((t) => `${t.t} (${t.year})`))}.` },
    ...(tg ? [{ q: "Where can I watch Tokyo Godfathers?", a: REGIONS.map(([r, label]) => `${label.replace(/^\S+ /, "")}: ${tg.regions[r].length ? tg.regions[r].map((o) => `${o.service}${OFFER[o.kind] ? ` (${OFFER[o.kind]})` : ""}`).join(", ") : "no legal option found"}`).join(". ") + ". It isn't on any subscription service in these countries." }] : []),
    { q: "Which anime have Christmas episodes?", a: list(episodes.map((t) => `${t.t}${t.what ? ` (${t.what})` : ""}`)) + "." },
    ...(onNetflix.length ? [{ q: "Is there Christmas anime on Netflix?", a: `Yes: ${list(onNetflix.map((t) => t.t))}, depending on your country (see each title above).` }] : []),
    ...(nowhereIN.length ? [{ q: "Which Christmas anime can't I stream in India?", a: `${list(nowhereIN.map((t) => t.t))}: no legal option in India on JustWatch as of ${fmt(D.checked)}.` }] : []),
  ];

  const Card = ({ t }: { t: Title }) => (
    <li className="card p-4">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <Link href={`/anime/${t.slug}`} className="text-lg font-bold text-ink hover:text-violet-2">{t.t}</Link>
        <span className="text-sm text-muted">{t.year} · {KIND_LABEL[t.kind]}{t.what ? ` · ${t.what}` : ""}</span>
      </p>
      <p className="mt-1 text-sm leading-6 text-ink/85">{t.why}</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        {REGIONS.map(([r, label]) => (
          <div key={r}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-0.5">
              {t.regions[r].length ? t.regions[r].map((o, i) => {
                const u = safe(o.url);
                const name = <>{o.service}{OFFER[o.kind] ? <span className="text-muted"> ({OFFER[o.kind]})</span> : null}</>;
                return <span key={i} className="block">{u ? <a href={u} target="_blank" rel="noopener nofollow" className="text-ink hover:text-violet-2">{name}</a> : name}</span>;
              }) : <span className="text-muted">Not streaming legally</span>}
            </dd>
          </div>
        ))}
      </dl>
      {t.sources[0] && <p className="mt-2 text-xs text-muted">{t.sources.slice(0, 2).map((u, i) => safe(u) && <a key={u} href={u} target="_blank" rel="noopener nofollow" className="mr-3 underline">Source {i + 1}</a>)}</p>}
    </li>
  );

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Christmas anime", D.titles.map((t) => ({ url: `/anime/${t.slug}`, name: `${t.t} (${t.year})` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/christmas-anime", label: "Christmas anime" }]}
        eyebrow="🎄 Holiday watch list"
        title={<>Christmas <span className="text-gradient">anime</span></>}
        subtitle="Films set over Christmas and series with a well-known Christmas episode, with where each one streams legally in the US, India and the UK."
        facts={[{ value: String(films.length), label: "films and specials" }, { value: String(episodes.length), label: "Christmas episodes and arcs" }]}
        hue={140}
      />

      <AnswerLead checked={fmt(D.checked)}>
        The classic Christmas anime film is {tg ? `${tg.t} (${tg.year})` : films[0]?.t}; {list(films.filter((t) => t !== tg).slice(0, 3).map((t) => t.t))} are also set over Christmas. For a single evening, the Christmas episodes of {list(episodes.slice(0, 4).map((t) => t.t))} stand on their own. Streaming differs by country: {D.titles.filter((t) => streams(t, "IN").length).length} of these {D.titles.length} stream in India, {D.titles.filter((t) => streams(t, "US").length).length} in the US.
      </AnswerLead>

      <section className="reveal pt-10" aria-labelledby="films-h">
        <h2 id="films-h" className="h-section mb-3">Christmas anime movies</h2>
        <ol className="space-y-3">{films.map((t) => <Card key={t.slug} t={t} />)}</ol>
      </section>

      <section className="reveal pt-10" aria-labelledby="eps-h">
        <h2 id="eps-h" className="h-section mb-1">Anime with Christmas episodes</h2>
        <p className="mb-3 max-w-3xl text-sm text-muted">Each can be watched on its own; the episode numbers follow the Japanese broadcast, and some services number them differently.</p>
        <ol className="space-y-3">{episodes.map((t) => <Card key={t.slug} t={t} />)}</ol>
      </section>

      <p className="mt-8 flex flex-wrap gap-2 text-sm">
        <Link href="/classic-anime-movies" className="chip">Classic anime films</Link>
        <Link href="/hindi-dub/movies" className="chip">Anime movies in Hindi</Link>
        <Link href="/anime-streaming-sites" className="chip">Legal anime streaming sites</Link>
        <Link href="/hindi-dub/best" className="chip">Hindi dubs to binge over the holidays</Link>
      </p>

      <MadeBy className="mt-8" path="/christmas-anime" method="Christmas connections from Anime News Network, the Japan Times, CBR and episode lists; where to watch from JustWatch's US, India and UK pages and the services' own links. Catalogues change often in December." date={D.checked} />
      <Faq title="Christmas anime: FAQ" items={faq} />
    </div>
  );
}
