import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import MadeBy from "@/components/MadeBy";
import Faq, { type FaqItem } from "@/components/Faq";
import Countdown from "@/components/Countdown";
import SectionNav from "@/components/fx/SectionNav";
import { abs } from "@/lib/site";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { CC_CHECKED, CC_COSPLAY, CC_ORGANIZER, CC_TICKETS, ccDates, ccEdition, ccFrom, ccLive, ccNext, ccOpens, ccPast, ccUpcoming, inr, type CcEdition } from "@/lib/comiccon";

// Half-hourly, so "on now" and the next edition roll over close to the day changing in India.
export const revalidate = 1800;

/**
 * Comic Con India for anime fans (Keyword Planner, India, Nov 2026: "comic con delhi" 9.9K a month, 60.5K in Dec
 * 2025; "comic con mumbai" 4.4K, 22K in May; "cosplay india" 1K). Results today are the official shop, ticket sites
 * and news with conflicting dates; this puts every announced edition in one place, checked against the official
 * ticket pages, with what's there for anime fans. Delhi leads while it's ahead (the biggest search).
 */
function featured(): CcEdition | null {
  const delhi = ccEdition("delhi");
  const up = ccUpcoming();
  return delhi && up.some((e) => e.slug === "delhi") ? delhi : up[0] ?? null;
}
const day = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export async function generateMetadata(): Promise<Metadata> {
  const f = featured();
  const up = ccUpcoming();
  const y = f ? f.start.slice(0, 4) : String(new Date().getFullYear());
  return {
    title: fitTitle(f
      ? [`Comic Con ${f.city} ${y}: Dates, Tickets & Anime Guide`, `Comic Con India ${y}: ${f.city} Dates, Tickets & Anime Guide`, `Comic Con ${f.city} ${y}: Dates & Tickets`]
      : ["Comic Con India: Dates, Tickets & Anime Guide"]),
    description: fitDescription(f
      ? `${f.name} is on ${ccDates(f)} at ${f.venue}, tickets from ${inr(ccFrom(f))}. All ${up.length} city dates, prices, anime and cosplay highlights.`
      : "Every Comic Con India edition with dates, venues, ticket prices, the anime and cosplay highlights for fans, and how to get there, checked against the official ticket pages."),
    alternates: { canonical: "/comic-con-india" },
  };
}

/** Event schema for an edition: only facts from the official ticket page. */
const eventLd = (e: CcEdition) => ({
  "@context": "https://schema.org", "@type": "Event", name: e.name,
  startDate: `${e.start}T11:00:00+05:30`, endDate: e.end,
  eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: { "@type": "Place", name: e.venue, address: { "@type": "PostalAddress", streetAddress: e.address, addressLocality: e.city, addressCountry: "IN" } },
  organizer: { "@type": "Organization", name: "Comic Con India", url: "https://www.comicconindia.com" },
  offers: e.tickets.map((t) => ({ "@type": "Offer", name: t.type, price: t.price, priceCurrency: "INR", url: e.buy[0]?.url, availability: "https://schema.org/InStock" })),
  url: abs(`/comic-con-india#${e.slug}`),
});

