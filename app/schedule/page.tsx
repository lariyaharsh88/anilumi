import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listAnime, Anime, animePath, posterUrl, fmtDate, weekdayOf, uniqueById, seasonOf } from "@/lib/kitsu";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import LocalTime from "@/components/LocalTime";
import Countdown from "@/components/Countdown";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: "Anime Schedule This Week – Daily Airing Calendar (JST)",
  description: "Weekly anime release schedule: which anime air today and every day this week, with exact JST times and streaming links. Updated every 30 minutes.",
  alternates: { canonical: "/schedule" },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function SchedulePage() {
  const { season, year } = seasonOf();
  const pages = await Promise.all([
    ...[0, 20, 40].map((offset) => listAnime({ filter: { status: "current", season, seasonYear: String(year) }, sort: "-userCount", limit: 20, offset, revalidate: 1800 })),
    ...[0, 20].map((offset) => listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 20, offset, revalidate: 1800 })),
  ]);
  const all = uniqueById(pages.flatMap((p) => p.items));
  const byDay = new Map<string, { a: Anime; estimated: boolean }[]>(DAYS.map((d) => [d, []]));
  const tba: Anime[] = [];
  for (const a of all) {
    const exact = weekdayOf(a.nextRelease);
    // Weekly TV series keep their premiere weekday, so fall back to it when Kitsu has no next-episode timestamp.
    const est = !exact && a.subtype === "TV" && a.startDate ? weekdayOf(`${a.startDate}T12:00:00+09:00`) : null;
    const d = exact || est;
    if (d && byDay.has(d)) byDay.get(d)!.push({ a, estimated: !exact });
    else tba.push(a);
  }
  const todayJst = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Tokyo" });
  const order = [...DAYS.slice(DAYS.indexOf(todayJst)), ...DAYS.slice(0, DAYS.indexOf(todayJst))];

  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/schedule", label: "Schedule" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight">Anime airing this week</h1>
      <p className="mt-2 max-w-2xl text-muted">Next-episode times for the {all.length} most-followed series currently airing, grouped by day in Japan Standard Time, with your local time alongside. Today is {todayJst} in Tokyo.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {order.map((d) => (
          <a key={d} href={`#${d.toLowerCase()}`} className={`chip ${d === todayJst ? "chip-active" : ""}`}>{d === todayJst ? `Today · ${d}` : d}</a>
        ))}
      </div>
      <AdSlot slot="schedule-top" />

      {order.map((day) => {
        const items = (byDay.get(day) || []).sort((x, y) => Number(x.estimated) - Number(y.estimated) || (x.a.nextRelease || "").localeCompare(y.a.nextRelease || "") || y.a.userCount - x.a.userCount);
        return (
          <section key={day} id={day.toLowerCase()} className="mt-10 scroll-mt-20">
            <h2 className="h-section mb-3">{day}{day === todayJst ? <span className="ml-2 rounded-md bg-accent px-2 py-0.5 text-xs font-bold uppercase text-white">Today</span> : null}</h2>
            {items.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map(({ a, estimated }) => (
                  <li key={a.id}>
                    <Link href={animePath(a)} className="card flex gap-3 p-3 transition hover:border-violet">
                      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-bg-2">
                        {posterUrl(a, "small") && <Image src={posterUrl(a, "small")!} alt="" fill sizes="56px" className="object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-semibold">{a.title}</p>
                        <p className="text-xs text-accent-2">{estimated ? `Weekly on ${day}s · time not listed` : `${fmtDate(a.nextRelease, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" })} JST`}{!estimated && a.nextRelease && <LocalTime iso={a.nextRelease} />}</p>
                        <p className="text-xs text-muted">{a.rating ? `★ ${(a.rating / 10).toFixed(1)} · ` : ""}{a.userCount.toLocaleString()} fans{!estimated && a.nextRelease && <> · <Countdown iso={a.nextRelease} label="in" /></>}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No tracked premieres on {day}.</p>
            )}
          </section>
        );
      })}

      {tba.length > 0 && (
        <section className="mt-10">
          <h2 className="h-section mb-3">Also airing · no weekly slot</h2>
          <div className="flex flex-wrap gap-2">
            {tba.map((a) => (
              <Link key={a.id} href={animePath(a)} className="chip">{a.title}</Link>
            ))}
          </div>
        </section>
      )}

      <Faq
        items={[
          { q: "What time zone is the schedule in?", a: "All times are Japan Standard Time (JST, UTC+9), when episodes first broadcast. Simulcasts on Crunchyroll and other services usually go live within an hour or two after that." },
          { q: "What does “time not listed” mean?", a: "Kitsu has not recorded an exact broadcast time for that series yet, so it is placed on the weekday it premiered, which is when weekly TV anime normally continue to air." },
          { q: "Why is a show I follow missing?", a: "The schedule covers the most-followed currently airing series, including this season’s lineup. Use search to open any other title and see its next episode date on its own page." },
          { q: "How often is this page updated?", a: "Every 30 minutes, pulling next-episode data from Kitsu." },
        ]}
      />
    </div>
  );
}
