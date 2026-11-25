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
import { CHARACTER_VS, vsPath } from "@/lib/charvs";
import { STRONGEST_CHECKED, ranking, rankingSlugs, ranked, portrait, strongestPath } from "@/lib/strongest";

export const revalidate = 86400;

const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const all = () => rankingSlugs().map((s) => ({ s, r: ranking(s)!, top: ranked(ranking(s)!) }));

export function generateMetadata(): Metadata {
  const xs = all();
  return {
    title: fitTitle([`Strongest Anime Characters (${y}): Rankings by Series`, `Strongest Anime Characters (${y})`, "Strongest Anime Characters"]),
    description: fitDescription(`Who's strongest in ${list(xs.map((x) => x.r.name))}? Rankings built only from titles, ranks and fights in each story, with the strongest in each series and match-ups across them.`),
    alternates: { canonical: "/strongest-anime-characters" },
  };
}

/** The hub: each series' strongest characters, and why there's no honest single list across series. */
export default function StrongestHub() {
  const xs = all();
  const vs = CHARACTER_VS.filter((v) => !v.canon).slice(0, 8);

  const faq: FaqItem[] = [
    { q: "Who is the strongest anime character of all time?", a: `No story puts characters from different series against each other, so there's no canon answer. Inside each series there is: ${list(xs.map((x) => `${x.top[0].name} in ${x.r.name}`))}, by what happens in the story.` },
    ...xs.map((x) => ({ q: `Who is the strongest ${x.r.name} character?`, a: `${x.top[0].name}, followed by ${list(x.top.slice(1, 3).map((c) => c.name))}. See the full ${x.r.name} ranking for the reasons.` })),
    { q: "Is Saitama stronger than Goku?", a: "They've never met in any story, so no canon answer exists. Our Goku vs Saitama page compares what each has done in his own series." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Strongest anime characters by series", xs.map((x) => ({ url: strongestPath(x.s), name: `Strongest ${x.r.name} characters` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/characters", label: "Characters" }, { href: "/strongest-anime-characters", label: "Strongest characters" }]}
        eyebrow="⚔️ Power rankings"
        title={<>Strongest anime characters, <span className="text-gradient">series by series</span></>}
        subtitle="Who's strongest is only settled inside a story, so each ranking stays within one series and uses only titles, ranks and fights that actually happen. Spoilers stay hidden until you tap."
        facts={[{ value: String(xs.length), label: "series ranked" }, { value: String(xs.reduce((n, x) => n + x.top.length, 0)), label: "characters placed" }]}
        hue={0}
      />

      <AnswerLead checked={fmt(STRONGEST_CHECKED)}>
        No story pits characters from different anime against each other, so there&apos;s no honest single list. Within each series, the strongest are {list(xs.map((x) => `${x.top[0].name} (${x.r.name})`))}, going by titles, ranks and fight results in the story.
      </AnswerLead>

      <section className="reveal grid gap-4 pt-10 md:grid-cols-2" aria-label="Rankings by series">
        {xs.map((x) => (
          <div key={x.s} className="card p-4">
            <h2 className="text-lg font-bold text-ink"><Link href={strongestPath(x.s)} className="hover:text-violet-2">Strongest {x.r.name} characters →</Link></h2>
            <ol className="mt-3 space-y-2">
              {x.top.slice(0, 5).map((c, i) => (
                <li key={c.name} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right tabular-nums text-muted">{i + 1}</span>
                  <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded-md bg-bg-2">{portrait(c.slug) && <Image src={portrait(c.slug)!} alt={c.name} fill sizes="32px" className="object-cover object-top" />}</span>
                  <span className="font-medium text-ink">{c.name}</span>
                  <span className="truncate text-xs text-muted">{c.tier}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      {vs.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="vs-h">
          <h2 id="vs-h" className="h-section mb-1">Across series: match-ups</h2>
          <p className="mb-3 max-w-3xl text-sm text-muted">These pairs never meet in a story, so the pages compare what each has done in their own series instead of naming a winner.</p>
          <ul className="flex flex-wrap gap-2">{vs.map((v) => <li key={v.slug}><Link href={vsPath(v)} className="chip">⚔️ {v.an} vs {v.bn}</Link></li>)}</ul>
        </section>
      )}

      <MadeBy className="mt-8" method="Each series is ranked by official titles and ranks, bounties and fight results in its anime and manga, from the series wikis, Wikipedia and Anime News Network; no cross-series winners are named." date={STRONGEST_CHECKED} />
      <Faq title="Strongest anime characters: FAQ" items={faq} />
    </div>
  );
}