export default function ComicConIndia() {
  const up = ccUpcoming();
  const next = ccNext();
  const f = featured();
  const delhi = ccEdition("delhi");
  const past = ccPast();
  const faq: FaqItem[] = [
    ...(delhi ? [{ q: `When is Comic Con Delhi ${delhi.start.slice(0, 4)}?`, a: `${delhi.name} is on ${ccDates(delhi)} at ${delhi.venue}. Doors open at 11 am. Last year's edition ran ${past.find((p) => p.city === "Delhi") ? ccDates(past.find((p) => p.city === "Delhi")!) : "in early December"}.` }] : []),
    ...(delhi ? [{ q: `How much is a Comic Con Delhi ticket?`, a: `${delhi.tickets.map((t) => `${t.type}: ${inr(t.price)}`).join("; ")}. Buy on the official Comic Con India site; tickets are non-refundable and only valid for the date bought.` }] : []),
    ...(delhi?.metro ? [{ q: "Which metro station is nearest to Comic Con Delhi?", a: `${delhi.metro}. Parking is limited, so the organisers suggest public transport.` }] : []),
    { q: "Is there anime at Comic Con India?", a: "Yes. Crunchyroll runs a booth at several editions (Delhi, Navi Mumbai and Bengaluru sell a Crunchyroll Power Pass with an annual Fan subscription and no-wait booth access), every pass includes an exclusive manga, and anime cosplay is everywhere on the floor." },
    { q: "Is there a cosplay competition?", a: CC_COSPLAY.summary },
    { q: "Which cities have Comic Con India?", a: `Coming up: ${up.map((e) => `${e.city} (${ccDates(e)})`).join(", ")}.` },
    { q: "Can kids go to Comic Con?", a: "Yes, it's open to all ages. Children aged 3 and above need their own ticket." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", "/comic-con-india", "Comic Con India dates, tickets and anime guide")} />
      {up.map((e) => <JsonLd key={e.slug} data={eventLd(e)} />)}
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/comic-con-india", label: "Comic Con India" }]}
        eyebrow="🎪 Events"
        title={<>Comic Con India <span className="text-gradient">{f ? f.start.slice(0, 4) : ""}</span></>}
        subtitle={f ? `${f.name}: ${ccDates(f)} at ${f.venue}. Every edition's dates, ticket prices, what's there for anime fans and cosplayers, and how to get there.` : "Every Comic Con India edition, with dates, ticket prices and what's there for anime fans."}
        facts={[
          { value: String(up.length), label: up.length === 1 ? "edition coming up" : "editions coming up" },
          ...(f ? [{ value: inr(ccFrom(f)), label: `tickets from (${f.city})` }] : []),
          ...(next ? [{ value: next.city, label: ccLive(next) ? "on now" : "next up" }] : []),
        ]}
        hue={20}
      >
        {next && !ccLive(next) && <Countdown iso={ccOpens(next)} big label={`${next.city} opens in`} />}
        {next && ccLive(next) && <p className="text-lg font-bold text-accent-2">On now in {next.city} · {ccDates(next)}</p>}
      </PageHero>
      <MadeBy className="mt-4" date={CC_CHECKED} method={`Dates, venues and prices come from ${CC_ORGANIZER}'s official ticket pages, with news reports as a second source; prices can change, so check the official page before buying.`} />

      <SectionNav sections={[{ id: "dates", label: "All dates" }, ...up.slice(0, 4).map((e) => ({ id: e.slug, label: e.city })), { id: "anime", label: "For anime fans" }, { id: "faq", label: "FAQ" }]} />

      <section id="dates" data-section className="reveal pt-10" aria-labelledby="dates-h">
        <h2 id="dates-h" className="h-section mb-3">Comic Con India dates</h2>
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">City</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Venue</th><th className="px-4 py-3">Tickets from</th></tr></thead>
            <tbody>
              {up.map((e) => (
                <tr key={e.slug} className="border-t border-line/60">
                  <td className="px-4 py-3 font-semibold text-ink"><a href={`#${e.slug}`} className="hover:text-violet-2">{e.city}</a>{ccLive(e) && <span className="ml-2 rounded bg-accent-strong px-1.5 text-[10px] font-bold uppercase text-snow">Now</span>}</td>
                  <td className="px-4 py-3 text-ink/90">{ccDates(e)}</td>
                  <td className="px-4 py-3 text-muted">{e.venue}</td>
                  <td className="px-4 py-3 text-ink/90">{inr(ccFrom(e))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Checked {day(CC_CHECKED)} on the <a href={CC_TICKETS} target="_blank" rel="noopener nofollow" className="underline">official ticket site</a>. Day passes listed are for Day 1; Day 2 passes appear closer to each date.</p>
      </section>

      {up.map((e) => (
        <section key={e.slug} id={e.slug} data-section className="reveal scroll-mt-32 pt-10" aria-labelledby={`${e.slug}-h`}>
          <h2 id={`${e.slug}-h`} className="h-section mb-1">{e.name}</h2>
          <p className="mb-3 text-sm text-muted">{ccDates(e)} · {e.venue}{e.note ? ` · ${e.note}` : ""}</p>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Tickets</h3>
              <ul className="mt-2 divide-y divide-line/60 text-sm">
                {e.tickets.map((t) => <li key={t.type} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2"><span className="font-medium text-ink">{t.type}</span><span className="font-bold text-ink">{inr(t.price)}</span><span className="w-full text-xs text-muted">{t.note}</span></li>)}
              </ul>
              <p className="mt-3 flex flex-wrap gap-2">{e.buy.map((b) => <a key={b.url} href={b.url} target="_blank" rel="noopener nofollow" className="btn-outline text-sm">Buy on {b.name} →</a>)}</p>
            </div>
            <div className="card space-y-2 p-4 text-sm">
              <p><span className="text-muted">Where:</span> <span className="text-ink">{e.address}</span></p>
              {e.metro && <p><span className="text-muted">Metro:</span> <span className="text-ink">{e.metro}</span></p>}
              {e.timings && <p><span className="text-muted">Timings:</span> <span className="text-ink">{e.timings}</span></p>}
              {e.anime && e.anime.length > 0 && <div><p className="text-muted">For anime fans:</p><ul className="ml-4 list-disc text-ink/90">{e.anime.map((a) => <li key={a}>{a}</li>)}</ul></div>}
              {e.rules && e.rules.length > 0 && <details><summary className="cursor-pointer text-muted">Entry rules</summary><ul className="ml-4 mt-1 list-disc text-ink/85">{e.rules.map((r) => <li key={r}>{r}</li>)}</ul></details>}
              <p className="flex flex-wrap gap-x-3 pt-1 text-[11px] text-muted">{e.sources.slice(0, 3).map((u, i) => <a key={u} href={u} target="_blank" rel="noopener nofollow" className="underline">Source {i + 1}</a>)}</p>
            </div>
          </div>
        </section>
      ))}

      <section id="anime" data-section className="reveal pt-10" aria-labelledby="anime-h">
        <h2 id="anime-h" className="h-section mb-3">Comic Con for anime fans</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card p-4 text-sm">
            <h3 className="font-semibold text-ink">🍥 Anime and manga</h3>
            <p className="mt-1 text-ink/90">Crunchyroll has a booth at Delhi, Navi Mumbai and Bengaluru, where a Crunchyroll Power Pass adds an annual Fan subscription, no-wait booth access and a Crunchycoin. Every pass this season comes with an exclusive manga.</p>
            <p className="mt-2 text-muted">Planning what to watch after? <Link href="/hindi-dub" className="text-violet hover:underline">Anime in Hindi</Link> · <Link href="/schedule/crunchyroll" className="text-violet hover:underline">Crunchyroll schedule</Link></p>
          </div>
          <div className="card p-4 text-sm">
            <h3 className="font-semibold text-ink">🎭 Cosplay</h3>
            <p className="mt-1 text-ink/90">{CC_COSPLAY.summary}</p>
            <p className="mt-2 text-muted">Cosplaying? Weapons are banned at the gate, so keep props soft and check each city&apos;s entry rules. Need a name for your character? Try the <Link href="/anime-name-generator" className="text-violet hover:underline">anime name generator</Link>.</p>
            <p className="mt-1 flex gap-x-3 text-[11px] text-muted">{CC_COSPLAY.sources.map((u, i) => <a key={u} href={u} target="_blank" rel="noopener nofollow" className="underline">Source {i + 1}</a>)}</p>
          </div>
        </div>
      </section>

      {past.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="past-h">
          <h2 id="past-h" className="h-section mb-3">Recent editions</h2>
          <ul className="space-y-1.5 text-sm">{past.map((p) => <li key={p.name}><span className="font-medium text-ink">{p.name}</span> <span className="text-muted">· {ccDates(p)} · {p.note}</span> <a href={p.source} target="_blank" rel="noopener nofollow" className="text-[11px] text-muted underline">Source</a></li>)}</ul>
        </section>
      )}

      <div id="faq" data-section className="pt-2"><Faq title="Comic Con India: FAQ" items={faq} /></div>
    </div>
  );
}
