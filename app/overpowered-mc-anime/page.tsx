import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { getAnimeBySlug, posterUrl } from "@/lib/kitsu";
import { dubPageEntry, hindiDubPath } from "@/lib/hindidub";
import data from "@/data/op-mc-anime.json";

export const revalidate = 86400;

/**
 * Anime with an overpowered main character, from each show's own premise (Wikipedia's plot section and the official
 * synopses), split into OP from the start and becomes OP. Keyword Planner, Nov 2026, a month: "op mc anime" 2.9K US /
 * 2.9K India, "anime op mc" 2.9K / 2.4K, "anime where the main character is op" 1.9K US, "anime with overpowered
 * main character" 720 / 210. Data in data/op-mc-anime.json.
 */
type Title = { t: string; kitsu: string; mc: string; group: "start" | "becomes"; isekai: boolean; how: string; eps?: string; sources: string[] };
const D = data as { checked: string; titles: Title[]; excluded: { t: string; why: string }[] };
const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const start = D.titles.filter((x) => x.group === "start"), becomes = D.titles.filter((x) => x.group === "becomes");

export function generateMetadata(): Metadata {
  return {
    title: fitTitle([`Anime With an Overpowered Main Character: ${D.titles.length} OP MC Anime (${y})`, `${D.titles.length} OP MC Anime: Overpowered Main Characters (${y})`, `OP MC Anime (${y}): Overpowered Main Characters`]),
    description: fitDescription(`${D.titles.length} anime where the MC is overpowered, from ${start[0].t} and ${start[1].t} to ${becomes[0].t}: OP from episode 1 or growing into it, with Hindi dubs marked.`),
    alternates: { canonical: "/overpowered-mc-anime" },
  };
}

async function Card({ x }: { x: Title }) {
  const a = await getAnimeBySlug(x.kitsu).catch(() => null);
  const poster = a ? posterUrl(a, "small") : null;
  const hindi = dubPageEntry(x.kitsu);
  return (
    <li className="card flex gap-3 p-3">
      <span className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-bg-2">{poster && <Image src={poster} alt={x.t} fill sizes="64px" className="object-cover" />}</span>
      <div className="min-w-0 text-sm">
        <Link href={`/anime/${x.kitsu}`} className="font-semibold text-ink hover:text-violet-2 hover:underline">{x.t}</Link>
        <p className="mt-0.5 text-xs text-muted">{x.mc}{x.eps ? ` · ${x.eps.split(" (")[0]}` : ""}</p>
        <p className="mt-1 leading-6 text-ink/85">{x.how}</p>
        <p className="mt-1.5 flex flex-wrap gap-1.5">
          {x.isekai && <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[11px] text-ink/85">Isekai</span>}
          {hindi && <Link href={hindiDubPath(x.kitsu)} className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[11px] font-semibold text-orange-300 hover:underline">Hindi dub</Link>}
        </p>
      </div>
    </li>
  );
}

/** Anime whose premise makes the main character overpowered, from the start or by growing into it. */
export default function OverpoweredMcPage() {
  const isekai = D.titles.filter((x) => x.isekai);
  const notIsekai = start.filter((x) => !x.isekai);
  const hindi = D.titles.filter((x) => dubPageEntry(x.kitsu));

  const faq: FaqItem[] = [
    { q: "What anime has the most overpowered main character?", a: `One-Punch Man is the purest case: Saitama ends any fight with a single punch and is bored because nobody can challenge him. ${list(start.slice(1, 4).map((x) => `${x.t} (${x.mc.split(" (")[0]})`))} are close behind.` },
    { q: "Which anime have an MC who is OP from the start?", a: `${list(start.slice(0, 8).map((x) => x.t))}, among the ${start.length} on this page.` },
    { q: "Which anime have a weak MC who becomes OP?", a: `${list(becomes.map((x) => x.t))}.` },
    { q: "What are the best OP MC anime that aren't isekai?", a: `${list(notIsekai.slice(0, 7).map((x) => x.t))}.` },
    ...(hindi.length ? [{ q: "Which OP MC anime are dubbed in Hindi?", a: `${list(hindi.map((x) => x.t))}.` }] : []),
    { q: "Is The Eminence in Shadow an OP MC anime?", a: D.excluded.find((x) => /Eminence/.test(x.t))?.why ?? "Its official premise doesn't describe the main character as overpowered, so it isn't on this list." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Anime with an overpowered main character", D.titles.map((x) => ({ url: `/anime/${x.kitsu}`, name: x.t })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }, { href: "/overpowered-mc-anime", label: "OP MC anime" }]}
        eyebrow="💪 Overpowered main characters"
        title={<>Anime with an <span className="text-gradient">overpowered main character</span></>}
        subtitle="Shows whose own premise makes the protagonist overwhelmingly strong: some are OP from episode 1, others grow into it. Fan opinion alone doesn't get a show on the list."
        facts={[
          { value: String(D.titles.length), label: "OP MC anime" },
          { value: String(start.length), label: "OP from the start" },
          { value: String(becomes.length), label: "become OP" },
          { value: String(isekai.length), label: "isekai" },
        ]}
        hue={20}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/genre/isekai" className="chip">Isekai anime</Link>
          <Link href="/strongest-anime-characters" className="chip">⚔️ Strongest characters</Link>
          <Link href="/similar/solo-leveling" className="chip">Anime like Solo Leveling</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(D.checked)}>
        The best-known anime with an overpowered main character are {list(D.titles.slice(0, 5).map((x) => x.t))}. {start.length} here have an MC who is OP from the start and {becomes.length} have one who becomes OP, such as {list(becomes.slice(0, 2).map((x) => x.t))}; {isekai.length} are isekai.
      </AnswerLead>

      <section className="reveal pt-10" aria-labelledby="start-h">
        <h2 id="start-h" className="h-section mb-1">OP from the start</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">The main character is already the strongest by episode 1.</p>
        <ul className="grid gap-3 md:grid-cols-2">{start.map((x) => <Card key={x.kitsu} x={x} />)}</ul>
      </section>

      <section className="reveal pt-10" aria-labelledby="becomes-h">
        <h2 id="becomes-h" className="h-section mb-1">Weak MC who becomes OP</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">Starts weak or underrated; growing overpowered is the whole premise.</p>
        <ul className="grid gap-3 md:grid-cols-2">{becomes.map((x) => <Card key={x.kitsu} x={x} />)}</ul>
      </section>

      {D.excluded.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="out-h">
          <h2 id="out-h" className="h-section mb-3">Often called OP MC anime, but not on this list</h2>
          <ul className="max-w-3xl space-y-2 text-sm">{D.excluded.map((x) => <li key={x.t} className="card p-3"><span className="font-semibold text-ink">{x.t}:</span> <span className="text-ink/85">{x.why}</span></li>)}</ul>
        </section>
      )}

      <MadeBy className="mt-8" method="A show qualifies when its own premise, in Wikipedia's plot section or the official synopsis, says the protagonist is overwhelmingly strong; each line paraphrases that premise, with no spoilers past the opening episodes." date={D.checked} />
      <Faq title="OP MC anime: FAQ" items={faq} />
    </div>
  );
}
