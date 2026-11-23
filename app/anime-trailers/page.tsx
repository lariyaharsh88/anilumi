import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import SectionNav from "@/components/fx/SectionNav";
import AnswerLead from "@/components/AnswerLead";
import YouTubeFacade from "@/components/YouTubeFacade";
import { animePath, cap, seasonOf, shiftSeason, type Season } from "@/lib/kitsu";
import { getSeasonPreview, type PreviewItem } from "@/lib/preview";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { withTrailers, youtubeTrailers, type TrailerItem } from "@/lib/trailers";

export const revalidate = 86400;

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const when = (d: PreviewItem["date"]) => (d.day && d.month ? `${MON[d.month - 1]} ${d.day}, ${d.year}` : d.month ? `${MON[d.month - 1]} ${d.year}` : "Date TBA");
const name = (i: PreviewItem) => i.title || i.anime?.title || "";

/**
 * "upcoming anime pvs and trailers" is the question Bing Copilot cites AniLumi for most (140 citations, Nov 2026)
 * while the site ranks ~8 for it: every trailer and PV for the next three seasons, most anticipated first.
 */
async function load() {
  const now = seasonOf();
  const seasons = [1, 2, 3].map((d) => shiftSeason(now.season, now.year, d));
  const previews = await Promise.all(seasons.map((x) => getSeasonPreview(x.year, x.season).catch(() => [] as PreviewItem[])));
  // Trailers come with the weekly preview snapshot (scripts/fetch-season-previews.mts); only shows it doesn't cover
  // (the third season out, or an older snapshot) are looked up live.
  const all = previews.flat();
  const videos = new Map(all.flatMap((i) => (i.trailer ? [[i.id, i.trailer] as [number, string]] : [])));
  const missing = all.filter((i) => i.trailer === undefined).map((i) => i.id);
  if (missing.length) for (const [id, v] of await youtubeTrailers([...new Set(missing)])) videos.set(id, v);
  const groups = seasons.map((x, k) => ({ ...x, label: `${cap(x.season)} ${x.year}`, items: withTrailers(previews[k], videos) })).filter((g) => g.items.length);
  return { groups, total: groups.reduce((n, g) => n + g.items.length, 0) };
}

export async function generateMetadata(): Promise<Metadata> {
  const { groups, total } = await load();
  const first = groups[0];
  const top = first ? first.items.map(name).filter((t) => t.length <= 26).slice(0, 3) : [];
  return {
    title: fitTitle([first && `Upcoming Anime Trailers & PVs: ${total} for ${groups.map((g) => g.label).join(", ")}`, first && `Upcoming Anime Trailers & PVs (${first.label}): ${total} to Watch`, "Upcoming Anime Trailers & PVs"]),
    description: fitDescription(`Watch the trailers and PVs for ${total} upcoming anime${first ? `, from ${first.label}${top.length ? ` (${top.join(", ")})` : ""}` : ""} onward, with premiere dates and studios, most anticipated first. Updated daily.`),
    alternates: { canonical: "/anime-trailers" },
    ...(total >= 5 ? {} : { robots: { index: false, follow: true } }),
  };
}

function Card({ i }: { i: TrailerItem }) {
  const href = i.anime ? animePath(i.anime) : null;
  return (
    <li className="min-w-0">
      <YouTubeFacade id={i.video} title={`${name(i)} trailer`} />
      <p className="mt-2 font-semibold leading-snug text-ink">{href ? <Link href={href} className="hover:text-violet-2">{name(i)}</Link> : name(i)}</p>
      <p className="text-xs text-muted">
        <span className="font-medium text-accent-2">{when(i.date)}</span>{" · "}{i.format}{i.studio ? ` · ${i.studio}` : ""}{i.kind === "sequel" ? " · Sequel" : ""}
      </p>
    </li>
  );
}

/** Trailers for the next three seasons, each season most anticipated first. */
export default async function AnimeTrailers() {
  const { groups, total } = await load();
  const first = groups[0];
  const faq = [
    { q: "What is a PV in anime?", a: "PV stands for promotional video: the official trailers and teasers a studio releases before a show airs. A first teaser often only confirms the anime; later PVs show footage, the cast, the theme songs and the premiere date." },
    ...(first ? [{ q: `Which ${first.label} anime trailers should I watch first?`, a: `The most anticipated on AniList right now: ${first.items.slice(0, 6).map((i) => `${name(i)} (${when(i.date)})`).join(", ")}.` }] : []),
    { q: "When do new anime trailers come out?", a: "Most shows release a teaser when they're announced, then more PVs in the months before the premiere. Big waves come with the season's announcements and anime events: Jump Festa in December, AnimeJapan in March and Anime Expo in July." },
    { q: "Where can I watch official anime trailers?", a: "On the studios' and licensors' YouTube channels (Crunchyroll, Aniplex, TOHO animation, the shows' own channels). Every trailer here plays from YouTube; nothing is re-uploaded." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Upcoming anime with a trailer", groups.flatMap((g) => g.items).flatMap((i) => (i.anime ? [{ url: animePath(i.anime), name: `${name(i)} trailer` }] : [])))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/anime-trailers", label: "Anime trailers" }]}
        eyebrow="▶ Trailers & PVs"
        title={<>Upcoming anime <span className="text-gradient">trailers &amp; PVs</span></>}
        subtitle="Every official trailer for the next three seasons, most anticipated first, with the premiere date and studio. Videos load only when you press play."
        facts={[{ value: String(total), label: "trailers" }, ...groups.map((g) => ({ value: String(g.items.length), label: g.label }))]}
        hue={350}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          {groups.map((g) => <Link key={g.label} href={`/season/${g.year}/${g.season}/preview`} className="chip">{g.label} preview</Link>)}
          <Link href="/upcoming-seasons" className="chip">Confirmed sequels</Link>
        </p>
      </PageHero>
      {first && (
        <AnswerLead>
          {total} upcoming anime have an official trailer or PV: {groups.map((g) => `${g.items.length} for ${g.label}`).join(", ")}. The most anticipated {first.label} trailers are {first.items.slice(0, 4).map((i) => `${name(i)} (${when(i.date)})`).join(", ")}. New PVs land with each announcement wave; Jump Festa in December is the next big one.
        </AnswerLead>
      )}
      <SectionNav sections={[...groups.map((g) => ({ id: `${g.season}-${g.year}`, label: g.label })), { id: "faq", label: "FAQ" }]} />

      {groups.map((g) => (
        <section key={g.label} id={`${g.season}-${g.year}`} data-section className="reveal pt-10" aria-labelledby={`${g.season}-${g.year}-h`}>
          <h2 id={`${g.season}-${g.year}-h`} className="h-section mb-1">{g.label} anime trailers</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">{g.items.length} shows premiering {seasonMonths(g.season)} {g.year}. <Link href={`/season/${g.year}/${g.season}/preview`} className="text-violet hover:underline">Full {g.label} preview</Link>, with every show and its date.</p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((i) => <Card key={i.id} i={i} />)}
          </ul>
        </section>
      ))}

      <div id="faq" data-section className="pt-2"><Faq title="Anime trailers FAQ" items={faq} /></div>
    </div>
  );
}

const seasonMonths = (s: Season) => ({ winter: "January to March", spring: "April to June", summer: "July to September", fall: "October to December" })[s];
