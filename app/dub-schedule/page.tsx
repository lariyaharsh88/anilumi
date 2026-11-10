import type { Metadata } from "next";
import MadeBy from "@/components/MadeBy";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { itemList } from "@/lib/ld";
import { fitTitle } from "@/lib/titles";
import { animePath } from "@/lib/kitsu";
import { DUBS_CHECKED, DUBS_SEASON, LANG_NAME, dubShows, dubWhen, dubsDate, dueWithin, nextDub, releasedBy, type DubShow } from "@/lib/dubschedule";
import { safeUrl } from "@/lib/streams";

// Next-episode dates move every day; an hourly refresh keeps "this week" honest.
export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const shows = dubShows();
  const en = shows.filter((e) => e.lang === "en" && e.status !== "announced").length;
  const hi = shows.filter((e) => e.lang === "hi").length;
  return {
    title: fitTitle([`Anime Dub Schedule ${DUBS_SEASON}: ${en} English Dubs, ${hi} Hindi`, `Anime Dub Schedule ${DUBS_SEASON}: English & Hindi`, `Anime Dub Schedule (${DUBS_SEASON})`]),
    description: `When the next dubbed episode of every ${DUBS_SEASON} anime releases: ${en} English dubs on Crunchyroll, HIDIVE and Netflix, plus ${hi} Hindi dubs in India, with weekday and episode count. Checked ${dubsDate()}.`,
    alternates: { canonical: "/dub-schedule" },
  };
}

const showHref = (e: DubShow) => (e.slug ? animePath({ slug: e.slug }) : null);
const Title = ({ e }: { e: DubShow }) => { const h = showHref(e); return h ? <Link href={h} className="font-semibold text-ink hover:text-violet-2">{e.t}</Link> : <span className="font-semibold text-ink">{e.t}</span>; };
const progress = (e: DubShow, now: number) => { const n = releasedBy(e, now); return n === null ? "—" : e.episodes ? `${n} / ${e.episodes}` : `${n} out`; };

