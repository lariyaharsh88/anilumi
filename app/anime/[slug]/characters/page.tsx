import { fitDescription, fitTitle } from "@/lib/titles";
import type { Metadata } from "next";
import { robotsFor, characterTableIndexed, SEARCHED_CHARACTER_TABLES } from "@/lib/indexing";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAnimeBySlug, animePath } from "@/lib/kitsu";
import { characterTable, snapImage, snapGenerated, type TableRow } from "@/lib/charsnap";
import { zodiac } from "@/lib/charfacts";
import { bdLabel, bdPath } from "@/lib/birthdays";
import { vaPath } from "@/lib/anilist";
import PageHero from "@/components/PageHero";
import { pageAbout, itemList } from "@/lib/ld";
import JsonLd from "@/components/JsonLd";
import StatTiles from "@/components/viz/StatTiles";
import BarChart from "@/components/viz/BarChart";
import StackedBar from "@/components/viz/StackedBar";
import CharacterCompare from "@/components/CharacterCompare";
import { compareRow } from "@/lib/charcompare";
import { mostPopular, genderMix, teams, matchups, bounties, traits } from "@/lib/castpage";
import { bountyFigure } from "@/lib/bounties";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import AnswerLead from "@/components/AnswerLead";
import { notedCast, shortRole, debutInShow, characterNote } from "@/lib/charnotes";
import { roleIn } from "@/lib/seriessnap";

// Built from the monthly character snapshot; Kitsu is only asked for the backdrop.
export const revalidate = 604800;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

const ageText = (a: string | null) => (a ? a.replace(/-$/, "+") : null); // "15-" in AniList means "15 and up"
const charPath = (r: TableRow) => (r.c.k ? `/character/${r.c.k}` : null);
// The checked name where we have one ("Sung Jin-Woo", not AniList's "Jin-U Seong").
const shown = (r: TableRow) => (r.c.k ? characterNote(r.c.k)?.name : null) ?? r.c.n;
const fans = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");

