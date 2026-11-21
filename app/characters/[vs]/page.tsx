import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import CharacterCompare from "@/components/CharacterCompare";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { CHARACTER_VS, characterVs, vsPath, vsSides, type VsSide } from "@/lib/charvs";

export const revalidate = 86400;
export const dynamicParams = false;
export const generateStaticParams = () => CHARACTER_VS.map((v) => ({ vs: v.slug }));

type Props = { params: Promise<{ vs: string }> };

async function load(params: Props["params"]) {
  const v = characterVs((await params).vs);
  const sides = v ? vsSides(v) : null;
  if (!v || !sides) notFound();
  return { v, sides };
}

const cm = (n: number | null) => (n ? `${n} cm` : "not listed");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { v, sides: [a, b] } = await load(params);
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
  const faq: FaqItem[] = [
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
        subtitle={`${a.row.name} (${a.row.series}) and ${b.row.name} (${b.row.series}) side by side: height, age, birthday, voice actors, popularity and what each can do.`}
        facts={[
          ...(a.row.heightCm ? [{ value: cm(a.row.heightCm), label: `${v.an}'s height` }] : []),
          ...(b.row.heightCm ? [{ value: cm(b.row.heightCm), label: `${v.bn}'s height` }] : []),
        ]}
        posters={[a.row.image, b.row.image]}
        hue={30}
      />
      <p className="mt-5 max-w-3xl text-base leading-7 text-ink/90">
        Who would win between {v.an} and {v.bn} has no official answer: they come from different series and have only met in {v.together ?? "fan works"}. What can be compared is below, from the same AniList facts and checked notes as their character pages.
      </p>

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
