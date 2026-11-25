import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import data from "@/data/funimation.json";

export const revalidate = 86400;

/**
 * What happened to Funimation, and where its anime are now. "funimation" is 40.5K searches a month in the US and
 * "funimation anime" 18.1K (Keyword Planner, Nov 2026); Bing shows "funimation" at 19.5K impressions a year. Facts from
 * data/funimation.json, each from two sources (ANN, Engadget, Siliconera, GameSpot, Wikipedia).
 */
const D = data as { checked: string; timeline: { date: string; what: string }[]; regions: string; sources: string[] };
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const CLOSED = "2024-04-02";

export function generateMetadata(): Metadata {
  return {
    title: fitTitle(["What Happened to Funimation? Where Its Anime Are Now", "What Happened to Funimation? Where to Watch Now", "What Happened to Funimation?"]),
    description: fitDescription(`Funimation closed on ${fmt(CLOSED)} and merged into Crunchyroll, which has most of its anime and dubs. What happened to accounts and digital copies, and where to watch now.`),
    alternates: { canonical: "/funimation" },
  };
}

const ANSWERS: { h: string; p: string }[] = [
  { h: "Your account", p: "Funimation accounts moved to Crunchyroll with their watch history and queue. People with both accounts could merge them or choose which one's data to keep, and billing moved to Crunchyroll's plans." },
  { h: "Digital copies", p: "The digital versions that came with some Funimation DVDs and Blu-rays stopped working when Funimation closed; Crunchyroll said it doesn't support them. Its president promised affected users \"an appropriate value\" in February 2024 but never said what that would be. Discs you own still play." },
  { h: "The English dubs", p: "Most of Funimation's library, dubs included, is on Crunchyroll now. Not all of it: when Funimation closed, about 100 to 190 titles or language tracks had no streaming home (Slayers, Silver Spoon and Escaflowne among them), and what's available differs by country." },
  { h: "The brand", p: "Funimation is no longer a consumer brand. Its YouTube channel is now Crunchyroll Dubs, its discs carry the Crunchyroll name, the Funimation Shop is the Crunchyroll Store, and the company itself is Crunchyroll, LLC, owned by Sony." },
];

/** What happened to Funimation: the merger timeline, what changed for accounts, digital copies and dubs, and where to watch. */
export default function FunimationPage() {
  const faq: FaqItem[] = [
    { q: "What happened to Funimation?", a: `Sony's Funimation bought Crunchyroll in 2021 and merged into it. The Funimation website and app closed on ${fmt(CLOSED)}, and funimation.com now redirects to crunchyroll.com.` },
    { q: "Is Funimation still available?", a: `No. It closed on ${fmt(CLOSED)}. Its anime, including most of its English dubs, are on Crunchyroll.` },
    { q: "Where can I watch Funimation anime now?", a: "On Crunchyroll, which is the same Sony company. Most titles and dubs moved there; a few older ones aren't streaming anywhere, so check each show's where-to-watch page." },
    { q: "Did Funimation and Crunchyroll merge?", a: "Yes. Sony's Funimation bought Crunchyroll from AT&T in August 2021, renamed the company Crunchyroll in February 2022 and moved new simulcasts to Crunchyroll from the Spring 2022 season. The Funimation app kept running until April 2024." },
    { q: "What happened to Funimation digital copies?", a: "They stopped working when Funimation closed: Crunchyroll doesn't support them. Crunchyroll promised affected users \"an appropriate value\" but never published what that meant. Physical discs aren't affected." },
    { q: "Was Funimation available in India?", a: "We found no record of Funimation running a streaming service in India. Crunchyroll is available there directly and as a Prime Video add-on." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", "/funimation", "What happened to Funimation?", `Funimation closed on ${fmt(CLOSED)} and merged into Crunchyroll.`)} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/funimation", label: "Funimation" }]}
        eyebrow="📺 Streaming history"
        title={<>What happened to <span className="text-gradient">Funimation?</span></>}
        subtitle="Funimation, the US home of so many English dubs, merged into Crunchyroll and closed in 2024. Here's what changed, and where its anime are now."
        facts={[
          { value: fmt(CLOSED), label: "closed" },
          { value: "Crunchyroll", label: "where its anime went" },
        ]}
        hue={280}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/crunchyroll-price" className="chip">Crunchyroll price &amp; free trial</Link>
          <Link href="/crunchyroll-price-india" className="chip">Crunchyroll price in India</Link>
          <Link href="/where-to-watch" className="chip">Where to watch anime</Link>
          <Link href="/sub-vs-dub" className="chip">Which anime are dubbed</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(D.checked)}>
        Funimation closed on {fmt(CLOSED)}. Sony, which owned it, bought Crunchyroll in 2021 and merged the two, so Funimation&apos;s anime and most of its English dubs are on Crunchyroll now, and funimation.com redirects there. Funimation accounts moved to Crunchyroll; its digital copies stopped working.
      </AnswerLead>

      <section className="reveal pt-10" aria-labelledby="tl-h">
        <h2 id="tl-h" className="h-section mb-4">From Funimation to Crunchyroll</h2>
        <ol className="relative max-w-3xl space-y-4 border-l border-line pl-5">
          {D.timeline.map((t) => (
            <li key={t.date} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-violet" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{fmt(t.date)}</p>
              <p className="mt-0.5 text-sm leading-6 text-ink/90">{t.what}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="reveal pt-10" aria-labelledby="what-h">
        <h2 id="what-h" className="h-section mb-4">What happened to accounts, digital copies and dubs</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {ANSWERS.map((x) => (
            <div key={x.h} className="card p-4">
              <h3 className="font-semibold text-ink">{x.h}</h3>
              <p className="mt-1 text-sm leading-6 text-ink/85">{x.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="reveal pt-10" aria-labelledby="now-h">
        <h2 id="now-h" className="h-section mb-3">Where to watch Funimation anime now</h2>
        <div className="card max-w-3xl space-y-2 p-4 text-sm leading-6 text-ink/85">
          <p><strong className="text-ink">Crunchyroll</strong> is Funimation&apos;s direct successor and has most of its catalogue and dubs. Funimation streamed in {D.regions}</p>
          <p>Dubbed clips and first episodes are on the Crunchyroll Dubs YouTube channel (the old Funimation channel), and discs are sold under the Crunchyroll name. For any single show, its AniLumi page lists every legal place it streams in your country.</p>
        </div>
      </section>

      <MadeBy className="mt-8" method="Dates and changes are checked against Crunchyroll's announcements as reported by Anime News Network, Engadget, Siliconera and GameSpot, with Wikipedia as a second source." date={D.checked} />
      <Faq title="Funimation: FAQ" items={faq} />
    </div>
  );
}
