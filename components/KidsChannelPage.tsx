import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import Faq, { type FaqItem } from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import SectionNav from "@/components/fx/SectionNav";
import KidsShowTable, { KidsPremieres, KidsTimings } from "@/components/KidsShowTable";
import { animeBySlugs, posterUrl } from "@/lib/kitsu";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { hindiPlatform } from "@/lib/hindidub";
import {
  KIDS_TV_CHECKED, KIDS_TV_MRP, KIDS_TV_PATH, andList, channelHref, channelPremieres, channelRows, channelShowIds, dateLabel,
  kidsPageChannels, kidsShow, latestTimings, monthLabel, recentlyOnAir, showHref, sisterChannels, streamsNow, type KidsChannel,
} from "@/lib/kidstv";

const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortName = (c: KidsChannel) => c.name.replace(/ India$/, "");
/** "Naruto" for "Naruto & Naruto Shippuden", "Sgt. Frog" for "Sgt. Frog (Keroro)". */
const bare = (t: string) => t.replace(/ \(.*\)$/, "").replace(/ & .*$/, "");

/** The channel's anime, its sister channels' included: on air now first, then the rest. */
function facts(ch: KidsChannel) {
  const all = [ch, ...sisterChannels(ch.slug)];
  // In the data file's order: the channel's best-known anime first (Doraemon on Hungama, Naruto on Sony YAY!).
  const ids = channelShowIds(ch);
  const recent = [...new Set(all.flatMap((c) => c.shows.filter((r) => recentlyOnAir(r)).map((r) => r.show)))];
  const latest = all.flatMap((c) => c.shows.filter((r) => r.lastSeen)).sort((a, b) => b.lastSeen!.localeCompare(a.lastSeen!))[0] ?? null;
  return { all, ids, recent, latest, names: ids.map((id) => kidsShow(id).t) };
}

/** 140-160 characters: what it airs (most recent first), what's on now, then what the page adds. A channel with dated
 *  premiere timings says so instead ("sony yay anime timing", "sony yay new anime" are searches). */
function description(ch: KidsChannel, n: number, names: string[], now: string[]) {
  const who = [ch, ...sisterChannels(ch.slug)].map((c) => c.name);
  const timed = latestTimings(ch).length > 0;
  const top = timed ? names.slice(0, 3).map(bare) : names.slice(0, 3);
  const lead = n === 1 ? `${andList(who)} ${who.length > 1 ? "air" : "airs"} ${names[0]} in Hindi.` : `${andList(who)} ${who.length > 1 ? "have" : "has"} aired ${n} anime in Hindi${n > 4 ? `, including ${andList(top)}` : `: ${andList(names)}`}.`;
  const tail = timed
    ? [" Dated timings, new premieres and where to stream them in Hindi.", " Every show sourced.", ` Checked ${fmt(KIDS_TV_CHECKED)}.`]
    : [now.length ? ` On air at last check: ${andList(now)}.` : "", ` Since when, what's still on and where to stream ${n === 1 ? "it" : "them"} in Hindi.`, ` Checked ${fmt(KIDS_TV_CHECKED)}.`, " Every show sourced."];
  let out = lead;
  for (const t of tail) if ((out + t).length <= 160) out += t;
  return out;
}

export function kidsChannelMetadata(ch: KidsChannel): Metadata {
  const { ids, recent, names } = facts(ch);
  const y = new Date(`${KIDS_TV_CHECKED}T00:00:00Z`).getUTCFullYear();
  const n = ids.length;
  const top2 = names.slice(0, 2).map(bare);
  const now = recent.map((id) => kidsShow(id).t);
  return {
    // What people type: "sony yay anime list", "hungama tv anime", "disney channel india anime", "nickelodeon anime hindi".
    title: fitTitle([
      // With dated time slots: "sony yay anime timing / schedule" (they're announcements, so "Timings", not "Schedule").
      n >= 4 && latestTimings(ch).length ? `${ch.name} Anime List & Timings (${y}): ${n} Anime in Hindi` : null,
      n >= 4 ? `${ch.name} Anime List (${y}): ${n} Anime in Hindi` : null,
      `${ch.name} Anime (${y}): ${andList(top2)} in Hindi`,
      `${shortName(ch)} Anime (${y}): ${andList(top2)} in Hindi`,
      `${ch.name} Anime in Hindi (${y})`,
    ]),
    description: fitDescription(description(ch, n, names, now)),
    alternates: { canonical: `/hindi-dub/${ch.slug}` },
  };
}

