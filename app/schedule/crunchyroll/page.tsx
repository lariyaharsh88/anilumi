import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { animePath, seasonOf, shiftSeason } from "@/lib/kitsu";
import { airing } from "@/lib/airing";
import { seasonStreaming } from "@/lib/seasonstreams";
import { dueWithin } from "@/lib/dubschedule";
import { pricesFor, startingAt } from "@/lib/platformprices";

// Like /schedule: episode times move, so the week is rebuilt every 30 minutes.
export const revalidate = 1800;

const IST = "Asia/Kolkata";
const DAY = 86_400_000;
const LANG: Record<string, string> = { en: "English dub", hi: "Hindi dub", ta: "Tamil dub", te: "Telugu dub" };
const dayKey = (at: number) => new Date(at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: IST });
const time = (at: number, timeZone = IST) => new Date(at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone });
const shortDate = (at: number) => new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: IST });

type Row = { title: string; href: string | null; episode: number; at: number; kind: string; timed: boolean };

/**
 * Crunchyroll's week (Google India, Nov 2026: "crunchyroll anime schedule" 480, "crunchyroll release schedule" and
 * "release calendar" 260 each a month). Subbed episodes: shows AniList lists on Crunchyroll this season or last, at
 * their Japanese broadcast time from the airing snapshot (no extra calls). Dubbed episodes: Crunchyroll's own dub
 * announcements (data/dub-schedule.json).
 */
async function week(now = Date.now()) {
  const s = seasonOf();
  const prev = shiftSeason(s.season, s.year, -1);
  const [snap, cur, last] = await Promise.all([airing(), seasonStreaming(s.year, s.season).catch(() => null), seasonStreaming(prev.year, prev.season).catch(() => null)]);
  const onCr = new Set([cur, last].flatMap((x) => x?.services.find((v) => /^crunchyroll$/i.test(v.site))?.ids ?? []));
  const subs: Row[] = snap.shows
    .filter((x) => onCr.has(x.a))
    .flatMap((x) => x.n.filter(([, t]) => t * 1000 > now - DAY / 4 && t * 1000 < now + 7 * DAY).map(([ep, t]) => ({ title: x.t, href: x.s ? animePath({ slug: x.s }) : null, episode: ep, at: t * 1000, kind: "Subtitled", timed: true })));
  const dubs: Row[] = dueWithin(now, 7)
    .filter((x) => /crunchyroll/i.test(x.e.service) && LANG[x.e.lang])
    .map((x) => ({ title: x.e.t, href: x.e.slug ? animePath({ slug: x.e.slug }) : null, episode: x.episode, at: x.at, kind: LANG[x.e.lang], timed: x.timed }));
  const all = [...subs, ...dubs].sort((a, b) => a.at - b.at);
  const days = new Map<string, Row[]>();
  for (const r of all) days.set(dayKey(r.at), [...(days.get(dayKey(r.at)) ?? []), r]);
  const shows = new Set(subs.map((r) => r.title)).size;
  const hindi = dubs.filter((r) => r.kind === "Hindi dub").length;
  return { all, subs, dubs, days, shows, hindi, from: now, to: now + 6 * DAY };
}

export async function generateMetadata(): Promise<Metadata> {
  const w = await week();
  return {
    title: fitTitle([`Crunchyroll Anime Schedule This Week (IST): ${w.all.length} New Episodes`, `Crunchyroll Release Schedule This Week: ${w.all.length} Episodes`, "Crunchyroll Anime Schedule This Week (IST)"]),
    description: fitDescription(`Every Crunchyroll anime episode in the next 7 days (${shortDate(w.from)}–${shortDate(w.to)}), day by day with times in IST: ${w.subs.length} subtitled episodes of ${w.shows} shows${w.dubs.length ? ` and ${w.dubs.length} dubbed, ${w.hindi} in Hindi` : ""}.`),
    alternates: { canonical: "/schedule/crunchyroll" },
  };
}