function load(slug: string) {
  // Searched shows get their list even when AniList has few ages or heights (Pokémon), for the main cast.
  const s = decodeURIComponent(slug);
  const rows = characterTable(s) ?? (s in SEARCHED_CHARACTER_TABLES ? characterTable(s, undefined, undefined, 0) : null);
  if (!rows) notFound();
  const title = rows[0].c.t;
  const tall = rows.filter((r) => r.cm).sort((a, b) => b.cm! - a.cm!);
  const aged = rows.filter((r) => r.ageN !== null).sort((a, b) => a.ageN! - b.ageN!);
  // The name people search the show's characters by ("Demon Slayer", not "Kimetsu no Yaiba"), and its main cast.
  const name = SEARCHED_CHARACTER_TABLES[decodeURIComponent(slug)]?.name ?? title;
  // Protagonists first, then AniList's main roles, then the rest, each by popularity: "the main characters are Eren,
  // Mikasa, Armin…" reads as people expect.
  const noted = notedCast(rows);
  const rank = (m: (typeof noted)[number]) => (/^protagonist/i.test(m.note.role ?? "") ? 0 : roleIn(m.c.s, m.c.id) === "main" ? 1 : 2);
  const cast = [...noted].sort((a, b) => rank(a) - rank(b));
  return { rows, title, name, tall, aged, cast: cast.length >= 3 ? cast : [] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { rows, name, cast, tall, aged } = load(slug);
  // Pokémon's cast has almost no ages or heights on AniList, so its title doesn't promise them.
  const fewStats = tall.length < 3 && aged.length < 3;
  const lead = rows.slice(0, 3).map((r) => `${shown(r)} (${[ageText(r.age), r.cm && `${r.cm} cm`].filter(Boolean).join(", ") || "profile"})`).join(", ");
  return {
    title: cast.length
      ? fitTitle([...(fewStats ? [`${name} Characters: Main Cast & Who They Are`] : []), `${name} Characters: Main Cast, Ages, Heights & Birthdays`, `${name} Characters: Main Cast, Ages & Heights`, `${name} Characters: Main Cast & Ages`, `${name} Characters`])
      : `${name} Characters: Ages, Heights & Birthdays`,
    description: fitDescription(cast.length
      ? `Who the main ${name} characters are (${list(cast.slice(0, 3).map((m) => m.note.name))}), plus ages, heights, birthdays and voice actors of ${rows.length} characters.`
      : `How old and how tall are the ${name} characters? Ages, heights, birthdays and voice actors of ${rows.length} characters: ${lead} and more, with a height chart.`),
    alternates: { canonical: `/anime/${slug}/characters` },
    robots: robotsFor(characterTableIndexed(slug)),
  };
}

export default async function CharactersTable({ params }: Props) {
  const { slug } = await params;
  const { rows, title, name, tall, aged, cast } = load(slug);
  const anime = await getAnimeBySlug(decodeURIComponent(slug)).catch(() => null);
  const base = animePath({ slug });
  const bdays = rows.filter((r) => r.c.m && r.c.d).sort((a, b) => a.c.m! - b.c.m! || a.c.d! - b.c.d!);
  const stats = [
    ...(tall.length >= 2 ? [{ label: "Tallest", value: `${tall[0].cm} cm`, sub: shown(tall[0]) }, { label: "Shortest", value: `${tall[tall.length - 1].cm} cm`, sub: shown(tall[tall.length - 1]) }] : []),
    ...(aged.length >= 2 ? [{ label: "Youngest", value: ageText(aged[0].age)!, sub: shown(aged[0]), still: true }, { label: "Oldest", value: ageText(aged[aged.length - 1].age)!, sub: shown(aged[aged.length - 1]), still: true }] : []),
  ];
  const popular = mostPopular(rows), mix = genderMix(rows), groups = teams(rows), vs = matchups(rows), wanted = bounties(rows);
  const agesChart = aged.filter((r) => r.ageN! < 200).reverse();
  const withEn = rows.filter((r) => r.c.en).length >= 3;
  // Compare tabs: the main cast (checked notes) and the most popular, without repeating an identical set.
  const compareTabs = [
    ...(cast.length >= 2 ? [{ key: "main", label: "Main cast", rows: cast.slice(0, 8).map((m) => compareRow(m.c)) }] : []),
    { key: "popular", label: "Most popular", rows: popular.slice(0, 8).map((r) => compareRow(r.c)) },
  ];
  if (popular[0]) stats.unshift({ label: "Most popular", value: `${fans(popular[0].c.f)} fans`, sub: shown(popular[0]) });
  const Name = ({ r }: { r: TableRow }) => (charPath(r) ? <Link href={charPath(r)!} className="font-semibold text-ink hover:text-violet-2 hover:underline">{shown(r)}</Link> : <span className="font-semibold text-ink">{shown(r)}</span>);

  return (
    <div className="container-x pb-8">
      {anime && <JsonLd data={pageAbout(anime, `${base}/characters`, `${name} characters: ages, heights & birthdays`)} />}
      <JsonLd data={itemList(`${name} characters`, rows.flatMap((r) => (charPath(r) ? [{ url: charPath(r)!, name: shown(r) }] : [])))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: base, label: title }, { href: `${base}/characters`, label: "Characters" }]}
        eyebrow="📏 Character stats"
        title={<>{name} characters: <span className="text-gradient">{cast.length ? "main cast, ages & heights" : "ages, heights & birthdays"}</span></>}
        subtitle={`${cast.length ? `Who the main ${name} characters are, and the` : "The"} ${rows.length} most popular ${name} characters with how old and how tall each one is, their birthday and who voices them.`}
        facts={[{ value: String(rows.length), label: "characters" }, ...(tall.length ? [{ value: `${tall.length}`, label: "heights listed" }] : [])]}
        hue={300}
        backdrop={anime?.cover?.large || null}
        posters={rows.slice(0, 3).map((r) => snapImage(r.c, "large"))}
      />

      {cast.length > 0 && (
        <AnswerLead>
          The main {name} characters are {list(cast.slice(0, 6).map((m) => m.note.name))}. Below are {rows.length} characters with their ages, heights, birthdays and Japanese voice actors.
        </AnswerLead>
      )}

      {cast.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="main-h">
          <h2 id="main-h" className="h-section mb-1">Main {name} characters and who they are</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">Protagonists first, then by popularity. Roles and first appearances are checked against the series wiki and Wikipedia; no spoilers.</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cast.map((m) => (
              <li key={m.c.id} className="card flex gap-3 p-3">
                <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-bg-2">{snapImage(m.c) && <Image src={snapImage(m.c)!} alt={m.note.name} fill sizes="56px" className="object-cover" />}</span>
                <div className="min-w-0 text-sm">
                  <Link href={charPath(m)!} className="font-semibold text-ink hover:text-violet-2 hover:underline">{m.note.name}</Link>
                  {m.note.role && <p className="mt-0.5 leading-5 text-ink/85">{m.note.role}</p>}
                  {m.note.affiliations.length > 0 && <p className="mt-1 text-xs text-muted">{m.note.affiliations.slice(0, 3).join(" · ")}</p>}
                  {m.note.debut?.episode && debutInShow(m.note, title, name) && <p className="mt-1 text-xs text-muted">First appears: episode {m.note.debut.episode}</p>}
                  {traits(m.c.k).length > 0 && <p className="mt-1.5 flex flex-wrap gap-1">{traits(m.c.k).map((t) => <span key={t} className="rounded-full bg-violet/10 px-2 py-0.5 text-[11px] text-ink/85">{t}</span>)}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.length > 0 && <section className="reveal mt-10"><StatTiles stats={stats} /></section>}

      <section className="reveal mt-10" aria-labelledby="compare-h">
        <h2 id="compare-h" className="h-section mb-1">Compare the {name} characters</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">Side by side on age, height, birthday, popularity and voices. Untick a character to drop them, or sort by who&apos;s tallest or oldest.</p>
        <CharacterCompare tabs={compareTabs} />
      </section>

      <section className="reveal mt-10 grid gap-4 lg:grid-cols-2" aria-labelledby="popular-h">
        <div>
          <h2 id="popular-h" className="h-section mb-3">Most popular {name} characters</h2>
          <BarChart
            orientation="bar"
            title={`${name} characters by fans`}
            subtitle="AniList favourites"
            valueHeading="Favourites"
            integer
            labelKeys={[String(popular[0].c.id)]}
            data={popular.map((r) => ({ key: String(r.c.id), label: shown(r), value: r.c.f, display: `${r.c.f.toLocaleString("en-US")} favourites`, ...(charPath(r) ? { href: charPath(r)! } : {}) }))}
          />
        </div>
        {mix && (
          <div className="lg:pt-12">
            <StackedBar title={`Men and women among the ${rows.length} characters`} subtitle="Gender as listed on AniList" unit="characters" segments={mix} />
          </div>
        )}
      </section>

      {groups.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="teams-h">
          <h2 id="teams-h" className="h-section mb-3">{name} characters by team</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.slice(0, 6).map((g) => (
              <div key={g.name} className="card p-4">
                <p className="font-semibold text-ink">{g.name} <span className="text-sm font-normal text-muted">· {g.rows.length}</span></p>
                <ul className="mt-2 flex flex-wrap gap-1.5 text-sm">{g.rows.map((r) => <li key={r.c.id}>{charPath(r) ? <Link href={charPath(r)!} className="chip">{shown(r)}</Link> : <span className="chip">{shown(r)}</span>}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {wanted.length >= 3 && (
        <section className="reveal mt-10" aria-labelledby="bounty-h">
          <h2 id="bounty-h" className="h-section mb-1">{name} bounties</h2>
          <p className="mb-3 max-w-3xl text-sm text-muted">Each character&apos;s latest bounty that isn&apos;t a spoiler; the full history is on their page. <Link href="/one-piece-bounties" className="text-violet hover:underline">Every One Piece bounty, ranked →</Link></p>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted"><tr className="border-b border-line"><th scope="col" className="p-3 font-semibold">Character</th><th scope="col" className="p-3 font-semibold">Bounty (berries)</th><th scope="col" className="p-3 font-semibold">After</th></tr></thead>
              <tbody className="divide-y divide-line/60">
                {wanted.map(({ row, bounty }) => <tr key={row.c.id}><th scope="row" className="p-3 text-left font-normal"><Name r={row} /></th><td className="p-3 tabular-nums">{bountyFigure(bounty.amount)}</td><td className="p-3 text-muted">{bounty.arc} arc</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
                {withEn && <th scope="col" className="p-3 font-semibold">English voice</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {rows.map((r) => (
                <tr key={r.c.id}>
                  <th scope="row" className="p-3 text-left font-normal">
                    <span className="flex items-center gap-3">
                      <span className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md bg-bg-2">{snapImage(r.c) && <Image src={snapImage(r.c)!} alt={shown(r)} fill sizes="36px" className="object-cover" />}</span>
                      <Name r={r} />
                    </span>
                  </th>
                  <td className="p-3 tabular-nums">{ageText(r.age) ?? <span className="text-muted">–</span>}</td>
                  <td className="p-3 tabular-nums">{r.cm ? `${r.cm} cm` : <span className="text-muted">–</span>}</td>
                  <td className="p-3">{r.c.m && r.c.d ? <><Link href={bdPath(r.c.m, r.c.d)} className="text-violet hover:underline">{bdLabel(r.c.m, r.c.d)}</Link> <span className="text-xs text-muted">{zodiac(r.c.m, r.c.d)}</span></> : <span className="text-muted">–</span>}</td>
                  <td className="p-3">{r.c.jp ? <Link href={vaPath({ id: r.c.jp.id, name: r.c.jp.n })} className="text-violet hover:underline">{r.c.jp.n}</Link> : <span className="text-muted">–</span>}</td>
                  {withEn && <td className="p-3">{r.c.en ? <Link href={vaPath({ id: r.c.en.id, name: r.c.en.n })} className="text-violet hover:underline">{r.c.en.n}</Link> : <span className="text-muted">–</span>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Ages and heights as listed on AniList; where a character grows up during the story, height is the latest one listed. Updated {snapGenerated}.</p>
      </section>

      {tall.length >= 3 && (
        <section className="reveal mt-10" aria-labelledby="heights-h">
          <h2 id="heights-h" className="h-section mb-3">{name} height chart</h2>
          <BarChart
            orientation="bar"
            title={`${name} characters by height`}
            subtitle="Tallest first, in cm"
            valueHeading="Height (cm)"
            labelKeys={[String(tall[0].c.id), String(tall[tall.length - 1].c.id)]}
            data={tall.slice(0, 20).map((r) => ({ key: String(r.c.id), label: shown(r), value: r.cm!, display: `${r.cm} cm` }))}
          />
        </section>
      )}

      {agesChart.length >= 5 && (
        <section className="reveal mt-10" aria-labelledby="ages-h">
          <h2 id="ages-h" className="h-section mb-3">How old are the {name} characters?</h2>
          <BarChart
            orientation="bar"
            title={`${name} characters by age`}
            subtitle="Oldest first; the highest age listed"
            valueHeading="Age"
            integer
            labelKeys={[String(agesChart[0].c.id), String(agesChart[agesChart.length - 1].c.id)]}
            data={agesChart.slice(0, 20).map((r) => ({ key: String(r.c.id), label: shown(r), value: r.ageN!, display: ageText(r.age)! }))}
          />
        </section>
      )}

      <AdSlot slot="characters-mid" />

      {bdays.length >= 3 && (
        <section className="reveal mt-10" aria-labelledby="bd-h">
          <h2 id="bd-h" className="h-section mb-3">{name} birthdays through the year</h2>
          <ul className="flex flex-wrap gap-2">
            {bdays.map((r) => <li key={r.c.id}><Link href={bdPath(r.c.m!, r.c.d!)} className="chip">🎂 {bdLabel(r.c.m!, r.c.d!)} · {shown(r)}</Link></li>)}
          </ul>
        </section>
      )}

      {vs.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="vs-h">
          <h2 id="vs-h" className="h-section mb-3">{name} match-ups</h2>
          <ul className="flex flex-wrap gap-2">{vs.map((v) => <li key={v.slug}><Link href={v.href} className="chip">⚔️ {v.an} vs {v.bn}</Link></li>)}</ul>
        </section>
      )}

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href={base} className="chip">{name} overview</Link>
        <Link href={`${base}/cast`} className="chip">Full cast &amp; voice actors</Link>
        <Link href="/characters" className="chip">👤 Most popular characters</Link>
      </p>

      <Faq
        title={`${name} characters FAQ`}
        items={[
          ...(cast.length ? [{ q: `Who are the main characters in ${name}?`, a: `${cast.slice(0, 6).map((m) => `${m.note.name}${shortRole(m.note.role) ? `: ${shortRole(m.note.role)}` : ""}`).join("; ")}.` }] : []),
          ...(popular[1] ? [{ q: `Who is the most popular ${name} character?`, a: `${shown(popular[0])}, with ${popular[0].c.f.toLocaleString("en-US")} favourites on AniList, followed by ${shown(popular[1])} (${popular[1].c.f.toLocaleString("en-US")})${popular[2] ? ` and ${shown(popular[2])} (${popular[2].c.f.toLocaleString("en-US")})` : ""}.` }] : []),
          ...(groups.length ? [{ q: `What teams are the ${name} characters on?`, a: `${groups.slice(0, 5).map((g) => `${g.name} (${list(g.rows.slice(0, 3).map(shown))}${g.rows.length > 3 ? " and others" : ""})`).join("; ")}.` }] : []),
          ...(wanted.length >= 3 ? [{ q: `Who has the highest bounty in ${name}?`, a: `Among bounties that aren't spoilers, ${shown(wanted[0].row)}: ${bountyFigure(wanted[0].bounty.amount)} berries after the ${wanted[0].bounty.arc} arc.` }] : []),
          ...(tall.length >= 2 ? [
            { q: `Who is the tallest character in ${name}?`, a: `${shown(tall[0])}, at ${tall[0].cm} cm${tall[1] ? `, followed by ${shown(tall[1])} (${tall[1].cm} cm)` : ""}.` },
            { q: `Who is the shortest character in ${name}?`, a: `${shown(tall[tall.length - 1])}, at ${tall[tall.length - 1].cm} cm, among the characters with a listed height.` },
          ] : []),
          ...(aged.length >= 2 ? [
            { q: `Who is the youngest character in ${name}?`, a: `${shown(aged[0])}, listed as ${ageText(aged[0].age)}.` },
            { q: `How old are the main ${name} characters?`, a: `${rows.filter((r) => r.age).slice(0, 5).map((r) => `${shown(r)} is ${ageText(r.age)}`).join(", ")}.` },
          ] : []),
          ...(bdays.length ? [{ q: `When are the ${name} characters' birthdays?`, a: `${bdays.slice(0, 6).map((r) => `${shown(r)}: ${bdLabel(r.c.m!, r.c.d!)}`).join("; ")}${bdays.length > 6 ? `; and ${bdays.length - 6} more on this page` : ""}.` }] : []),
        ]}
      />
    </div>
  );
}
