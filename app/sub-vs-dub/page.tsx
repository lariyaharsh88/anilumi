import type { Metadata } from "next";
import Link from "@/components/Link";
import MadeBy from "@/components/MadeBy";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import SectionNav from "@/components/fx/SectionNav";
import BarChart from "@/components/viz/BarChart";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import AnswerLead from "@/components/AnswerLead";
import { STREAMS_CHECKED, REGION_SHORT, streamsDate, streamsPath, type Region } from "@/lib/streams";
import { DUBS_SEASON, premiereAt, dubsDate } from "@/lib/dubschedule";
import { dubRows, dubsByService, dubsPerSeason, seasonEnglishDubs } from "@/lib/subdub";

export const revalidate = 86400;

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const fmtDay = (ms: number) => (Number.isFinite(ms) ? new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "date to be announced");
const pct = (a: number, b: number) => Math.round((a / Math.max(1, b)) * 100);

function data() {
  const rows = dubRows();
  const dubbed = rows.filter((r) => r.english), subOnly = rows.filter((r) => !r.english);
  const seasons = dubsPerSeason();
  const recent = seasons.slice(-3);
  const recentDubs = recent.reduce((n, s) => n + s.dubs, 0), recentSimul = recent.reduce((n, s) => n + s.simuldubs, 0);
  return { rows, dubbed, subOnly, now: seasonEnglishDubs(), services: dubsByService(rows, "US"), seasons, recent, recentDubs, recentSimul };
}

export function generateMetadata(): Metadata {
  const { rows, dubbed, now } = data();
  // "sub dub anime" (Bing, Nov 2026): people want to know which shows are dubbed, so the counts lead.
  return {
    title: fitTitle([`Sub vs Dub Anime: ${dubbed.length} of ${rows.length} Popular Anime Are Dubbed (${DUBS_SEASON})`, `Sub vs Dub Anime: Which Anime Are Dubbed? (${DUBS_SEASON})`, "Sub vs Dub Anime: Which Anime Are Dubbed?"]),
    description: fitDescription(`Sub or dub? ${dubbed.length} of the ${rows.length} most-watched anime have an English dub, and ${now.length} ${DUBS_SEASON} shows are being dubbed. Where each dub streams in the US, India and the UK, and which anime are sub only.`),
    alternates: { canonical: "/sub-vs-dub" },
  };
}

