import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import LeadForm from "@/components/LeadForm";
import { dbEnabled } from "@/lib/db";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { hindiComing } from "@/lib/hindistats";
import { premiereAt } from "@/lib/dubschedule";
import { dubEvents, dubWeeks, type DubEvent } from "@/lib/dubupdates";

export const revalidate = 86400;

const fmt = (date: string, o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
const weekLabel = (start: string) => `Week of ${fmt(start, { day: "numeric", month: "long", year: "numeric" })}`;
const FLAG: Record<DubEvent["lang"], string> = { Hindi: "border-orange-400/40 text-orange-200", Tamil: "border-rose-400/40 text-rose-200", Telugu: "border-amber-400/40 text-amber-200" };

/** "New Hindi dubbed anime" and the Tamil and Telugu equivalents, week by week (lib/dubupdates.ts). */
export function generateMetadata(): Metadata {
  const weeks = dubWeeks(dubEvents());
  const latest = weeks[0];
  const names = latest ? latest.events.slice(0, 3).map((e) => e.t) : [];
  return {
    title: fitTitle([`New Hindi, Tamil & Telugu Dubbed Anime: ${latest ? weekLabel(latest.start) : "This Week"}`, "New Hindi, Tamil & Telugu Dubbed Anime This Week", "New Hindi Dubbed Anime This Week"]),
    description: fitDescription(`What's new in Indian anime dubs, week by week: official Hindi, Tamil and Telugu dubs added to our lists and Hindi dubs that started streaming${names.length ? `, including ${names.join(", ")}` : ""}. Official platforms only.`),
    alternates: { canonical: "/new-dubs" },
  };
}

export default function NewDubs() {
  const weeks = dubWeeks(dubEvents());
  const coming = hindiComing().slice(0, 12);
  const all = weeks.flatMap((w) => w.events);
  const started30 = dubEvents().filter((e) => e.kind === "started" && Date.parse(`${e.date}T00:00:00Z`) > Date.now() - 30 * 86_400_000).length;
  const recentHindi = all.filter((e) => e.lang === "Hindi").slice(0, 8);
  const faq = [
    ...(recentHindi.length ? [{ q: "Which anime got a Hindi dub recently?", a: `${recentHindi.map((e) => `${e.t} (${e.where}, ${fmt(e.date)})`).join(", ")}.` }] : []),
    ...(coming.length ? [{ q: "Which Hindi dubs are coming soon?", a: coming.slice(0, 6).map((e) => `${e.t} on ${e.service}${Number.isFinite(premiereAt(e)) ? ` from ${fmt(new Date(premiereAt(e)).toISOString().slice(0, 10))}` : ""}`).join("; ") + "." }] : []),
    { q: "How is this list made?", a: "Every entry comes from our Hindi, Tamil and Telugu dub lists, which are checked against each platform's own title page, the licensors' announcements and Indian anime news; fan lists never count. An entry appears here in the week it was added to a list, or, for Hindi dubs with a release date, the week it started streaming." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("New Indian anime dubs", all.slice(0, 50).map((e) => ({ url: e.href, name: `${e.t} (${e.lang} dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Indian dubs" }, { href: "/new-dubs", label: "New dubs" }]}
        eyebrow="🇮🇳 New this week"
        title={<>New <span className="text-gradient">Hindi, Tamil &amp; Telugu</span> dubbed anime</>}
        subtitle="What changed on our Indian dub lists, week by week: new official dubs and Hindi dubs that started streaming. Official platforms only."
        facts={[
          { value: String(started30), label: "Hindi dubs started, last 30 days" },
          { value: String(coming.length), label: "Hindi dubs coming" },
          { value: "3", label: "languages tracked" },
        ]}
        hue={25}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/hindi-dub" className="chip">Hindi list</Link>
          <Link href="/tamil-dub" className="chip">Tamil list</Link>
          <Link href="/telugu-dub" className="chip">Telugu list</Link>
          <Link href="/dub-schedule#hindi" className="chip">Dub schedule</Link>
        </p>
      </PageHero>

      {dbEnabled() && <LeadForm className="mt-8" kind="hindi" source="new-dubs" title="🇮🇳 Get new Hindi dubs by email" blurb="One short email when an official Hindi dub is added, with where to watch it and whether it's free. Tamil and Telugu alerts are on their lists." />}

      {weeks.map((w, i) => (
        <section key={w.start} className="reveal pt-10" aria-labelledby={`w-${w.start}`}>
          <h2 id={`w-${w.start}`} className="h-section mb-3">{i === 0 ? "This week · " : ""}{weekLabel(w.start)}</h2>
          {w.bulk.length > 0 && (
            <ul className="mb-3 space-y-1 text-sm">
              {w.bulk.map((b) => <li key={b.lang}><span className={`mr-2 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${FLAG[b.lang]}`}>{b.lang}</span><Link href={b.href} className="text-violet hover:underline">{b.first ? `${b.lang} list started: ${b.count} official dubs listed` : `${b.count} more ${b.lang} dubs added to the list`}</Link></li>)}
            </ul>
          )}
          {w.events.length > 0 && (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {w.events.map((e) => (
                <li key={`${e.lang}-${e.kind}-${e.t}-${e.date}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3 text-sm">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${FLAG[e.lang]}`}>{e.lang}</span>
                  <Link href={e.href} className="font-semibold text-ink hover:text-violet-2">{e.t}</Link>
                  <span className="text-muted">{e.kind === "started" ? "started streaming on" : "added:"} {e.where}</span>
                  <span className="ml-auto text-xs text-muted">{fmt(e.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {coming.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="coming-h">
          <h2 id="coming-h" className="h-section mb-3">Hindi dubs coming soon</h2>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {coming.map((e) => (
              <li key={`${e.t}-${e.service}`} className="flex flex-wrap items-baseline gap-x-3 p-3 text-sm">
                {e.slug ? <Link href={`/anime/${e.slug}`} className="font-semibold text-ink hover:text-violet-2">{e.t}</Link> : <span className="font-semibold text-ink">{e.t}</span>}
                <span className="text-muted">{e.service}</span>
                <span className="ml-auto text-xs text-muted">{Number.isFinite(premiereAt(e)) ? fmt(new Date(premiereAt(e)).toISOString().slice(0, 10)) : "Date TBA"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Faq title="New dubs FAQ" items={faq} />
    </div>
  );
}
