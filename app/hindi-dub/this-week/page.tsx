import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { animePath } from "@/lib/kitsu";
import { dubShows, dubsDate, dueWithin, type DubShow } from "@/lib/dubschedule";
import { hindiComing } from "@/lib/hindistats";
import { HINDI_PLATFORMS, platformKind } from "@/lib/hindidub";

// Next-episode times move every day; an hourly refresh keeps "this week" honest.
export const revalidate = 3600;

const IST = "Asia/Kolkata";
const DAY = 86_400_000;
const dayKey = (at: number) => new Date(at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: IST });
const time = (at: number) => new Date(at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: IST });
const shortDate = (at: number) => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: IST });
const platformPage = (service: string) => HINDI_PLATFORMS.find((p) => p.match.test(service)) ?? null;

/** This week's Hindi dubbed episodes (data/dub-schedule.json), soonest first. */
function week(now = Date.now()) {
  const due = dueWithin(now, 7).filter((x) => x.e.lang === "hi");
  const days = new Map<string, typeof due>();
  for (const x of due) days.set(dayKey(x.at), [...(days.get(dayKey(x.at)) ?? []), x]);
  const services = new Map<string, number>();
  for (const x of due) services.set(x.e.service, (services.get(x.e.service) ?? 0) + 1);
  const airing = dubShows().filter((e) => e.lang === "hi" && e.status === "airing");
  return { due, days, services: [...services].sort((a, b) => b[1] - a[1]), airing, from: now, to: now + 6 * DAY };
}

export function generateMetadata(): Metadata {
  const w = week();
  const range = `${shortDate(w.from)}–${shortDate(w.to)}`;
  return {
    title: fitTitle([`Hindi Dub Schedule This Week (${range}): ${w.due.length} New Hindi Episodes`, `Hindi Dub Schedule This Week: ${w.due.length} New Hindi Dubbed Episodes`, "Hindi Dub Schedule This Week"]),
    description: fitDescription(`Every Hindi dubbed anime episode out in the next 7 days, with the day and time in IST and the platform: ${w.services.slice(0, 3).map(([s, n]) => `${n} on ${s.replace(/ \(.*\)$/, "")}`).join(", ")}. ${w.airing.length} Hindi dubs airing weekly this season.`),
    alternates: { canonical: "/hindi-dub/this-week" },
  };
}