function Table({ rows, now, caption }: { rows: DubShow[]; now: number; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-xs uppercase tracking-wide text-muted">
          <tr><th className="py-2 pr-3">Anime</th><th className="py-2 pr-3">Service</th><th className="py-2 pr-3">New episodes</th><th className="py-2 pr-3">Dubbed so far</th><th className="py-2">Next</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((e) => {
            const n = nextDub(e, now);
            const url = safeUrl(e.url);
            return (
              <tr key={`${e.t}-${e.lang}-${e.service}`} className="align-top">
                <td className="py-2.5 pr-3"><Title e={e} />{e.note && <span className="block text-xs text-muted">{e.note}</span>}</td>
                <td className="py-2.5 pr-3">{url ? <a href={url} target="_blank" rel="noopener nofollow" className="text-ink/90 hover:text-violet-2 hover:underline">{e.service} ↗</a> : e.service}<span className="block text-xs text-muted">{e.region}</span></td>
                <td className="py-2.5 pr-3">{e.weekday ? `${e.weekday}s` : e.status === "complete" ? "Finished" : "All at once"}{e.delay && <span className="block text-xs text-muted">{e.delay}</span>}</td>
                <td className="py-2.5 pr-3 tabular-nums">{progress(e, now)}</td>
                <td className="py-2.5 tabular-nums">{n ? <>Ep {n.episode} · {dubWhen(n.at, n.timed)}</> : e.status === "complete" ? "Complete" : "—"}{e.confidence === "medium" && <span className="block text-[11px] text-muted">one source</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** English and Hindi dubs this season: what's due this week, what's airing, what's announced. */
export default function DubSchedule() {
  const now = Date.now();
  const shows = dubShows();
  const due = dueWithin(now, 7);
  const enAiring = shows.filter((e) => e.lang === "en" && e.status !== "announced");
  const hi = shows.filter((e) => e.lang === "hi");
  const announced = shows.filter((e) => e.lang !== "hi" && e.status === "announced");
  const services = [...new Set(enAiring.map((e) => e.service))];
  const faq = [
    { q: `Which anime are getting an English dub in ${DUBS_SEASON}?`, a: enAiring.length ? `${enAiring.length} shows on our list, including ${enAiring.slice(0, 8).map((e) => e.t).join(", ")}. The table above has the service and the weekday for each.` : "We are still checking this season's dubs." },
    { q: "When do new dubbed episodes come out?", a: "Most simuldubs release one new episode a week on the same weekday, usually two to four weeks behind the Japanese broadcast. Netflix and some others release a whole season's dub at once. Times are shown in UTC where the service gives one." },
    { q: "Which anime have a new Hindi dub?", a: hi.length ? `${hi.map((e) => `${e.t} (${e.service})`).slice(0, 8).join(", ")}. See the Hindi section above, or the full Hindi dub list.` : "See the full Hindi dub list for every anime with Hindi audio." },
    { q: "How was this checked?", a: `From the services' own announcements (Crunchyroll News, HIDIVE, Netflix) and anime news on ${dubsDate()}. Episode counts after the premiere are worked out from the weekly day; delays and breaks are noted when announced.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList(`Anime dub schedule, ${DUBS_SEASON}`, shows.filter((e) => e.slug).map((e) => ({ url: animePath({ slug: e.slug! }), name: `${e.t} (${LANG_NAME[e.lang] ?? e.lang} dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/schedule", label: "Schedule" }, { href: "/dub-schedule", label: "Dub schedule" }]}
        eyebrow="🎙 Dub schedule"
        title={<>Anime dub schedule: <span className="text-gradient">{DUBS_SEASON}</span></>}
        subtitle="When the next English or Hindi dubbed episode of each anime this season comes out, on which service and how many are dubbed so far."
        facts={[
          { value: String(enAiring.length), label: "English dubs" },
          { value: String(hi.length), label: "Hindi dubs" },
          { value: String(due.length), label: "due this week" },
        ]}
        hue={280}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <a href="#week" className="chip">This week</a>
          <a href="#english" className="chip">English dubs</a>
          <a href="#hindi" className="chip">Hindi dubs</a>
          {announced.length > 0 && <a href="#announced" className="chip">Announced</a>}
          <Link href="/schedule" className="chip">Japanese broadcast schedule</Link>
          <Link href="/where-to-watch" className="chip">Where to watch</Link>
        </p>
      </PageHero>
      <MadeBy className="mt-4" method="Each dub is taken from the service's own announcement or Indian and US anime news, two sources where possible; next-episode dates are worked out from the weekly release day." date={DUBS_CHECKED} />

      <section id="week" className="reveal mt-10 scroll-mt-24" aria-labelledby="week-h">
        <h2 id="week-h" className="h-section mb-1">Dubbed episodes in the next 7 days</h2>
        <p className="mb-4 text-sm text-muted">Times in UTC where the service gives one; otherwise the release day.</p>
        {due.length ? (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {due.map(({ e, episode, at, timed }) => (
              <li key={`${e.t}-${e.lang}-${e.service}`} className="card p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-2">{dubWhen(at, timed)}</p>
                <p className="mt-1"><Title e={e} /></p>
                <p className="text-sm text-muted">Episode {episode} · {LANG_NAME[e.lang] ?? e.lang} dub · {e.service}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No weekly dub episodes on our list are due in the next 7 days.</p>}
      </section>

      <section id="english" className="reveal mt-12 scroll-mt-24" aria-labelledby="en-h">
        <h2 id="en-h" className="h-section mb-1">English dubs this season</h2>
        <p className="mb-4 text-sm text-muted">{enAiring.length} shows on {services.join(", ") || "the services we track"}. Checked {dubsDate()}.</p>
        {enAiring.length ? <Table rows={enAiring} now={now} caption="English dubs this season" /> : <p className="text-sm text-muted">Coming soon.</p>}
      </section>

      <section id="hindi" className="reveal mt-12 scroll-mt-24" aria-labelledby="hi-h">
        <h2 id="hi-h" className="h-section mb-1">🇮🇳 Hindi dubs: new and upcoming</h2>
        <p className="mb-4 text-sm text-muted">New Hindi dubs released or announced around this season. For every anime you can already watch in Hindi, see the <Link href="/hindi-dub" className="text-violet hover:underline">Hindi dubbed anime list</Link>.</p>
        {hi.length ? <Table rows={hi} now={now} caption="Hindi dubs" /> : <p className="text-sm text-muted">No new Hindi dub announcements on our list yet.</p>}
      </section>

      {announced.length > 0 && (
        <section id="announced" className="reveal mt-12 scroll-mt-24" aria-labelledby="ann-h">
          <h2 id="ann-h" className="h-section mb-4">Dubs announced, not started yet</h2>
          <Table rows={announced} now={now} caption="Announced dubs" />
        </section>
      )}

      <Faq title="Anime dub schedule FAQ" items={faq} />
    </div>
  );
}
