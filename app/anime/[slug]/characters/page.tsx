import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAnimeBySlug, animePath } from "@/lib/kitsu";
import { characterTable, snapImage, snapGenerated, type TableRow } from "@/lib/charsnap";
import { zodiac } from "@/lib/charfacts";
import { bdLabel, bdPath } from "@/lib/birthdays";
import { vaPath } from "@/lib/anilist";
import PageHero from "@/components/PageHero";
import StatTiles from "@/components/viz/StatTiles";
import BarChart from "@/components/viz/BarChart";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

// Built from the monthly character snapshot; Kitsu is only asked for the backdrop.
export const revalidate = 604800;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

const ageText = (a: string | null) => (a ? a.replace(/-$/, "+") : null); // "15-" in AniList means "15 and up"
const charPath = (r: TableRow) => (r.c.k ? `/character/${r.c.k}` : null);

function load(slug: string) {
  const rows = characterTable(decodeURIComponent(slug));
  if (!rows) notFound();
  const title = rows[0].c.t;
  const tall = rows.filter((r) => r.cm).sort((a, b) => b.cm! - a.cm!);
  const aged = rows.filter((r) => r.ageN !== null).sort((a, b) => a.ageN! - b.ageN!);
  return { rows, title, tall, aged };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { rows, title } = load(slug);
  const lead = rows.slice(0, 3).map((r) => `${r.c.n} (${[ageText(r.age), r.cm && `${r.cm} cm`].filter(Boolean).join(", ") || "profile"})`).join(", ");
  return {
    title: `${title} Characters: Ages, Heights & Birthdays`,
    description: `How old and how tall are the ${title} characters? Ages, heights, birthdays and voice actors of ${rows.length} characters: ${lead} and more, with a height chart.`,
    alternates: { canonical: `/anime/${slug}/characters` },
  };
}

