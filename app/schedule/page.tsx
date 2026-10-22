import type { Metadata } from "next";
import { listAnime, Anime, posterUrl, fmtDate, weekdayOf, uniqueById, seasonOf } from "@/lib/kitsu";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import ScheduleBoard, { BoardDay, BoardItem } from "@/components/ScheduleBoard";
import BarChart from "@/components/viz/BarChart";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: "Anime Schedule This Week – Daily Airing Calendar (JST)",
  description: "Weekly anime release schedule: which anime air today and every day this week, with exact JST times, your local time, countdowns and streaming links. Updated every 30 minutes.",
  alternates: { canonical: "/schedule" },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function toItem(a: Anime, estimated: boolean): BoardItem {
  return { id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), rating: a.rating, userCount: a.userCount, nextRelease: a.nextRelease, estimated, status: a.status, jst: a.nextRelease ? fmtDate(a.nextRelease, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" }) : null };
}

export default async function SchedulePage() {
  const { season, year } = seasonOf();
  const pages = await Promise.all([
    ...[0, 20, 40].map((offset) => listAnime({ filter: { status: "current", season, seasonYear: String(year) }, sort: "-userCount", limit: 20, offset, revalidate: 1800 })),
    ...[0, 20].map((offset) => listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 20, offset, revalidate: 1800 })),
  ]);
  const all = uniqueById(pages.flatMap((p) => p.items));
  const byDay = new Map<string, BoardItem[]>(DAYS.map((d) => [d, []]));
  const tba: BoardItem[] = [];
  for (const a of all) {
    const exact = weekdayOf(a.nextRelease);
    // Weekly TV series keep their premiere weekday, so fall back to it when Kitsu has no next-episode timestamp.
    const est = !exact && a.subtype === "TV" && a.startDate ? weekdayOf(`${a.startDate}T12:00:00+09:00`) : null;
    const d = exact || est;
    if (d && byDay.has(d)) byDay.get(d)!.push(toItem(a, !exact));
    else tba.push(toItem(a, true));
  }
  const todayJst = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Tokyo" });
  const order = [...DAYS.slice(DAYS.indexOf(todayJst)), ...DAYS.slice(0, DAYS.indexOf(todayJst))];
  const days: BoardDay[] = order.map((day) => ({
    day,
    items: (byDay.get(day) || []).sort((x, y) => Number(x.estimated) - Number(y.estimated) || (x.nextRelease || "").localeCompare(y.nextRelease || "") || y.userCount - x.userCount),
  }));

  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/schedule", label: "Schedule" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight">Anime airing this week</h1>
      <p className="mt-2 max-w-2xl text-muted">Next-episode times for the {all.length} most-followed series currently airing, grouped by day in Japan Standard Time, with your local time alongside. Today is {todayJst} in Tokyo. Save shows to your list to filter the week down to what you watch.</p>
      <div className="mt-5">
        <BarChart
          title="Episodes this week"
          subtitle={`Followed series airing each day (JST), starting today · ${days.reduce((n, d) => n + d.items.length, 0)} in total`}
          valueHeading="Series"
          integer
          height={120}
          highlightKey={todayJst}
          labelKeys={[todayJst, days.reduce((x, y) => (y.items.length > x.items.length ? y : x)).day]}
          data={days.map((d) => ({ key: d.day, label: d.day === todayJst ? "Today" : d.day.slice(0, 3), value: d.items.length, display: `${d.items.length} series` }))}
        />
      </div>
      <AdSlot slot="schedule-top" />
      <ScheduleBoard days={days} today={todayJst} tba={tba} />
      <Faq
        items={[
          { q: "What time zone is the schedule in?", a: "All times are Japan Standard Time (JST, UTC+9), when episodes first broadcast, with the equivalent in your own time zone next to it. Simulcasts on Crunchyroll and other services usually go live within an hour or two after that." },
          { q: "What does “time not listed” mean?", a: "Kitsu has not recorded an exact broadcast time for that series yet, so it is placed on the weekday it premiered, which is when weekly TV anime normally continue to air." },
          { q: "How do I see only my shows?", a: "Press “+ My list” on any series, then tick “Only my list” at the top of this page. The list is stored in your browser; no account is needed." },
          { q: "How often is this page updated?", a: "Every 30 minutes, pulling next-episode data from Kitsu." },
        ]}
      />
    </div>
  );
}