export default function HindiDubThisWeek() {
  const w = week();
  const coming = hindiComing();
  const first = w.due[0];
  const faq: FaqItem[] = [
    { q: "Which Hindi dubbed anime episodes come out this week?", a: w.due.length ? w.due.map((x) => `${x.e.t} episode ${x.episode} (${x.e.service}, ${dayKey(x.at)}${x.timed ? `, ${time(x.at)} IST` : ""})`).join("; ") + "." : "No Hindi dubbed episodes are scheduled in the next 7 days." },
    { q: "Which platform releases the most Hindi dubbed episodes?", a: w.services.length ? `This week: ${w.services.map(([s, n]) => `${s} (${n})`).join(", ")}.` : "No Hindi episodes are scheduled this week." },
    { q: "What time do new Hindi dubbed episodes come out?", a: "It depends on the platform and the show: Crunchyroll's Hindi episodes mostly go up in the evening IST on the same weekday each week, Netflix's in the afternoon. Times above are in IST where the platform publishes one; otherwise the day only." },
    ...(coming.length ? [{ q: "Which Hindi dubs are coming soon?", a: `${coming.map((e) => `${e.t} on ${e.service}${e.premiere ? ` from ${shortDate(Date.parse(/T/.test(e.premiere) ? e.premiere : `${e.premiere}T00:00:00Z`))}` : " (date not announced)"}`).join("; ")}.` }] : []),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("CollectionPage", "/hindi-dub/this-week", "Hindi dub schedule this week")} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: "/hindi-dub/this-week", label: "This week" }]}
        eyebrow="🇮🇳 Hindi dub schedule"
        title={<>New <span className="text-gradient">Hindi dubbed episodes</span> this week</>}
        subtitle={`Every Hindi dubbed anime episode coming out in the next 7 days (${shortDate(w.from)}–${shortDate(w.to)}), with the day, the time in IST and where to watch it.`}
        facts={[
          { value: String(w.due.length), label: "episodes this week" },
          { value: String(w.airing.length), label: "Hindi dubs airing" },
          ...(first ? [{ value: first.timed ? time(first.at) : shortDate(first.at), label: `next: ${first.e.service.replace(/ \(.*\)$/, "")}` }] : []),
        ]}
        hue={25}
      />

      <section className="reveal mt-10" aria-labelledby="days-h">
        <h2 id="days-h" className="h-section mb-1">Day by day</h2>
        <p className="mb-4 text-sm text-muted">Times in IST where the platform gives one; otherwise the release day.</p>
        {w.due.length ? (
          <div className="space-y-5">
            {[...w.days].map(([day, list]) => (
              <div key={day}>
                <h3 className="mb-2 font-semibold text-ink">{day}</h3>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map(({ e, episode, at, timed }) => <EpisodeCard key={`${e.t}-${e.service}`} e={e} episode={episode} at={at} timed={timed} />)}
                </ul>
              </div>
            ))}
          </div>
        ) : <p className="card p-4 text-sm text-muted">No Hindi dubbed episodes are scheduled in the next 7 days.</p>}
        <JoinChannels source="hindi-this-week" className="mt-6" />
      </section>

      {w.services.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="plat-h">
          <h2 id="plat-h" className="h-section mb-3">This week by platform</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {w.services.map(([service, n]) => {
              const p = platformPage(service);
              return (
                <li key={service} className="card p-4 text-sm">
                  <p className="font-semibold text-ink">{p ? <Link href={`/hindi-dub/${p.slug}`} className="hover:text-violet-2">{service}</Link> : service} <span className="text-muted">· {n} episode{n === 1 ? "" : "s"}</span></p>
                  <p className="mt-1 text-xs text-muted">{w.due.filter((x) => x.e.service === service).map((x) => x.e.t).join(", ")}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="reveal mt-10" aria-labelledby="air-h">
        <h2 id="air-h" className="h-section mb-1">Every Hindi dub airing weekly</h2>
        <p className="mb-4 text-sm text-muted">{w.airing.length} shows getting a new Hindi episode each week this season.</p>
        <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {w.airing.map((e) => (
            <li key={`${e.t}-${e.service}`} className="flex items-baseline justify-between gap-3 border-b border-line/50 py-1.5">
              <span className="min-w-0 truncate">{e.slug ? <Link href={animePath({ slug: e.slug })} className="text-ink hover:text-violet-2">{e.t}</Link> : <span className="text-ink">{e.t}</span>}</span>
              <span className="shrink-0 text-xs text-muted">{e.weekday ? `${e.weekday}s` : "Weekly"} · {e.service.replace(/ \(.*\)$/, "")}</span>
            </li>
          ))}
        </ul>
      </section>

      {coming.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="soon-h">
          <h2 id="soon-h" className="h-section mb-3">Hindi dubs coming soon</h2>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {coming.map((e) => (
              <li key={`${e.t}-${e.service}`} className="card p-3">
                <p className="font-semibold text-ink">{e.slug ? <Link href={animePath({ slug: e.slug })} className="hover:text-violet-2">{e.t}</Link> : e.t}</p>
                <p className="text-xs text-muted">{e.service}{e.premiere ? ` · from ${shortDate(Date.parse(/T/.test(e.premiere) ? e.premiere : `${e.premiere}T00:00:00Z`))}` : " · date not announced"}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 flex flex-wrap gap-2 text-sm">
        <Link href="/hindi-dub" className="chip">All Hindi dubbed anime</Link>
        <Link href="/new-dubs" className="chip">New dubs, week by week</Link>
        <Link href="/dub-schedule" className="chip">English dub schedule</Link>
        <Link href="/anime-streaming-sites" className="chip">Streaming sites in India</Link>
      </p>
      <p className="mt-4 text-xs text-muted">Schedule checked {dubsDate()} against the platforms&rsquo; announcements; episode dates after that follow each show&rsquo;s weekly slot. Platforms sometimes delay an episode, so check the app if one is missing. <Link href="/how-we-check" className="underline">How we check</Link></p>

      <Faq title="Hindi dub schedule: FAQ" items={faq} />
    </div>
  );
}

function EpisodeCard({ e, episode, at, timed }: { e: DubShow; episode: number; at: number; timed: boolean }) {
  const free = platformKind(e.service) === "free";
  return (
    <li className="card p-3 text-sm">
      <p className="font-semibold text-ink">{e.slug ? <Link href={animePath({ slug: e.slug })} className="hover:text-violet-2">{e.t}</Link> : e.t}</p>
      <p className="mt-0.5 text-xs text-muted">
        Episode {episode} · {timed ? `${time(at)} IST` : "time not given"} · {e.service}
        {free && <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 text-[10px] font-semibold text-emerald-300">FREE</span>}
      </p>
    </li>
  );
}
