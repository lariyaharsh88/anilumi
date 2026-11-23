import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import JoinChannels from "@/components/JoinChannels";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { DONGHUA_CHECKED, donghuaList, freeIn, inHindi, servicesIn, type Donghua, type DonghuaRegion } from "@/lib/donghua";

export const revalidate = 86400;

const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const REGION: Record<DonghuaRegion, string> = { IN: "🇮🇳 India", US: "🇺🇸 US", GB: "🇬🇧 UK" };
const audioName: Record<string, string> = { zh: "Chinese", en: "English", hi: "Hindi", ja: "Japanese", ta: "Tamil", te: "Telugu" };

export function generateMetadata(): Metadata {
  const all = donghuaList();
  const hindi = all.filter(inHindi).length;
  return {
    title: fitTitle([`Donghua (Chinese Anime) in India (${y}): Where to Watch Legally, Hindi Dubs`, `Donghua in India (${y}): Where to Watch Legally, With Hindi Dubs`, `Donghua in India (${y}): Where to Watch, Hindi Dubs`, `Donghua (Chinese Anime): Where to Watch in India, US & UK (${y})`, `Donghua: Where to Watch Chinese Anime Legally (${y})`]),
    description: fitDescription(`Where ${all.length} popular donghua stream legally in India, the US and the UK: ${all.slice(0, 3).map((d) => d.t).join(", ")} and more, with which have Hindi audio (${hindi}) and which are free on official channels. Checked ${fmt(DONGHUA_CHECKED)}.`),
    alternates: { canonical: "/donghua" },
  };
}

function Card({ d }: { d: Donghua }) {
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-ink">{d.kitsu ? <Link href={`/anime/${d.kitsu}`} className="hover:text-violet-2">{d.t}</Link> : d.t}</h3>
        <span className="text-xs text-muted">{d.type === "film" ? "Film" : "Series"}{d.status ? ` · ${d.status}` : ""}</span>
      </div>
      {d.cn && <p className="text-xs text-muted">{d.cn}</p>}
      <ul className="mt-2 space-y-1 text-sm">
        {(["IN", "US", "GB"] as DonghuaRegion[]).map((r) => {
          const s = servicesIn(d, r);
          return (
            <li key={r} className="flex flex-wrap gap-x-2">
              <span className="w-16 shrink-0 text-muted">{REGION[r]}</span>
              {s.length ? s.map((x, i) => (
                <span key={x.service + i} className="text-ink/90">
                  {x.url ? <a href={x.url} target="_blank" rel="noopener nofollow" className="hover:text-violet-2 hover:underline">{x.service}</a> : x.service}
                  {x.kind === "free" && <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">Free</span>}
                  {x.audio?.length ? <span className="text-xs text-muted"> ({x.audio.map((a) => audioName[a] ?? a).join(", ")})</span> : null}
                  {i < s.length - 1 ? "," : ""}
                </span>
              )) : <span className="text-muted">No legal stream found</span>}
            </li>
          );
        })}
      </ul>
      {inHindi(d) && <p className="mt-2 text-sm font-medium text-orange-300">🇮🇳 Hindi audio{d.hindi.where ? `: ${d.hindi.where}` : ""}</p>}
      {d.note && <p className="mt-2 text-xs leading-5 text-muted">{d.note}</p>}
    </li>
  );
}

