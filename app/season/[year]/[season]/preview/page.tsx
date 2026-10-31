import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { SEASONS, cap, shiftSeason, animePath, type Season } from "@/lib/kitsu";
import { getSeasonPreview, premiereCalendar, type PreviewItem } from "@/lib/preview";
import PageHero from "@/components/PageHero";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import HypeButton, { HypeProvider } from "@/components/HypeButton";
import HypeBoard from "@/components/HypeBoard";
import LeadForm from "@/components/LeadForm";
import { dbEnabled } from "@/lib/db";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ year: string; season: string }> };

const MONTHS: Record<Season, string> = { winter: "January to March", spring: "April to June", summer: "July to September", fall: "October to December" };
const HUE: Record<Season, number> = { winter: 200, spring: 330, summer: 40, fall: 20 };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parse(year: string, season: string) {
  const y = Number(year);
  if (!SEASONS.includes(season as Season) || !(y >= 2000 && y <= new Date().getFullYear() + 2)) notFound();
  return { y, s: season as Season };
}
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const when = (d: PreviewItem["date"]) => (d.day && d.month ? dayLabel(`${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`) : d.month ? `${MON[d.month - 1]} ${d.year}` : "Date TBA");
const name = (i: PreviewItem) => i.anime?.title || i.title;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, season } = await params;
  const { y, s } = parse(year, season);
  const items = await getSeasonPreview(y, s);
  const top = items.slice(0, 3).map(name);
  return {
    title: `${cap(s)} ${y} Anime Preview: Every New Show, Sequel & Premiere Date`,
    description: `The ${cap(s)} ${y} anime season at a glance: ${items.length} shows${top.length ? ` including ${top.join(", ")}` : ""}, with premiere dates, studios, source material and which ones are sequels.`,
    alternates: { canonical: `/season/${y}/${s}/preview` },
    ...(items.length >= 5 ? {} : { robots: { index: false } }),
  };
}

