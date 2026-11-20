import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import Faq, { type FaqItem } from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import SectionNav from "@/components/fx/SectionNav";
import { StreamCell } from "@/components/KidsShowTable";
import { animeBySlugs, posterUrl } from "@/lib/kitsu";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import {
  KIDS_TV_CHECKED, KIDS_TV_MRP, KIDS_TV_PATH, airingLabel, andList, channelHref, channelShowIds, kidsChannel, kidsChannels,
  kidsShow, recentlyOnAir, showFilmsHref, showHref, showIndex, streamsNow,
} from "@/lib/kidstv";

export const revalidate = 86400;

const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
/** The shows Indian searchers ask "which channel shows X in Hindi" about most (Keyword Planner, Nov 2026: Shin-chan,
 *  Doraemon, Beyblade, Pokémon, then the Fujiko Fujio classics). */
const ASKED = ["shinchan", "doraemon", "ninja-hattori", "pokemon", "beyblade-burst", "naruto", "kiteretsu", "perman"];
/** The spelling people search, where it differs from the title ("shinchan in hindi"). */
const ASKED_AS: Record<string, string> = { shinchan: "Shinchan" };
const short = (n: string) => n.replace(/ India$/, "");

/** "Doraemon on Disney Channel (on air, Sep 2025) and Hungama TV (from 2005)". */
function whereLine(id: string) {
  const e = showIndex().find((x) => x.s.id === id);
  if (!e) return null;
  return `${e.s.t} on ${andList(e.on.map(({ c, r }) => `${c.name} (${recentlyOnAir(r) ? "on air in the latest reports" : r.since ? `from ${r.since}` : "listed on its website"})`))}`;
}

function counts() {
  const channels = kidsChannels();
  const index = showIndex();
  const recent = index.filter((e) => e.on.some(({ r }) => recentlyOnAir(r)));
  const busiest = [...channels].sort((a, b) => channelShowIds(b).length - channelShowIds(a).length)[0];
  return { channels, index, recent, busiest };
}

export function generateMetadata(): Metadata {
  const { channels, index } = counts();
  const y = new Date(`${KIDS_TV_CHECKED}T00:00:00Z`).getUTCFullYear();
  return {
    // "kids anime in hindi", "hindi cartoon channel anime", "which channel shows shinchan/doraemon in hindi".
    title: fitTitle([`Kids Anime in Hindi on TV (${y}): ${index.length} Shows, ${channels.length} Channels`, `Kids Anime in Hindi on TV (${y}): Which Channel Shows What`, `Kids Anime in Hindi on TV (${y})`]),
    description: fitDescription(`Which kids' channel shows which anime in Hindi: Doraemon on Disney Channel, Shin-chan and Naruto on Sony YAY!, Ninja Hattori on Nick, Pokémon on Hungama. With years, prices and streams. Checked ${fmt(KIDS_TV_CHECKED)}.`),
    alternates: { canonical: KIDS_TV_PATH },
  };
}