/** The most searched donghua, where each streams legally by country, which are in Hindi and which are free. */
export default function DonghuaPage() {
  const all = donghuaList();
  const hindi = all.filter(inHindi);
  const freeIndia = all.filter((d) => freeIn(d, "IN").length);
  const legalIndia = all.filter((d) => servicesIn(d, "IN").length);
  const services = (r: DonghuaRegion) => Object.entries(all.reduce<Record<string, number>>((m, d) => { for (const s of new Set(servicesIn(d, r).map((x) => x.service))) m[s] = (m[s] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const topIN = services("IN").slice(0, 3);

  const faq: FaqItem[] = [
    { q: "What is donghua?", a: "Donghua is the Chinese word for animation, used for animated series and films made in China. Many of the popular ones adapt Chinese web novels, often cultivation and fantasy stories, and premiere on Tencent Video, Bilibili, iQIYI or Youku before streaming abroad." },
    { q: "Where can I watch donghua legally in India?", a: legalIndia.length ? `${legalIndia.length} of the ${all.length} donghua here stream legally in India, mostly on ${list(topIN.map(([s, n]) => `${s} (${n})`))}. Each title below lists every service we found.` : "Few stream officially in India yet; each title below lists what we found." },
    { q: "Which donghua are dubbed in Hindi?", a: hindi.length ? `${list(hindi.map((d) => `${d.t}${d.hindi.where ? ` (${d.hindi.where})` : ""}`))}.` : "None of the titles here has a confirmed official Hindi track yet." },
    { q: "Can I watch donghua free and legally?", a: freeIndia.length ? `In India, ${list(freeIndia.map((d) => `${d.t} (${freeIn(d, "IN").map((s) => s.service).join(", ")})`))} stream free on official channels, with ads.` : "Free official options are rare in India right now; most donghua here need a subscription." },
    { q: "Are the Hindi donghua uploads on YouTube and Bilibili official?", a: "Usually not. Many 'Hindi dubbed' donghua uploads are re-uploads by unofficial channels. AniLumi lists only the licensor's own platforms and channels, checked on the platform itself." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Popular donghua and where to watch them", all.map((d) => ({ url: d.kitsu ? `/anime/${d.kitsu}` : "/donghua", name: d.t })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/donghua", label: "Donghua" }]}
        eyebrow="🇨🇳 Chinese animation"
        title={<>Donghua: <span className="text-gradient">where to watch legally</span></>}
        subtitle="The most searched Chinese animated series and films, with every legal place they stream in India, the US and the UK, the official free channels, and which have Hindi audio."
        facts={[
          { value: String(all.length), label: "donghua checked" },
          { value: String(legalIndia.length), label: "legal in India" },
          { value: String(hindi.length), label: "with Hindi audio" },
          { value: String(freeIndia.length), label: "free in India" },
        ]}
        hue={0}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/hindi-dub" className="chip">Hindi dubbed anime</Link>
          <Link href="/free-anime-websites" className="chip">Free anime websites</Link>
          <Link href="/where-to-watch" className="chip">Where to watch anime</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(DONGHUA_CHECKED)}>
        Of the {all.length} most-searched donghua in India, {legalIndia.length} stream legally there{topIN.length ? `, mostly on ${list(topIN.map(([s]) => s))}` : ""}. {hindi.length ? `${hindi.length} have official Hindi audio, including ${list(hindi.slice(0, 3).map((d) => d.t))}.` : "None has a confirmed official Hindi track yet."} {freeIndia.length ? `${freeIndia.length} are free on official channels.` : ""}
      </AnswerLead>

      <section className="reveal pt-10" aria-labelledby="all-h">
        <h2 id="all-h" className="h-section mb-1">The most searched donghua, and where to watch each</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">Most searched in India first. Only the licensor&apos;s own platforms and channels count; re-uploads don&apos;t.</p>
        <ul className="grid gap-3 md:grid-cols-2">{all.map((d) => <Card key={d.t} d={d} />)}</ul>
      </section>

      {hindi.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="hi-h">
          <h2 id="hi-h" className="h-section mb-1">🇮🇳 Donghua in Hindi</h2>
          <p className="mb-3 max-w-3xl text-sm text-muted">Official Hindi audio, confirmed on the platform.</p>
          <ul className="flex flex-wrap gap-1.5 text-sm">{hindi.map((d) => <li key={d.t} className="chip">{d.t}{d.hindi.where ? <span className="text-muted"> · {d.hindi.where}</span> : null}</li>)}</ul>
        </section>
      )}

      <section className="reveal pt-10" aria-labelledby="what-h">
        <h2 id="what-h" className="h-section mb-3">What is donghua?</h2>
        <div className="card max-w-3xl space-y-2 p-4 text-sm leading-6 text-ink/85">
          <p>Donghua is the Chinese word for animation. The series people outside China search for are mostly adaptations of Chinese web novels: cultivation and martial-arts fantasy (Battle Through the Heavens, Soul Land, Renegade Immortal), mystery and fantasy (Lord of Mysteries, Link Click) and comedy (The Daily Life of the Immortal King, Scissor Seven).</p>
          <p>They premiere on Chinese platforms such as Tencent Video, Bilibili, iQIYI and Youku, and reach other countries through those platforms&apos; international apps, official YouTube channels, Crunchyroll and Netflix. Long cultivation series often run for years with a new episode every week.</p>
        </div>
        <JoinChannels source="donghua" className="mt-5" />
      </section>

      <MadeBy className="mt-8" method="Each title is checked on JustWatch's country pages and the platform's own title page (audio languages read from the page), with official announcements as a second source. Fan re-uploads never count." date={DONGHUA_CHECKED} />
      <Faq title="Donghua: FAQ" items={faq} />
    </div>
  );
}
