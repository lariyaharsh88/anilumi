import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import CharacterCompare from "@/components/CharacterCompare";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { characterVs, vsPath, vsSides, berries, type VsSide } from "@/lib/charvs";
import { episodePath } from "@/lib/kitsu";

export const revalidate = 86400;
// Rendered on first request like the other content pages (OpenNext 404s build-time pages with dynamicParams = false);
// slugs not in CHARACTER_VS are notFound() in load().
export async function generateStaticParams() { return []; }

type Props = { params: Promise<{ vs: string }> };

async function load(params: Props["params"]) {
  const v = characterVs((await params).vs);
  const sides = v ? vsSides(v) : null;
  if (!v || !sides) notFound();
  return { v, sides };
}

const cm = (n: number | null) => (n ? `${n} cm` : "not listed");
/** "arcs" when a match-up spans two ("Sasuke Recovery Mission and Fourth Shinobi World War"). */
const arcWord = (arc: string) => (/ and /.test(arc) ? "arcs" : "arc");
/** "฿3B", "฿4.61B": short enough for a hero fact. */
const bn = (n: number) => `฿${+(n / 1e9).toFixed(2)}B`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { v, sides: [a, b] } = await load(params);
  if (v.canon) {
    const n = v.canon.bouts.length;
    const animated = v.canon.bouts.some((f) => f.from);
    const ch = v.canon.bouts.find((f) => f.chapters)?.chapters;
    return {
      title: fitTitle(animated
        ? [`${v.an} vs ${v.bn}: Who Wins, Every Fight & Episode`, `${v.an} vs ${v.bn}: Who Wins & Which Episode`, `${v.an} vs ${v.bn}`]
        : [`${v.an} vs ${v.bn}: Who Wins, Which Chapter & Anime Episode`, `${v.an} vs ${v.bn}: Who Wins & Which Chapter`, `${v.an} vs ${v.bn}`]),
      description: fitDescription(animated
        ? `${v.an} vs ${v.bn} in ${a.row.series}'s ${v.canon.arc} ${arcWord(v.canon.arc)}: who wins${n > 1 ? ` each of their ${n} fights` : ""}, with episode numbers, plus height, age${v.bounty ? ", bounty" : ""} and powers side by side.`
        : `${v.an} vs ${v.bn} in ${a.row.series}'s ${v.canon.arc} ${arcWord(v.canon.arc)}: who wins, the manga chapters${ch ? ` (${ch[0]}-${ch[1]})` : ""}, when the anime gets there, and their heights, ages and powers.`),
      alternates: { canonical: vsPath(v) },
    };
  }
  return {
    title: fitTitle([`${v.an} vs ${v.bn}: Height, Age, Powers & Who Would Win`, `${v.an} vs ${v.bn}: Height, Age & Powers Compared`, `${v.an} vs ${v.bn}`]),
    description: fitDescription(a.row.heightCm && b.row.heightCm
      ? `${v.an} vs ${v.bn} side by side: ${a.row.name} is ${cm(a.row.heightCm)} and ${b.row.name} ${cm(b.row.heightCm)}, with ages, birthdays, voice actors, popularity and powers. Who would win has no canon answer.`
      : `${v.an} vs ${v.bn} compared: the age, height, birthday, voice actors, popularity and powers of ${a.row.name} and ${b.row.name}, and who would win.`),
    alternates: { canonical: vsPath(v) },
  };
}