function Row({ i, hype }: { i: PreviewItem; hype: boolean }) {
  const href = i.anime ? animePath(i.anime) : null;
  return (
    <li className="flex gap-3 p-3">
      <span className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-bg-2">{i.cover && <Image src={i.cover} alt="" fill sizes="64px" className="object-cover" />}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{href ? <Link href={href} className="hover:text-violet-2">{name(i)}</Link> : name(i)}</p>
        {i.native && i.native !== name(i) && <p className="truncate text-xs text-muted">{i.native}</p>}
        <p className="mt-1 text-sm text-ink/80">
          <span className="font-medium text-accent-2">{when(i.date)}</span>
          {" · "}{i.format}{i.episodes ? `, ${i.episodes} ep` : ""}{i.studio ? ` · ${i.studio}` : ""}{i.source ? ` · ${i.source}` : ""}
        </p>
        {i.prequel && (
          <p className="mt-0.5 text-xs text-muted">Follows {i.prequelAnime ? <Link href={animePath(i.prequelAnime)} className="text-violet hover:underline">{i.prequelAnime.title}</Link> : i.prequel.title}</p>
        )}
        {i.genres.length > 0 && <p className="mt-1.5 flex flex-wrap gap-1">{i.genres.map((g) => <span key={g} className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-muted">{g}</span>)}</p>}
        {hype && i.anime && <div className="mt-2"><HypeButton animeId={i.anime.id} compact /></div>}
      </div>
    </li>
  );
}

function Group({ id, title, sub, items, hype }: { id: string; title: string; sub: string; items: PreviewItem[]; hype: boolean }) {
  if (!items.length) return null;
  return (
    <section className="reveal mt-10" aria-labelledby={id}>
      <h2 id={id} className="h-section">{title} <span className="text-base font-semibold text-muted">{items.length}</span></h2>
      <p className="mt-1 text-sm text-muted">{sub}</p>
      <ul className="card mt-3 grid divide-y divide-line md:grid-cols-2 md:divide-y-0 md:[&>li]:border-b md:[&>li]:border-line">{items.map((i) => <Row key={i.id} i={i} hype={hype} />)}</ul>
    </section>
  );
}

export default async function SeasonPreview({ params }: Props) {
  const { year, season } = await params;
  const { y, s } = parse(year, season);
  const items = await getSeasonPreview(y, s);
  const sequels = items.filter((i) => i.kind === "sequel"), fresh = items.filter((i) => i.kind === "new"), movies = items.filter((i) => i.kind === "movie");
  const cal = premiereCalendar(items.filter((i) => i.kind !== "movie"));
  const dated = cal.reduce((n, d) => n + d.items.length, 0);
  const prev = shiftSeason(s, y, -1), next = shiftSeason(s, y, 1);
  const label = `${cap(s)} ${y}`;
  const community = dbEnabled();
  const linked = items.filter((i) => i.anime);
  const adaptations = Object.entries(items.reduce<Record<string, number>>((m, i) => { if (i.source) m[i.source] = (m[i.source] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);

  const faq: FaqItem[] = [
    { q: `When does the ${label} anime season start?`, a: `${label} covers shows premiering from ${MONTHS[s]} ${y}.${cal[0] ? ` The first dated premiere is ${name(cal[0].items[0])} on ${dayLabel(cal[0].date)}.` : ""}` },
    { q: `What are the most anticipated anime of ${label}?`, a: items.length ? `By how many AniList users are following them: ${items.slice(0, 5).map(name).join(", ")}.` : "The line-up hasn't been announced yet." },
    { q: `How many ${label} anime are sequels?`, a: `${sequels.length} of the ${items.length - movies.length} series listed here continue an earlier anime; ${fresh.length} are new.` },
    ...(adaptations[0] ? [{ q: `What are most ${label} anime based on?`, a: adaptations.slice(0, 3).map(([k, n]) => `${k}: ${n}`).join("; ") + "." }] : []),
  ];

  return (
    <HypeProvider ids={community ? linked.map((i) => i.anime!.id) : []}>
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/season", label: "Seasons" }, { href: `/season/${y}/${s}`, label }, { href: `/season/${y}/${s}/preview`, label: "Preview" }]}
        eyebrow={`Season preview · ${MONTHS[s]}`}
        title={<><span className="text-gradient">{label}</span> anime preview</>}
        subtitle={items.length ? `Every notable new series, sequel and film of the season, with premiere dates, studios and source material. Most-followed first.` : `The ${label} line-up hasn't been announced yet. Check back closer to the season.`}
        facts={[
          { value: String(items.length - movies.length), label: "series" },
          { value: String(sequels.length), label: "sequels" },
          { value: String(fresh.length), label: "new series" },
          ...(movies.length ? [{ value: String(movies.length), label: "films" }] : []),
          { value: String(dated), label: "with a premiere date" },
        ]}
        hue={HUE[s]}
        posters={items.slice(0, 3).map((i) => i.cover)}
      >
        <div className="flex flex-wrap gap-2">
          <Link href={`/season/${prev.year}/${prev.season}/preview`} className="chip">← {cap(prev.season)} {prev.year}</Link>
          <Link href={`/season/${y}/${s}`} className="chip">Full {label} chart</Link>
          <Link href={`/season/${next.year}/${next.season}/preview`} className="chip">{cap(next.season)} {next.year} →</Link>
        </div>
      </PageHero>

      {items.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="top-h">
          <h2 id="top-h" className="h-section mb-3">Most anticipated</h2>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {items.slice(0, 6).map((i, n) => {
              const body = (
                <>
                  <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2">
                    {i.cover && <Image src={i.cover} alt="" fill sizes="(max-width:640px) 50vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />}
                    <span className="absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-bold text-snow">#{n + 1}</span>
                    {i.kind === "sequel" && <span className="absolute right-2 top-2 rounded-md bg-violet-strong px-1.5 py-0.5 text-[10px] font-bold uppercase text-snow">Sequel</span>}
                  </span>
                  <span className="mt-2 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{name(i)}</span>
                  <span className="block truncate text-xs text-muted">{when(i.date)}{i.studio ? ` · ${i.studio}` : ""}</span>
                </>
              );
              return <li key={i.id}>{i.anime ? <Link href={animePath(i.anime)} className="group block">{body}</Link> : <div className="group">{body}</div>}</li>;
            })}
          </ol>
        </section>
      )}

      {community && <HypeBoard items={linked.map((i) => ({ id: i.anime!.id, title: name(i), href: animePath(i.anime!) }))} title={`Most hyped ${label} shows`} />}

      {community && items.length > 0 && (
        <LeadForm
          className="reveal mt-10"
          kind="cheatsheet"
          source="preview-cheatsheet"
          title={`📋 Get the ${label} cheat sheet`}
          blurb="Every premiere date on one printable page, plus a heads-up when new shows are confirmed."
          button="Send it to me"
          done={<p className="mt-1 text-sm"><Link href={`/season/${y}/${s}/cheatsheet`} className="font-semibold text-violet hover:text-violet-2">Open the {label} cheat sheet →</Link></p>}
        />
      )}

      {cal.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="cal-h">
          <h2 id="cal-h" className="h-section">Premiere calendar</h2>
          <p className="mt-1 text-sm text-muted">Japanese broadcast dates; streaming usually follows within a day.</p>
          <ol className="card mt-3 divide-y divide-line">
            {cal.map((d) => (
              <li key={d.date} className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:gap-4">
                <span className="w-28 shrink-0 text-sm font-semibold text-accent-2">{dayLabel(d.date)}</span>
                <span className="text-sm text-ink/90">{d.items.map((i, k) => <span key={i.id}>{k > 0 && ", "}{i.anime ? <Link href={animePath(i.anime)} className="hover:text-violet-2">{name(i)}</Link> : name(i)}{i.kind === "sequel" && <span className="text-muted"> (sequel)</span>}</span>)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Group id="seq-h" title="Sequels and new seasons" sub="Returning shows. Catch up first with each one's watch order." items={sequels} hype={community} />
      <AdSlot slot="preview-mid" />
      <Group id="new-h" title="New series" sub="First seasons, most-followed first." items={fresh} hype={community} />
      <Group id="mov-h" title="Films" sub="Theatrical releases dated in this season." items={movies} hype={community} />

      <p className="mt-6 text-xs text-muted">Line-up, dates and studios from AniList; titles link to AniLumi pages once Kitsu lists them. Updated daily.</p>
      <Faq items={faq} />
    </div>
    </HypeProvider>
  );
}