export default async function CrunchyrollSchedule() {
  const w = await week();
  const next = w.all.find((r) => r.at > Date.now());
  const price = pricesFor("crunchyroll");
  const faq: FaqItem[] = [
    { q: "What time do new episodes come out on Crunchyroll in India?", a: "Subtitled simulcasts usually go up within an hour or two of the Japanese broadcast, which this page shows in IST. Dubbed episodes follow Crunchyroll's own dub schedule, often weeks behind the subtitled version." },
    ...(w.hindi ? [{ q: "Which Hindi dubbed episodes are on Crunchyroll this week?", a: `${[...new Set(w.dubs.filter((r) => r.kind === "Hindi dub").map((r) => r.title))].join(", ")}. See the full Hindi dub schedule for every platform.` }] : []),
    { q: "Is this the official Crunchyroll calendar?", a: "No. AniLumi builds it from the Japanese broadcast times AniList tracks and from Crunchyroll's dub announcements. Crunchyroll sometimes delays an episode, so check the app if one is missing." },
    ...(price ? [{ q: "How much does Crunchyroll cost in India?", a: `${startingAt(price)}. Every plan includes the simulcasts and dubs on this page; see all Crunchyroll plans and prices in India.` }] : []),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Crunchyroll anime this week", [...new Map(w.all.filter((r) => r.href).map((r) => [r.href, r])).values()].map((r) => ({ url: r.href!, name: r.title })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/schedule", label: "Schedule" }, { href: "/schedule/crunchyroll", label: "Crunchyroll" }]}
        eyebrow="📅 Crunchyroll schedule"
        title={<>Crunchyroll anime schedule <span className="text-gradient">this week</span></>}
        subtitle={`Every new episode on Crunchyroll in the next 7 days (${shortDate(w.from)}–${shortDate(w.to)}), subtitled and dubbed, with the time in IST.`}
        facts={[
          { value: String(w.all.length), label: "episodes this week" },
          { value: String(w.shows), label: "simulcast shows" },
          ...(w.dubs.length ? [{ value: String(w.dubs.length), label: `dubbed (${w.hindi} Hindi)` }] : []),
        ]}
        hue={25}
      />

      <section className="reveal mt-10" aria-labelledby="days-h">
        <h2 id="days-h" className="h-section mb-1">Day by day</h2>
        <p className="mb-4 text-sm text-muted">Subtitled episodes at their Japanese broadcast time, in IST; Crunchyroll usually posts them within an hour or two.{next ? ` Next up: ${next.title}, episode ${next.episode}, ${next.timed ? `${time(next.at)} IST` : shortDate(next.at)}.` : ""}</p>
        {w.all.length ? (
          <div className="space-y-5">
            {[...w.days].map(([day, list]) => (
              <div key={day}>
                <h3 className="mb-2 font-semibold text-ink">{day}</h3>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((r) => (
                    <li key={`${r.title}-${r.kind}-${r.episode}`} className="card p-3 text-sm">
                      <p className="font-semibold text-ink">{r.href ? <Link href={r.href} className="hover:text-violet-2">{r.title}</Link> : r.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Episode {r.episode} · {r.timed ? `${time(r.at)} IST` : "time not given"} · {r.kind}
                        {r.kind === "Hindi dub" && <span className="ml-1 rounded-full bg-amber-400/15 px-1.5 text-[10px] font-semibold text-amber-200">HINDI</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : <p className="card p-4 text-sm text-muted">No Crunchyroll episodes found for the next 7 days.</p>}
      </section>

      <p className="mt-8 flex flex-wrap gap-2 text-sm">
        <Link href="/schedule" className="chip">Every anime airing this week</Link>
        <Link href="/hindi-dub/this-week" className="chip">🇮🇳 Hindi dub schedule</Link>
        <Link href="/hindi-dub/crunchyroll" className="chip">Hindi dubs on Crunchyroll</Link>
        <Link href="/crunchyroll-price-india" className="chip">Crunchyroll price in India</Link>
      </p>
      <p className="mt-4 text-xs text-muted">Built from AniList&rsquo;s broadcast times and Crunchyroll&rsquo;s dub announcements; which shows are on Crunchyroll comes from AniList&rsquo;s streaming links for this season and last. <Link href="/how-we-check" className="underline">How we check</Link></p>

      <Faq title="Crunchyroll schedule: FAQ" items={faq} />
    </div>
  );
}