/** Indian kids' TV channels that air anime in Hindi, and which channel shows which anime. */
export default async function KidsTvHub() {
  const { channels, index, recent, busiest } = counts();
  const dubs = index.flatMap((e) => e.s.dub ?? []);
  const kitsu = await animeBySlugs(dubs.slice(0, 6), true);
  const posters = ["doraemon-2005", "crayon-shin-chan", "naruto"].map((s) => { const a = kitsu.get(s); return a ? posterUrl(a, "medium") : null; });
  const asOf = fmt(KIDS_TV_MRP.asOf);
  const priced = channels.filter((c) => c.mrp).sort((a, b) => a.mrp! - b.mrp!);
  const pogo = kidsChannel("pogo");
  const online = index.filter((e) => streamsNow(e.s).length);

  const faq: FaqItem[] = [
    ...ASKED.flatMap((id) => {
      const line = whereLine(id);
      const s = kidsShow(id);
      const streams = [...new Set(streamsNow(s).map((p) => p.name.replace(/ \(YouTube\)$/, " on YouTube")))];
      return line ? [{ q: `Which channel shows ${ASKED_AS[id] ?? s.t.replace(/ & .*$/, "")} in Hindi?`, a: `${line}.${streams.length ? ` To stream it in Hindi: ${andList(streams)}.` : ""}` }] : [];
    }),
    { q: "Which kids' channel shows the most anime in Hindi?", a: `${busiest.name}, with ${channelShowIds(busiest).length} anime we could confirm: ${andList(channelShowIds(busiest).map((id) => kidsShow(id).t))}.` },
    { q: "Are these kids' channels free?", a: `No. All of them are pay channels, bought inside a DTH or cable pack. Their declared prices run from ₹${priced[0].mrp} (${andList(priced.filter((c) => c.mrp === priced[0].mrp).map((c) => c.name))}) to ₹${priced[priced.length - 1].mrp} (${priced[priced.length - 1].name}) a month before taxes, per TRAI's list as on ${asOf}.` },
    ...(pogo ? [{ q: "Does Pogo show anime?", a: `Rarely. ${pogo.summary.replace(/\.$/, "")}, from January 2016.` }] : []),
    { q: "Can I watch these kids' anime online in Hindi?", a: `Some of them: ${online.map((e) => `${e.s.t} (${andList([...new Set(streamsNow(e.s).map((p) => p.name.replace(/ \(YouTube\)$/, " YouTube")))])})`).join(", ")}. These are official streams; sites offering every cartoon free are unlicensed.` },
    { q: "How was this list checked?", a: `Each channel–show pair comes from a dated news or trade-press report (Indian Television, exchange4media, afaqs, Anime News Network, Anime News India) or the channel's own website, checked on ${fmt(KIDS_TV_CHECKED)}. Pairs found only on Wikipedia or fan sites are left out. "Still airing" is the latest dated report, not today's schedule.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("CollectionPage", KIDS_TV_PATH, "Kids' anime in Hindi on TV")} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: KIDS_TV_PATH, label: "Kids' TV in Hindi" }]}
        eyebrow="📺 Kids' TV in Hindi"
        title={<>Kids&apos; anime in Hindi <span className="text-gradient">on TV</span></>}
        subtitle="Which Indian kids' channel airs which anime in Hindi: Sony YAY!, Hungama, Disney Channel, Nick and Cartoon Network, with their sister channels. Since when, whether it's still on, and where to stream each in Hindi."
        facts={[
          { value: String(channels.length), label: "channels" },
          { value: String(index.length), label: "anime" },
          { value: String(recent.length), label: "on air at last check" },
        ]}
        hue={25}
        posters={posters}
      />
      <AnswerLead checked={fmt(KIDS_TV_CHECKED)}>
        Doraemon airs on Disney Channel (last reported September 2025); Shin-chan on Sony YAY! (newer episodes, since 2024) and Hungama (the classic dub, since 2006). Ninja Hattori and Perman came to India on Nick in 2006, and Pokémon on Cartoon Network in 2003; Hungama and Super Hungama aired it in 2024. {busiest.name} has the most anime ({channelShowIds(busiest).length}), including Naruto. All of them are pay channels.
      </AnswerLead>
      <MadeBy className="mt-4" date={KIDS_TV_CHECKED} method="Each channel–show pair is from a dated news or trade-press report, or the channel's own website; Wikipedia and fan sites alone don't count." />

      <SectionNav sections={[
        { id: "which", label: "Which channel?" },
        { id: "channels", label: `Channels (${channels.length})` },
        { id: "price", label: "Free or paid?" },
        { id: "faq", label: "FAQ" },
      ]} />

      <section id="which" data-section className="reveal pt-10" aria-labelledby="which-h">
        <h2 id="which-h" className="h-section mb-1">Which channel shows it in Hindi?</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">Every anime we could confirm on an Indian kids&apos; channel, and every channel it has been on. &ldquo;Still airing&rdquo; is the latest dated report we found, not today&apos;s schedule; check your DTH guide for timings.</p>
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-3 py-2">Anime</th>
                <th scope="col" className="px-3 py-2">Channel (since) · still airing?</th>
                <th scope="col" className="px-3 py-2">Stream in Hindi now</th>
              </tr>
            </thead>
            <tbody>
              {index.map(({ s, on }) => {
                const href = showHref(s), films = showFilmsHref(s);
                return (
                  <tr key={s.id} className="border-t border-line/60 align-top">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-ink">{href ? <Link href={href} className="hover:text-violet-2">{s.t}</Link> : s.t}</p>
                      {films && <p className="mt-0.5 text-xs"><Link href={films} className="text-violet hover:underline">Movies in Hindi →</Link></p>}
                    </td>
                    <td className="px-3 py-2">
                      <ul className="space-y-0.5">
                        {on.map(({ c, r }) => (
                          <li key={c.slug}>
                            <Link href={channelHref(c)} className="font-medium text-ink hover:text-violet-2">{short(c.name)}</Link>
                            <span className="text-muted"> ({r.since ?? "date not given"}) · </span>
                            <span className={recentlyOnAir(r) ? "text-emerald-300" : "text-ink/80"}>{airingLabel(r)}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-3 py-2"><StreamCell id={s.id} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="channels" data-section className="reveal pt-10" aria-labelledby="channels-h">
        <h2 id="channels-h" className="h-section mb-1">Kids&apos; channels that air anime in Hindi</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">Busiest first. Each card links to the channel&apos;s full list with sources.</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {channels.map((c) => (
            <li key={c.slug} id={c.slug} className="card scroll-mt-32 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold text-ink"><Link href={channelHref(c)} className="hover:text-violet-2">{c.name}</Link></h3>
                <span className="shrink-0 text-xs text-muted">{c.shows.length} anime{c.mrp ? ` · ₹${c.mrp}/month` : ""}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted">{c.owner}{c.parent ? ` · sister channel of ${kidsChannel(c.parent)?.name ?? c.parent}` : ""}</p>
              <p className="mt-2 text-sm leading-6 text-ink/90">{c.summary}</p>
              <p className="mt-2 flex flex-wrap gap-1.5 text-xs">{c.shows.map((r) => <span key={r.show} className="chip text-xs">{kidsShow(r.show).t}</span>)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="price" data-section className="reveal pt-10" aria-labelledby="price-h">
        <h2 id="price-h" className="h-section mb-1">Free or paid?</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">All of these are pay channels, not free-to-air: you get them in a DTH or cable pack. The broadcasters&apos; declared prices, a month before taxes:</p>
        <div className="card max-w-xl overflow-x-auto p-0">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-muted"><th scope="col" className="px-3 py-2">Channel</th><th scope="col" className="px-3 py-2">Price (MRP)</th></tr></thead>
            <tbody>
              {priced.map((c) => (
                <tr key={c.slug} className="border-t border-line/60">
                  <td className="px-3 py-2"><Link href={channelHref(c)} className="font-medium text-ink hover:text-violet-2">{c.name}</Link></td>
                  <td className="px-3 py-2 tabular-nums text-ink">₹{c.mrp} <span className="text-muted">/ month</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Source: <a href={KIDS_TV_MRP.source} target="_blank" rel="noopener nofollow" className="underline">TRAI&apos;s list of pay-channel prices</a> as on {asOf} (SD channels). Packs bundle channels at their own price. To stream the shows instead, see <Link href="/hindi-dub" className="underline">where each anime streams in Hindi</Link>.</p>
      </section>

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href="/hindi-dub/movies/doraemon" className="chip">Doraemon movies in Hindi</Link>
        <Link href="/hindi-dub/movies/shinchan" className="chip">Shin-chan movies in Hindi</Link>
        <Link href="/hindi-dub/movies/pokemon" className="chip">Pokémon movies in Hindi</Link>
        <Link href="/parents-guide" className="chip">Anime for kids: parents&apos; guide</Link>
        <Link href="/hindi-dub" className="chip">All Hindi dubbed anime</Link>
      </p>

      <div id="faq" data-section className="pt-2"><Faq title="Kids' anime in Hindi on TV: FAQ" items={faq} /></div>
    </div>
  );
}