/** A kids' TV channel page: every anime it airs or aired in Hindi, sourced, with where each streams now. */
export default async function KidsChannelPage({ channel: ch }: { channel: KidsChannel }) {
  const { all, ids, recent, latest, names } = facts(ch);
  const sisters = sisterChannels(ch.slug);
  const p = hindiPlatform(ch.slug);
  const dubs = ids.flatMap((id) => kidsShow(id).dub ?? []);
  const kitsu = await animeBySlugs(dubs, true);
  const posters = dubs.slice(0, 3).map((s) => { const a = kitsu.get(s); return a ? posterUrl(a, "medium") : null; });
  const online = ids.map((id) => kidsShow(id)).filter((s) => streamsNow(s).length);
  const others = kidsPageChannels().filter((c) => c.slug !== ch.slug);
  const asOf = fmt(KIDS_TV_MRP.asOf);
  const priceLine = (c: KidsChannel) => (c.mrp ? `${c.name} is a pay channel: its declared price is ₹${c.mrp} a month before taxes (TRAI list as on ${asOf}), usually bought inside a DTH or cable pack.` : `${c.name} is a pay channel, bought inside a DTH or cable pack.`);
  const timings = latestTimings(ch), premieres = channelPremieres(ch);
  // "Naruto Shippuden Season 17" on its own, "One-Punch Man Season 3" for a bare "Season 3", else "Show: what".
  const premiereName = (p: (typeof premieres)[number]) => { const t = kidsShow(p.show).t; const w = p.what.replace(/ \(.*\)$/, ""); return w.startsWith(bare(t)) ? w : `${bare(t)}${/^Season /.test(w) ? " " : ": "}${w}`; };
  const slotLine = (p: (typeof timings)[number]) => `${premiereName(p)} (${p.slot}, from ${dateLabel(p.date)})`;
  const showList = (c: KidsChannel) => andList(channelRows(c).map((r) => `${kidsShow(r.show).t}${r.since ? ` (since ${r.since})` : ""}`));

  const faq: FaqItem[] = [
    { q: `Which anime does ${ch.name} show in Hindi?`, a: `${showList(ch)}. Each is listed only when a dated report or the channel's own page confirms it.` },
    {
      q: `What anime is on ${ch.name} now?`,
      a: recent.length
        ? `At the last check (${fmt(KIDS_TV_CHECKED)}), the latest reports had ${andList(recent.map((id) => kidsShow(id).t))} on air. TV schedules change often, so check your DTH or cable guide for today's timings.`
        : latest
          ? `We found no report of an anime on air in the last three months. The most recent was ${kidsShow(latest.show).t} (${monthLabel(latest.lastSeen!)}). Check your DTH or cable guide for today's schedule.`
          : `We found no dated report of what's on air now. Check your DTH or cable guide for today's schedule.`,
    },
    ...(timings.length ? [{
      q: `What time does anime air on ${ch.name}?`,
      a: `The latest announced timings (IST): ${timings.slice(0, 4).map(slotLine).join("; ")}. ${ch.name}'s announcements give the slot a premiere starts in, not a fixed schedule, so check your DTH or cable guide for today's timings.`,
    }, {
      q: `What's new on ${ch.name}?`,
      a: `The latest premieres: ${premieres.slice(0, 3).map((p) => `${premiereName(p)}${p.film ? " (film)" : ""} on ${dateLabel(p.date)}`).join("; ")}. Every premiere since ${premieres[premieres.length - 1].date.slice(0, 4)} is listed above, with its time slot.`,
    }] : []),
    { q: `Is ${ch.name} free?`, a: `No. ${priceLine(ch)} None of these kids' channels is free-to-air.` },
    {
      q: `Can I watch ${ch.name}'s anime online in Hindi?`,
      a: online.length
        ? `Yes, some: ${online.map((s) => `${s.t} on ${andList([...new Set(streamsNow(s).map((x) => x.name.replace(/ \(YouTube\)$/, " on YouTube")))])}`).join("; ")}. These are official streams of the Hindi dub (not always the same dub as on TV).`
        : `We haven't found an official Hindi stream of these shows; for anime you can stream in Hindi, see the Hindi dub list.`,
    },
    ...sisters.map((s) => ({ q: `Does ${s.name} show anime?`, a: `${s.summary} Confirmed: ${showList(s)}.` })),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList(`Anime on ${ch.name} in Hindi`, ids.map((id) => { const s = kidsShow(id); return { url: showHref(s) ?? `/hindi-dub/${ch.slug}`, name: s.t }; }))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: KIDS_TV_PATH, label: "Kids' TV in Hindi" }, { href: `/hindi-dub/${ch.slug}`, label: ch.name }]}
        eyebrow="📺 Kids' TV in Hindi"
        title={<>Anime on <span className="text-gradient">{ch.name}</span> in Hindi</>}
        subtitle={`Every anime ${ch.name}${sisters.length ? ` and ${andList(sisters.map((s) => s.name))}` : ""} air or have aired in Hindi, since when, whether it's still on, and where to stream it in Hindi now.`}
        facts={[
          { value: String(ids.length), label: "anime in Hindi" },
          { value: String(recent.length), label: "on air at last check" },
          { value: ch.mrp ? `₹${ch.mrp}` : "Pay", label: ch.mrp ? "a month (MRP)" : "channel" },
        ]}
        hue={25}
        posters={posters}
      />
      <AnswerLead checked={fmt(KIDS_TV_CHECKED)}>
        {ids.length === 1 ? <>{ch.name}&apos;s anime in Hindi is {names[0]}. </> : <>{ch.name}{sisters.length ? ` and ${andList(sisters.map((s) => s.name))}` : ""} have aired {ids.length} anime in Hindi: {andList(names)}. </>}
        {recent.length ? <>On air in the latest reports: {andList(recent.map((id) => kidsShow(id).t))}. </> : latest ? <>Most recently reported on air: {kidsShow(latest.show).t} ({monthLabel(latest.lastSeen!)}). </> : null}
        {ch.mrp ? <>It&apos;s a pay channel (₹{ch.mrp} a month, TRAI-declared price).</> : null}
      </AnswerLead>
      <MadeBy className="mt-4" date={KIDS_TV_CHECKED} method="Each show is listed only when a dated news or trade-press report, or the channel's own website, confirms it; 'still airing' is the latest dated report, not a guess about today's schedule." />

      <SectionNav sections={[
        { id: "shows", label: "Anime" },
        ...(timings.length ? [{ id: "timings", label: "Timings" }, { id: "new", label: "New" }] : []),
        ...sisters.map((s) => ({ id: s.slug, label: s.name })),
        { id: "watch", label: "How to watch" },
        { id: "faq", label: "FAQ" },
      ]} />

      <section id="shows" data-section className="reveal pt-10" aria-labelledby="shows-h">
        <h2 id="shows-h" className="h-section mb-1">Anime on {ch.name} in Hindi</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">{ch.summary} &ldquo;Still airing&rdquo; gives the latest dated report we found; &ldquo;–&rdquo; under streaming means we found no official Hindi stream.</p>
        <KidsShowTable channel={ch} />
      </section>

      {timings.length > 0 && (
        <section id="timings" data-section className="reveal scroll-mt-32 pt-10" aria-labelledby="timings-h">
          <h2 id="timings-h" className="h-section mb-1">{ch.name} anime timings</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">
            The time slot {ch.name} announced for each show&apos;s latest premiere, with the date it started. These are dated announcements, not today&apos;s schedule:
            we found no current, dated {ch.name} schedule we could cite (checked {fmt(KIDS_TV_CHECKED)}). For today&apos;s timings, check your DTH or cable guide (Tata Play, Airtel Digital TV, JioTV).
          </p>
          <KidsTimings channel={ch} />
        </section>
      )}

      {premieres.length > 0 && (
        <section id="new" data-section className="reveal scroll-mt-32 pt-10" aria-labelledby="new-h">
          <h2 id="new-h" className="h-section mb-1">New on {ch.name}</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">Every anime premiere on {ch.name} since {premieres[premieres.length - 1].date.slice(0, 4)} that a dated report or the channel confirmed, newest first.</p>
          <KidsPremieres channel={ch} />
        </section>
      )}

      {sisters.map((s) => (
        <section key={s.slug} id={s.slug} data-section className="reveal scroll-mt-32 pt-10" aria-labelledby={`${s.slug}-h`}>
          <h2 id={`${s.slug}-h`} className="h-section mb-1">Anime on {s.name}</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">{s.summary}</p>
          <KidsShowTable channel={s} />
        </section>
      ))}

      <section id="watch" data-section className="reveal pt-10" aria-labelledby="watch-h">
        <h2 id="watch-h" className="h-section mb-3">How to watch {ch.name}</h2>
        <div className="card max-w-3xl space-y-2 p-4 text-sm leading-6 text-ink/90">
          {p && <p>{p.how}</p>}
          {all.map((c) => <p key={c.slug}>{priceLine(c)}</p>)}
          <p className="text-xs text-muted">Prices: <a href={KIDS_TV_MRP.source} target="_blank" rel="noopener nofollow" className="underline">TRAI&apos;s list of pay-channel prices</a> as on {asOf}; operators&apos; packs cost differently.</p>
        </div>
      </section>

      <nav className="mt-10 text-sm" aria-label="Other kids' channels">
        <p className="mb-2 text-muted">Anime on other kids&apos; channels in Hindi</p>
        <ul className="flex flex-wrap gap-2">
          {others.map((c) => <li key={c.slug}><Link href={channelHref(c)} className="chip">{c.name}</Link></li>)}
          <li><Link href={KIDS_TV_PATH} className="chip">📺 All kids&apos; channels</Link></li>
          <li><Link href="/hindi-dub" className="chip">All Hindi dubbed anime</Link></li>
        </ul>
      </nav>

      <div id="faq" data-section className="pt-2"><Faq title={`${ch.name} anime: FAQ`} items={faq} /></div>
    </div>
  );
}