export default async function CharactersTable({ params }: Props) {
  const { slug } = await params;
  const { rows, title, tall, aged } = load(slug);
  const anime = await getAnimeBySlug(decodeURIComponent(slug)).catch(() => null);
  const base = animePath({ slug });
  const bdays = rows.filter((r) => r.c.m && r.c.d).sort((a, b) => a.c.m! - b.c.m! || a.c.d! - b.c.d!);
  const stats = [
    ...(tall.length >= 2 ? [{ label: "Tallest", value: `${tall[0].cm} cm`, sub: tall[0].c.n }, { label: "Shortest", value: `${tall[tall.length - 1].cm} cm`, sub: tall[tall.length - 1].c.n }] : []),
    ...(aged.length >= 2 ? [{ label: "Youngest", value: ageText(aged[0].age)!, sub: aged[0].c.n, still: true }, { label: "Oldest", value: ageText(aged[aged.length - 1].age)!, sub: aged[aged.length - 1].c.n, still: true }] : []),
  ];
  const Name = ({ r }: { r: TableRow }) => (charPath(r) ? <Link href={charPath(r)!} className="font-semibold text-ink hover:text-violet-2 hover:underline">{r.c.n}</Link> : <span className="font-semibold text-ink">{r.c.n}</span>);

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: base, label: title }, { href: `${base}/characters`, label: "Characters" }]}
        eyebrow="📏 Character stats"
        title={<>{title} characters: <span className="text-gradient">ages, heights &amp; birthdays</span></>}
        subtitle={`The ${rows.length} most popular ${title} characters, with how old and how tall each one is, their birthday and who voices them.`}
        facts={[{ value: String(rows.length), label: "characters" }, ...(tall.length ? [{ value: `${tall.length}`, label: "heights listed" }] : [])]}
        hue={300}
        backdrop={anime?.cover?.large || null}
        posters={rows.slice(0, 3).map((r) => snapImage(r.c, "large"))}
      />

      {stats.length > 0 && <section className="reveal mt-10"><StatTiles stats={stats} /></section>}

      <section className="reveal mt-10" aria-labelledby="table-h">
        <h2 id="table-h" className="h-section mb-3">Every character at a glance</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="p-3 font-semibold">Character</th>
                <th scope="col" className="p-3 font-semibold">Age</th>
                <th scope="col" className="p-3 font-semibold">Height</th>
                <th scope="col" className="p-3 font-semibold">Birthday</th>
                <th scope="col" className="p-3 font-semibold">Japanese voice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {rows.map((r) => (
                <tr key={r.c.id}>
                  <th scope="row" className="p-3 text-left font-normal">
                    <span className="flex items-center gap-3">
                      <span className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-bg-2">{snapImage(r.c) && <Image src={snapImage(r.c)!} alt="" fill sizes="36px" className="object-cover" />}</span>
                      <Name r={r} />
                    </span>
                  </th>
                  <td className="p-3 tabular-nums">{ageText(r.age) ?? <span className="text-muted">–</span>}</td>
                  <td className="p-3 tabular-nums">{r.cm ? `${r.cm} cm` : <span className="text-muted">–</span>}</td>
                  <td className="p-3">{r.c.m && r.c.d ? <><Link href={bdPath(r.c.m, r.c.d)} className="text-violet hover:underline">{bdLabel(r.c.m, r.c.d)}</Link> <span className="text-xs text-muted">{zodiac(r.c.m, r.c.d)}</span></> : <span className="text-muted">–</span>}</td>
                  <td className="p-3">{r.c.jp ? <Link href={vaPath({ id: r.c.jp.id, name: r.c.jp.n })} className="text-violet hover:underline">{r.c.jp.n}</Link> : <span className="text-muted">–</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Ages and heights as listed on AniList; where a character grows up during the story, height is the latest one listed. Updated {snapGenerated}.</p>
      </section>

      {tall.length >= 3 && (
        <section className="reveal mt-10" aria-labelledby="heights-h">
          <h2 id="heights-h" className="h-section mb-3">{title} height chart</h2>
          <BarChart
            orientation="bar"
            title={`${title} characters by height`}
            subtitle="Tallest first, in cm"
            valueHeading="Height (cm)"
            labelKeys={[String(tall[0].c.id), String(tall[tall.length - 1].c.id)]}
            data={tall.slice(0, 20).map((r) => ({ key: String(r.c.id), label: r.c.n, value: r.cm!, display: `${r.cm} cm` }))}
          />
        </section>
      )}

      <AdSlot slot="characters-mid" />

      {bdays.length >= 3 && (
        <section className="reveal mt-10" aria-labelledby="bd-h">
          <h2 id="bd-h" className="h-section mb-3">{title} birthdays through the year</h2>
          <ul className="flex flex-wrap gap-2">
            {bdays.map((r) => <li key={r.c.id}><Link href={bdPath(r.c.m!, r.c.d!)} className="chip">🎂 {bdLabel(r.c.m!, r.c.d!)} · {r.c.n}</Link></li>)}
          </ul>
        </section>
      )}

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href={base} className="chip">{title} overview</Link>
        <Link href={`${base}/cast`} className="chip">Full cast &amp; voice actors</Link>
        <Link href="/characters" className="chip">👤 Most popular characters</Link>
      </p>

      <Faq
        title={`${title} characters FAQ`}
        items={[
          ...(tall.length >= 2 ? [
            { q: `Who is the tallest character in ${title}?`, a: `${tall[0].c.n}, at ${tall[0].cm} cm${tall[1] ? `, followed by ${tall[1].c.n} (${tall[1].cm} cm)` : ""}.` },
            { q: `Who is the shortest character in ${title}?`, a: `${tall[tall.length - 1].c.n}, at ${tall[tall.length - 1].cm} cm, among the characters with a listed height.` },
          ] : []),
          ...(aged.length >= 2 ? [
            { q: `Who is the youngest character in ${title}?`, a: `${aged[0].c.n}, listed as ${ageText(aged[0].age)}.` },
            { q: `How old are the main ${title} characters?`, a: `${rows.filter((r) => r.age).slice(0, 5).map((r) => `${r.c.n} is ${ageText(r.age)}`).join(", ")}.` },
          ] : []),
          ...(bdays.length ? [{ q: `When are the ${title} characters' birthdays?`, a: `${bdays.slice(0, 6).map((r) => `${r.c.n}: ${bdLabel(r.c.m!, r.c.d!)}`).join("; ")}${bdays.length > 6 ? `; and ${bdays.length - 6} more on this page` : ""}.` }] : []),
        ]}
      />
    </div>
  );
}