/** Sub or dub: what each means, which popular anime are dubbed and where, this season's dubs and the trend. */
export default function SubVsDub() {
  const { rows, dubbed, subOnly, now, services, seasons, recent, recentDubs, recentSimul } = data();
  const hindi = rows.filter((r) => r.hindi).length;
  const where = (en: Partial<Record<Region, string[]>>) => (["US", "IN", "GB"] as Region[]).filter((r) => en[r]?.length).map((r) => `${REGION_SHORT[r]}: ${en[r]!.join(", ")}`);
  const top = services[0];
  const faq = [
    // "sub dub anime" (3.8K Bing impressions in 3 months, rising, Nov 2026) is partly people looking for an unlicensed
    // site of that name; the page answers that and points to the legal dubs.
    { q: "Is SubDub Anime legal?", a: `It isn't an official service: it streams anime without a licence, so AniLumi doesn't link to it. The ${dubbed.length} dubbed anime on this page each link to where the dub streams legally, and the Hindi dubs (${hindi}) are on the Hindi dub list, many of them free.` },
    { q: "What's the difference between sub and dub?", a: "Sub (subbed) is the original Japanese audio with subtitles in your language; dub (dubbed) replaces the voices with actors speaking English, Hindi or another language. The story, animation and episodes are the same." },
    { q: "Is sub or dub better?", a: "Neither is better for everyone. Sub keeps the original performances and arrives first; dub lets you watch without reading, which suits action-heavy scenes, kids and second-screen viewing. Many fans watch comedies and action dubbed and dialogue-heavy dramas subbed. The best dub is the one you'll actually finish." },
    { q: "Which anime are dubbed in English?", a: `${dubbed.length} of the ${rows.length} most-watched anime on AniLumi have an English dub, including ${dubbed.slice(0, 8).map((r) => r.t).join(", ")}. The table above shows where each dub streams.` },
    ...(subOnly.length ? [{ q: "Which popular anime are sub only?", a: `${subOnly.map((r) => r.t).join(", ")}: no English dub streams legally in the US, India or the UK as of ${streamsDate()}.` }] : []),
    ...(top ? [{ q: "Which streaming service has the most English dubs?", a: `In the US, ${top.service} carries the English dub of ${top.count} of these ${rows.length} anime, followed by ${services.slice(1, 3).map((s) => `${s.service} (${s.count})`).join(" and ")}.` }] : []),
    ...(recentDubs ? [{ q: "How long after the sub does the dub come out?", a: `Usually the same week now: ${recentSimul} of the ${recentDubs} English dubs in ${recent.map((s) => `${cap(s.season)} ${s.year}`).join(", ")} were simuldubs, released alongside or within days of the Japanese episode. Others follow weeks or months later; the dub schedule lists each one.` }] : []),
    { q: "Can I watch anime dubbed in Hindi?", a: `Yes: ${hindi} of these anime also have an official Hindi dub, mostly on Crunchyroll, Netflix, Prime Video and free YouTube channels. See the Hindi dubbed anime list.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Popular anime with an English dub", dubbed.map((r) => ({ url: streamsPath(r.s), name: `${r.t} (English dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/sub-vs-dub", label: "Sub vs dub" }]}
        eyebrow="🎙️ Sub or dub"
        title={<>Sub vs dub: which anime are <span className="text-gradient">dubbed</span>?</>}
        subtitle="What sub and dub mean, which popular anime have an English dub and where it streams, and which are still sub only."
        facts={[
          { value: `${dubbed.length}/${rows.length}`, label: "popular anime dubbed" },
          { value: String(now.length), label: `${DUBS_SEASON} English dubs` },
          ...(recentDubs ? [{ value: `${pct(recentSimul, recentDubs)}%`, label: "dubbed the same week" }] : []),
          { value: String(subOnly.length), label: "sub only" },
        ]}
        hue={200}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/dub-schedule" className="chip">Dub schedule</Link>
          <Link href="/where-to-watch" className="chip">Where to watch</Link>
          <Link href="/hindi-dub" className="chip">Hindi dubbed anime</Link>
        </p>
      </PageHero>

      <AnswerLead checked={dubsDate()}>
        Sub means the original Japanese audio with subtitles; dub means the voices are replaced in another language. {dubbed.length} of the {rows.length} most-watched anime have an English dub{hindi ? ` and ${hindi} have an official Hindi dub` : ""}, and {now.length} {DUBS_SEASON} shows are being dubbed, {recentDubs ? `most of them (${pct(recentSimul, recentDubs)}%) within a week of Japan` : "some within days of Japan"}. Looking for the site called SubDub Anime? It isn&apos;t an official service; every dub below links to where it streams legally.
      </AnswerLead>

      <SectionNav sections={[
        { id: "difference", label: "Sub or dub?" },
        ...(now.length ? [{ id: "season", label: DUBS_SEASON }] : []),
        { id: "list", label: `All ${rows.length}` },
        ...(subOnly.length ? [{ id: "sub-only", label: "Sub only" }] : []),
        { id: "numbers", label: "In numbers" },
        { id: "faq", label: "FAQ" },
      ]} />

      <section id="difference" data-section className="reveal pt-10" aria-labelledby="difference-h">
        <h2 id="difference-h" className="h-section mb-3">Sub or dub: what&apos;s the difference?</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="card p-4">
            <h3 className="font-semibold text-ink">Sub (subtitled)</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink/90">
              <li>The original Japanese voices, with subtitles.</li>
              <li>Out first: new episodes stream within hours of Japan.</li>
              <li>Almost every anime streams subtitled, including the ones nobody dubs.</li>
            </ul>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold text-ink">Dub (dubbed)</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink/90">
              <li>Voices re-recorded in English (or Hindi, Tamil, Spanish and more).</li>
              <li>Watch without reading: easier for fast action, kids and watching while doing something else.</li>
              <li>{recentDubs ? `Mostly the same week now (${pct(recentSimul, recentDubs)}% of recent English dubs)` : "Often weeks behind the sub"}, but not every show gets one.</li>
            </ul>
          </div>
        </div>
      </section>

      {now.length > 0 && (
        <section id="season" data-section className="reveal pt-10" aria-labelledby="season-h">
          <h2 id="season-h" className="h-section mb-1">{DUBS_SEASON} anime with an English dub</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">{now.length} shows from this season are being dubbed. Day-by-day episodes are on the <Link href="/dub-schedule" className="text-violet hover:underline">dub schedule</Link>.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">{DUBS_SEASON} English dubs</caption>
              <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-2 pr-3">Anime</th><th className="py-2 pr-3">Dub on</th><th className="py-2">Dub started</th></tr></thead>
              <tbody className="divide-y divide-line">
                {now.map((e) => (
                  <tr key={`${e.t}-${e.service}`} className="align-top">
                    <td className="py-2.5 pr-3">{e.slug ? <Link href={`/anime/${e.slug}`} className="font-semibold text-ink hover:text-violet-2">{e.t}</Link> : <span className="font-semibold text-ink">{e.t}</span>}</td>
                    <td className="py-2.5 pr-3">{e.service}<span className="block text-xs text-muted">{e.region}</span></td>
                    <td className="py-2.5">{e.status === "announced" ? `Announced: ${fmtDay(premiereAt(e))}` : fmtDay(premiereAt(e))}{e.delay && <span className="block text-xs text-muted">{e.delay}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section id="list" data-section className="reveal pt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">Popular anime: dubbed or sub only?</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">The {rows.length} most-watched franchises, with where the English dub streams in the US, India and the UK. Each title links to its full where-to-watch page.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">English dub availability for popular anime</caption>
            <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-2 pr-3">Anime</th><th className="py-2 pr-3">English dub</th><th className="py-2">Hindi dub</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.s} className="align-top">
                  <td className="py-2.5 pr-3"><Link href={streamsPath(r.s)} className="font-semibold text-ink hover:text-violet-2">{r.t}</Link></td>
                  <td className="py-2.5 pr-3">{r.english ? <>✓ Dubbed{where(r.en).map((w) => <span key={w} className="block text-xs text-muted">{w}</span>)}</> : <span className="text-muted">Sub only</span>}</td>
                  <td className="py-2.5">{r.hindi ? "✓" : <span className="text-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <MadeBy className="mt-4" method="Each service's audio languages are checked on its own title page and JustWatch's country pages, two sources where possible; this season's dubs come from the services' announcements." date={STREAMS_CHECKED} />
      </section>

      {subOnly.length > 0 && (
        <section id="sub-only" data-section className="reveal pt-10" aria-labelledby="sub-only-h">
          <h2 id="sub-only-h" className="h-section mb-1">Popular anime with no English dub</h2>
          <p className="mb-3 max-w-3xl text-sm text-muted">These stream subtitled only in the US, India and the UK. If a dub is announced, it shows up on the dub schedule.</p>
          <ul className="flex flex-wrap gap-2">
            {subOnly.map((r) => <li key={r.s}><Link href={streamsPath(r.s)} className="chip">{r.t}</Link></li>)}
          </ul>
        </section>
      )}

      <section id="numbers" data-section className="reveal pt-10" aria-labelledby="numbers-h">
        <h2 id="numbers-h" className="h-section mb-4">Dubs in numbers</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {services.length > 0 && <BarChart orientation="bar" integer title="Which service has the most English dubs? (US)" subtitle={`Of the ${rows.length} popular anime, how many each service streams dubbed`} valueHeading="Anime"
            data={services.slice(0, 8).map((s) => ({ key: s.service, label: s.service, value: s.count, display: `${s.count} anime` }))} labelKeys={services.slice(0, 3).map((s) => s.service)} highlightKey={top?.service} />}
          {seasons.length > 0 && <BarChart integer title="English dubs per season" subtitle="Shows from each season that got an English dub" valueHeading="Dubs"
            data={seasons.map((s) => ({ key: `${s.year}-${s.season}`, label: `${cap(s.season).slice(0, 3)} ${String(s.year).slice(2)}`, value: s.dubs, display: `${s.dubs} dubs, ${s.simuldubs} the same week`, href: `/season/${s.year}/${s.season}` }))} />}
        </div>
      </section>

      <div id="faq" data-section className="pt-2"><Faq title="Sub vs dub FAQ" items={faq} /></div>
    </div>
  );
}
