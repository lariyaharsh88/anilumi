import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { STRONGEST_CHECKED, ranking, rankingSlugs, ranked, portrait, strongestPath, type RankedChar } from "@/lib/strongest";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ series: string }> };

const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");

function load(slug: string) {
  const r = ranking(slug);
  if (!r) notFound();
  return { r, all: ranked(r) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { series } = await params;
  const { r, all } = load(series);
  return {
    title: fitTitle([`Strongest ${r.name} Characters, Ranked by the Story (${y})`, `Strongest ${r.name} Characters (${y}): Tier List`, `Strongest ${r.name} Characters`]),
    description: fitDescription(`The ${all.length} strongest ${r.name} characters in tiers, from ${list(all.slice(0, 3).map((c) => c.name))} down, ranked only by titles, ranks and fights that happen in the story. Spoilers hidden until you tap.`),
    alternates: { canonical: strongestPath(series) },
  };
}

function Char({ c, n }: { c: RankedChar; n: number }) {
  const img = portrait(c.slug);
  const name = c.slug ? <Link href={`/character/${c.slug}`} className="font-semibold text-ink hover:text-violet-2 hover:underline">{c.name}</Link> : <span className="font-semibold text-ink">{c.name}</span>;
  return (
    <li className="card flex gap-3 p-3">
      <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-bg-2">{img && <Image src={img} alt={c.name} fill sizes="48px" className="object-cover object-top" />}</span>
      <div className="min-w-0 text-sm">
        <p><span className="mr-1.5 text-muted tabular-nums">{n}.</span>{name}{c.confidence === "medium" && <span className="ml-1.5 text-[11px] text-muted" title="One source, or the placement is debated">(debated)</span>}</p>
        {c.spoiler ? (
          <details className="group mt-1">
            <summary className="cursor-pointer list-none text-xs text-muted"><span aria-hidden className="mr-1">🔒</span>Why here: spoilers, tap to show</summary>
            <p className="mt-1 leading-6 text-ink/85">{c.why}</p>
          </details>
        ) : <p className="mt-1 leading-6 text-ink/85">{c.why}</p>}
      </div>
    </li>
  );
}

/** One series' strongest characters, tier by tier, from titles, ranks and fights in the story. */
export default async function StrongestPage({ params }: Props) {
  const { series } = await params;
  const { r, all } = load(series);
  const others = rankingSlugs().filter((s) => s !== series).map((s) => ({ s, r: ranking(s)! }));
  let n = 0;

  const faq: FaqItem[] = [
    { q: `Who is the strongest ${r.name} character?`, a: `${all[0].name}, by what happens in the story${all[1] ? `, followed by ${list(all.slice(1, 3).map((c) => c.name))}` : ""}. The reasons are on this page; the ones from later arcs sit behind spoiler toggles.` },
    { q: "How is this ranking made?", a: r.basis },
    ...r.tiers.slice(0, 3).map((t) => ({ q: `Who is in the ${t.name} tier?`, a: `${list(t.chars.map((c) => c.name))}.${t.note ? ` ${t.note}` : ""}` })),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList(`Strongest ${r.name} characters`, all.map((c) => ({ url: c.slug ? `/character/${c.slug}` : strongestPath(series), name: c.name })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/strongest-anime-characters", label: "Strongest characters" }, { href: strongestPath(series), label: r.name }]}
        eyebrow="⚔️ Power ranking"
        title={<>Strongest {r.name} characters, <span className="text-gradient">ranked by the story</span></>}
        subtitle={`${all.length} characters in ${r.tiers.length} tiers, placed only by titles, ranks and fights that happen in ${r.name}, not fan theories. Anything from later arcs is hidden until you tap.`}
        facts={[{ value: String(all.length), label: "characters" }, { value: String(r.tiers.length), label: "tiers" }, { value: String(all.filter((c) => !c.spoiler).length), label: "spoiler-free" }]}
        hue={0}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href={`/anime/${r.anime}/characters`} className="chip">All {r.name} characters</Link>
          <Link href={`/watch-order/${r.anime}`} className="chip">Watch order</Link>
          <Link href="/strongest-anime-characters" className="chip">Other series</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(STRONGEST_CHECKED)}>
        By what happens in the story, the strongest {r.name} characters are {list(all.slice(0, 5).map((c) => c.name))}. The page places {all.length} characters in {r.tiers.length} tiers, from &ldquo;{r.tiers[0].name}&rdquo; down to &ldquo;{r.tiers.filter((t) => !/^not ranked/i.test(t.name)).at(-1)!.name}&rdquo;.
      </AnswerLead>

      <p className="mt-6 max-w-3xl text-xs text-muted">Heads-up for anime-only viewers: names and tiers alone can give away later arcs. The reasons for each placement stay hidden until you tap.</p>

      {r.tiers.map((t) => (
        <section key={t.name} className="reveal pt-10" aria-labelledby={`t-${t.name}`}>
          <h2 id={`t-${t.name}`} className="h-section mb-1">{t.name}</h2>
          {t.note && <p className="mb-2 max-w-3xl text-sm text-muted">{t.note}</p>}
          <ul className="mt-3 grid gap-3 md:grid-cols-2">{t.chars.map((c) => <Char key={c.name} c={c} n={++n} />)}</ul>
        </section>
      ))}

      <section className="reveal pt-10" aria-labelledby="notes-h">
        <h2 id="notes-h" className="h-section mb-3">How the order was decided</h2>
        <details className="group card max-w-3xl p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-ink"><span aria-hidden className="mr-1.5">🔒</span>Tie-breaks, who was left out, and where the anime stands <span className="font-normal text-muted group-open:hidden">· spoilers, tap to show</span></summary>
          <p className="mt-3 text-sm leading-6 text-ink/85">{r.notes}</p>
        </details>
      </section>

      {others.length > 0 && (
        <p className="mt-8 flex flex-wrap gap-2 text-sm">{others.map(({ s, r: o }) => <Link key={s} href={strongestPath(s)} className="chip">⚔️ Strongest {o.name} characters</Link>)}</p>
      )}

      <MadeBy className="mt-8" method={`Placed by official titles and ranks, bounties and fight results in the anime and manga, from the series wikis, Wikipedia and Anime News Network; "(debated)" marks a placement with one source or a real argument behind it. As of ${fmt(r.asOf)}.`} date={STRONGEST_CHECKED} />
      <Faq title={`Strongest ${r.name} characters: FAQ`} items={faq} />
    </div>
  );
}