export default async function CharacterVsPage({ params }: Props) {
  const { v, sides } = await load(params);
  const [a, b] = sides;
  const taller = (a.row.heightCm ?? 0) === (b.row.heightCm ?? 0) ? null : (a.row.heightCm ?? 0) > (b.row.heightCm ?? 0) ? a : b;
  const loved = a.row.favourites >= b.row.favourites ? a : b;
  const short = (s: VsSide) => (s === a ? v.an : v.bn);
  const canon = v.canon;
  const bouts = canon?.bouts.map((f) => ({ ...f, eps: f.from ? (f.to ? `episodes ${f.from}–${f.to}` : `episode ${f.from}`) : f.chapters ? `manga chapters ${f.chapters[0]}–${f.chapters[1]} (not animated yet)` : "not animated yet" })) ?? [];
  const richer = v.bounty ? (v.bounty.a >= v.bounty.b ? a : b) : null;
  const faq: FaqItem[] = canon ? [
    { q: `Who wins, ${v.an} or ${v.bn}?`, a: `Spoiler for the ${canon.arc} ${arcWord(canon.arc)}: ${canon.summary}` },
    { q: `What episode does ${v.an} fight ${v.bn}?`, a: [bouts.map((f) => `${f.title}: ${f.eps}.`).join(" "), canon.animeStatus].filter(Boolean).join(" ") },
    ...(v.bounty && richer ? [{ q: `Whose bounty is higher, ${v.an} or ${v.bn}?`, a: `${short(richer)}'s: ${a.row.name}'s latest bounty is ${berries(v.bounty.a)} and ${b.row.name}'s is ${berries(v.bounty.b)}.` }] : []),
    ...(a.row.heightCm && b.row.heightCm ? [{ q: `How tall are ${v.an} and ${v.bn}?`, a: `${a.row.name} is ${cm(a.row.heightCm)} and ${b.row.name} is ${cm(b.row.heightCm)}, as AniList lists them.` }] : []),
    ...(a.row.age && b.row.age ? [{ q: `How old are ${v.an} and ${v.bn}?`, a: `${a.row.name}: ${a.row.age}. ${b.row.name}: ${b.row.age}.` }] : []),
  ] : [
    { q: `Who would win, ${v.an} or ${v.bn}?`, a: `There's no canon answer: ${a.row.series} and ${b.row.series} are separate series, and the two have only met in ${v.together ?? "fan works"}. Fans argue both ways. ${a.abilities ?? ""} ${b.abilities ?? ""}`.replace(/\s+/g, " ").trim() },
    ...(a.row.heightCm && b.row.heightCm ? [{ q: `Who is taller, ${v.an} or ${v.bn}?`, a: taller ? `${short(taller)}: ${a.row.name} is ${cm(a.row.heightCm)} and ${b.row.name} is ${cm(b.row.heightCm)}, as AniList lists them.` : `They're the same height, ${cm(a.row.heightCm)}.` }] : []),
    ...(a.row.age && b.row.age ? [{ q: `How old are ${v.an} and ${v.bn}?`, a: `${a.row.name}: ${a.row.age}. ${b.row.name}: ${b.row.age}. Both age over their stories; each character page has their ages through the series.` }] : []),
    { q: `Who is more popular, ${v.an} or ${v.bn}?`, a: `On AniList, ${loved.row.name} has more fans who list them as a favourite: ${loved.row.favourites.toLocaleString("en-IN")} against ${(loved === a ? b : a).row.favourites.toLocaleString("en-IN")}.` },
    ...(v.together ? [{ q: `Have ${v.an} and ${v.bn} ever met?`, a: `Only in ${v.together}.` }] : []),
  ];
  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", vsPath(v), `${v.an} vs ${v.bn}`)} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/characters", label: "Characters" }, { href: vsPath(v), label: `${v.an} vs ${v.bn}` }]}
        eyebrow="⚖️ Character match-up"
        title={<>{v.an} <span className="text-gradient">vs</span> {v.bn}</>}
        subtitle={canon
          ? `${a.row.name} and ${b.row.name} in ${a.row.series}: who wins${bouts.length > 1 ? " each fight" : ""} and ${bouts.some((f) => f.from) ? "the episodes to watch" : "which manga chapters"}, then height, age, voice actors and what each can do.`
          : `${a.row.name} (${a.row.series}) and ${b.row.name} (${b.row.series}) side by side: height, age, birthday, voice actors, popularity and what each can do.`}
        facts={[
          ...(a.row.heightCm ? [{ value: cm(a.row.heightCm), label: `${v.an}'s height` }] : []),
          ...(b.row.heightCm ? [{ value: cm(b.row.heightCm), label: `${v.bn}'s height` }] : []),
          ...(v.bounty ? [{ value: bn(v.bounty.a), label: `${v.an}'s bounty` }, { value: bn(v.bounty.b), label: `${v.bn}'s bounty` }] : []),
        ]}
        posters={[a.row.image, b.row.image]}
        hue={30}
      />
      {canon ? (
        <>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ink/90">
            {v.an} and {v.bn} fight {bouts.length > 1 ? `${bouts.length} times` : "one long duel"} in the {canon.arc} {arcWord(canon.arc)}. The result{bouts.length > 1 ? " and every fight" : ""}, with {bouts.some((f) => f.from) ? "the episodes to watch" : "the manga chapters"}, {bouts.length > 1 ? "are" : "is"} under the spoiler toggle; their facts and powers are compared below it.
          </p>
          {canon.animeStatus && <p className="mt-3 max-w-3xl rounded-xl border border-line bg-white/[.03] p-3 text-sm text-ink/85"><span aria-hidden className="mr-1.5">📺</span>{canon.animeStatus}</p>}
          <section className="reveal mt-6" aria-labelledby="fights-h">
            <h2 id="fights-h" className="h-section mb-3">Who wins: {bouts.length > 1 ? "every fight" : "the fight"}</h2>
            <details className="group rounded-xl border border-dashed border-line bg-white/[.02] p-4 open:border-solid">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ink"><span aria-hidden className="mr-1.5">🔒</span>Who wins and how <span className="font-normal text-muted group-open:hidden">· spoilers for the {canon.arc} {arcWord(canon.arc)}, tap to show</span></summary>
              <p className="mt-3 text-sm leading-6 text-ink/90">{canon.summary}</p>
              <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                {bouts.map((f) => (
                  <li key={f.title} className="card flex flex-col p-3">
                    <p className="font-semibold text-ink">{f.title}</p>
                    <p className="mt-1 flex-1 text-sm text-ink/85">{f.result}</p>
                    {f.animeSlug && f.from
                      ? <Link href={episodePath({ slug: f.animeSlug }, f.from)} className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-violet/15 px-2.5 py-0.5 text-xs font-semibold text-violet-2 hover:bg-violet/25">▶ {f.to ? `Episodes ${f.from}–${f.to}` : `Episode ${f.from}`}</Link>
                      : f.chapters && <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-ink/80">📖 Manga chapters {f.chapters[0]}–{f.chapters[1]}</span>}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted">Checked against {canon.sources.length} sources{bouts.some((f) => f.from) ? ", including the episode list" : ""}.</p>
            </details>
          </section>
        </>
      ) : (
        <p className="mt-5 max-w-3xl text-base leading-7 text-ink/90">
          Who would win between {v.an} and {v.bn} has no official answer: they come from different series and have only met in {v.together ?? "fan works"}. What can be compared is below, from the same AniList facts and checked notes as their character pages.
        </p>
      )}

      <section className="reveal mt-8" aria-labelledby="table-h">
        <h2 id="table-h" className="h-section mb-3">{v.an} and {v.bn} compared</h2>
        <CharacterCompare self={a.row} sameSeries={[b.row]} />
      </section>

      <section className="reveal mt-10" aria-labelledby="powers-h">
        <h2 id="powers-h" className="h-section mb-3">Powers and abilities</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {sides.map((s) => (
            <div key={s.slug} className="card p-4">
              <p className="font-semibold text-ink"><Link href={`/character/${s.slug}`} className="hover:text-accent-2">{s.row.name}</Link></p>
              {s.abilities && <p className="mt-1 text-sm leading-6 text-ink/85">{s.abilities}</p>}
              {s.strength && (
                <details className="group mt-3 rounded-xl border border-dashed border-line bg-white/[.02] p-3 open:border-solid">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-ink"><span aria-hidden className="mr-1.5">🔒</span>How strong {short(s)} gets {s.strength.spoiler && <span className="font-normal text-muted group-open:hidden">· spoilers, tap to show</span>}</summary>
                  <p className="mt-2 text-sm font-semibold text-ink">{s.strength.rank}</p>
                  <p className="mt-1 text-sm leading-6 text-ink/85">{s.strength.summary}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="pt-8"><Faq title={`${v.an} vs ${v.bn}: FAQ`} items={faq} /></div>
    </div>
  );
}
