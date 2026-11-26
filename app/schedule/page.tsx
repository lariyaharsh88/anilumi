import { fitDescription, fitTitle } from "@/lib/titles";
import Link from "@/components/Link";
import type { Metadata } from "next";
import { listAnime, Anime, posterUrl, fmtDate, weekdayOf, uniqueById, seasonOf, getWeekBroadcasts, aniListNextEpisodes, animePath } from "@/lib/kitsu";
import AiringHeatmap from "@/components/viz/AiringHeatmap";
import PageHero from "@/components/PageHero";
import { itemList } from "@/lib/ld";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import ScheduleBoard, { BoardDay, BoardItem } from "@/components/ScheduleBoard";
import BarChart from "@/components/viz/BarChart";
import AnswerLead from "@/components/AnswerLead";

export const revalidate = 1800;
export const metadata: Metadata = {
  // Bing, Nov 2026: "anime release schedule" (103 impressions at position 8, no clicks), "anime schedule", "weekly anime schedule".
  title: fitTitle(["Anime Release Schedule This Week: Daily Airing Calendar", "Anime Release Schedule This Week"]),
  description: fitDescription("The anime release schedule for this week: which anime air today and every day, with exact times in JST and your own time zone, countdowns and where to stream."),
  alternates: { canonical: "/schedule" },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function toItem(a: Anime, estimated: boolean, nextEp: number | null = null): BoardItem {
  return { nextEp, id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), rating: a.rating, userCount: a.userCount, nextRelease: a.nextRelease, estimated, status: a.status, jst: a.nextRelease ? fmtDate(a.nextRelease, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" }) : null };
}

export default async function SchedulePage() {
  const { season, year } = seasonOf();
  const pages = await Promise.all([
    ...[0, 20, 40].map((offset) => listAnime({ filter: { status: "current", season, seasonYear: String(year) }, sort: "-userCount", limit: 20, offset, revalidate: 1800 })),
    ...[0, 20].map((offset) => listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 20, offset, revalidate: 1800 })),
  ]);
  const all = uniqueById(pages.flatMap((p) => p.items));
  const [broadcasts, aniNext] = await Promise.all([getWeekBroadcasts(), aniListNextEpisodes(all.map((a) => a.id))]);
  // AniList tracks broadcast times more closely than Kitsu; shows whose next episode is > 14 days out are on a break.
  for (const a of all) { const t = aniNext.get(a.id); if (t) a.nextRelease = t.at; }
  const nextEp = (a: Anime) => aniNext.get(a.id)?.episode ?? null;
  const onBreak = all.filter((a) => a.nextRelease && new Date(a.nextRelease).getTime() - Date.now() > 14 * 86400000);
  const breakIds = new Set(onBreak.map((a) => a.id));
  const byDay = new Map<string, BoardItem[]>(DAYS.map((d) => [d, []]));
  const tba: BoardItem[] = [];
  for (const a of all) {
    if (breakIds.has(a.id)) continue;
    const exact = weekdayOf(a.nextRelease);
    // Weekly TV series keep their premiere weekday, so fall back to it when Kitsu has no next-episode timestamp.
    const est = !exact && a.subtype === "TV" && a.startDate ? weekdayOf(`${a.startDate}T12:00:00+09:00`) : null;
    const d = exact || est;
    if (d && byDay.has(d)) byDay.get(d)!.push(toItem(a, !exact, nextEp(a)));
    else tba.push(toItem(a, true, nextEp(a)));
  }
  const todayJst = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Tokyo" });
  const order = [...DAYS.slice(DAYS.indexOf(todayJst)), ...DAYS.slice(0, DAYS.indexOf(todayJst))];
  const days: BoardDay[] = order.map((day) => ({
    day,
    items: (byDay.get(day) || []).sort((x, y) => Number(x.estimated) - Number(y.estimated) || (x.nextRelease || "").localeCompare(y.nextRelease || "") || y.userCount - x.userCount),
  }));

  const weekTotal = days.reduce((n, d) => n + d.items.length, 0);
  const busiest = days.reduce((x, y) => (y.items.length > x.items.length ? y : x));
  const popular = (xs: BoardItem[], n: number) => [...xs].sort((x, y) => y.userCount - x.userCount).slice(0, n).map((x) => x.title);
  const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
  const checked = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Anime airing this week", days.flatMap((d) => d.items).map((x) => ({ url: animePath(x), name: x.title })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/schedule", label: "Schedule" }]}
        eyebrow={<><span className="live-dot mr-2 inline-block align-middle" aria-hidden />Live · {todayJst} in Tokyo</>}
        title={<>Anime release schedule: <span className="text-gradient">this week</span></>}
        subtitle={`Next-episode times for the ${all.length} most-followed series currently airing, grouped by day in Japan Standard Time, with your local time alongside. Save shows to your list to filter the week down to what you watch.`}
        facts={[
          { value: String(days.reduce((n, d) => n + d.items.length, 0)), label: "episodes this week" },
          { value: String(days[0].items.length), label: "airing today" },
          { value: days.reduce((x, y) => (y.items.length > x.items.length ? y : x)).day.slice(0, 3), label: "busiest day" },
        ]}
        hue={350}
        posters={days.flatMap((d) => d.items).sort((x, y) => y.userCount - x.userCount).slice(0, 3).map((x) => x.poster)}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/schedule/crunchyroll" className="chip">Crunchyroll schedule (IST)</Link>
          <Link href="/dub-schedule" className="chip">🎙 Dub schedule (English &amp; Hindi)</Link>
          <Link href="/where-to-watch" className="chip">Where to watch</Link>
          <Link href="/comic-con-india" className="chip">🎪 Comic Con India dates</Link>
        </p>
      </PageHero>
      {/* The quotable answer: Copilot cited this page for under 1% of "anime release schedule" answers (Bing, Nov 2026). */}
      <AnswerLead checked={checked}>
        Today ({todayJst} in Japan) {days[0].items.length} anime air{days[0].items.length ? `, including ${list(popular(days[0].items, 3))}` : ""}. This week {weekTotal} episodes of the most-followed airing series come out; {busiest.day} is the busiest day ({busiest.items.length}{busiest.day === days[0].day ? ", today" : ""}). Times are Japan time (JST), 3½ hours ahead of India; simulcasts usually go live within a couple of hours.
      </AnswerLead>
      <div className="reveal mt-8">
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
      {broadcasts.length > 0 && <div className="mt-3"><AiringHeatmap broadcasts={broadcasts} /></div>}
      <AdSlot slot="schedule-top" />
      <ScheduleBoard days={days} today={todayJst} tba={tba} />
      {onBreak.length > 0 && (
        <section className="mt-10" aria-labelledby="break-h">
          <h2 id="break-h" className="h-section mb-1">On a break</h2>
          <p className="mb-3 text-sm text-muted">Airing series with no new episode in the next two weeks, and when they return (Japan time, from AniList).</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {onBreak.sort((x, y) => (x.nextRelease || "").localeCompare(y.nextRelease || "")).map((a) => (
              <li key={a.id}>
                <Link href={`/anime/${encodeURIComponent(a.slug)}`} className="card flex items-center justify-between gap-3 p-3 text-sm transition hover:border-violet">
                  <span className="font-medium"><span aria-hidden className="mr-1.5">⏸</span>{a.title}</span>
                  <span className="shrink-0 text-xs text-muted">back {fmtDate(a.nextRelease, { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Tokyo" })}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Faq
        items={[
          { q: "Which anime come out each day this week?", a: days.map((d) => `${d.day}: ${d.items.length ? list(popular(d.items, 3)) + (d.items.length > 3 ? ` and ${d.items.length - 3} more` : "") : "none"}`).join(". ") + "." },
          { q: "What time do new anime episodes come out in India?", a: "Japan is 3½ hours ahead of India, so an episode that airs at 11:00 PM JST in Japan airs at 7:30 PM IST the same day; a slot just after midnight in Japan (1:00 AM Saturday JST) is 9:30 PM Friday in India. Crunchyroll usually posts the subtitled episode within an hour or two of the broadcast. See the Crunchyroll schedule in IST for exact times." },
          { q: "What time zone is the schedule in?", a: "All times are Japan Standard Time (JST, UTC+9), when episodes first broadcast, with the equivalent in your own time zone next to it. Simulcasts on Crunchyroll and other services usually go live within an hour or two after that." },
          { q: "What does “time not listed” mean?", a: "Kitsu has not recorded an exact broadcast time for that series yet, so it is placed on the weekday it premiered, which is when weekly TV anime normally continue to air." },
          { q: "How do I see only my shows?", a: "Press “+ My list” on any series, then tick “Only my list” at the top of this page. The list is stored in your browser; no account is needed." },
          { q: "How often is this page updated?", a: "Every 30 minutes, pulling next-episode data from Kitsu." },
        ]}
      />
    </div>
  );
}
