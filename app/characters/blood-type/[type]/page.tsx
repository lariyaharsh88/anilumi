import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BLOOD_TYPES, charactersByBloodType, characterPathFor, snapImage, snapGenerated, type BloodType, type SnapChar } from "@/lib/charsnap";
import { characterLine } from "@/lib/charlines";
import { animePath } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import MadeBy from "@/components/MadeBy";
import { abs } from "@/lib/site";

// Built from the monthly character snapshot (data/characters.json): no live API calls.
export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ type: string }> };

const label = (bt: BloodType) => bt.toUpperCase();
const href = (c: SnapChar) => characterPathFor(c.id) ?? animePath({ slug: c.s });

function load(type: string) {
  const bt = type.toLowerCase() as BloodType;
  if (type !== bt || !BLOOD_TYPES.includes(bt)) notFound();
  const chars = charactersByBloodType(bt);
  if (!chars.length) notFound();
  return { bt, chars };
}

/** The series with the most characters of this type. */
function topShows(chars: SnapChar[], n = 6) {
  const m = new Map<string, { slug: string; title: string; chars: SnapChar[] }>();
  for (const c of chars) { const g = m.get(c.s) ?? { slug: c.s, title: c.t, chars: [] }; g.chars.push(c); m.set(c.s, g); }
  return [...m.values()].filter((g) => g.chars.length >= 2).sort((a, b) => b.chars.length - a.chars.length).slice(0, n);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bt, chars } = load((await params).type);
  return {
    title: `Anime Characters With Blood Type ${label(bt)} (${chars.length}): ${chars.slice(0, 2).map((c) => c.n).join(", ")} & More`,
    description: fitDescription(`${chars.length} popular anime characters whose official blood type is ${label(bt)}, most-loved first: ${chars.slice(0, 4).map((c) => c.n).join(", ")} and more.`),
    alternates: { canonical: `/characters/blood-type/${bt}` },
  };
}

export default async function BloodTypePage({ params }: Props) {
  const { bt, chars } = load((await params).type);
  const shows = topShows(chars);
  const female = chars.filter((c) => c.g === "Female").length, male = chars.filter((c) => c.g === "Male").length;
  return (
    <div className="container-x pb-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `Anime characters with blood type ${label(bt)}`, itemListElement: chars.slice(0, 50).map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.n, url: abs(href(c)) })) }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/characters", label: "Characters" }, { href: "/characters/blood-type", label: "Blood types" }, { href: `/characters/blood-type/${bt}`, label: `Type ${label(bt)}` }]}
        eyebrow="🩸 Blood type"
        title={<>Anime characters with <span className="text-gradient">blood type {label(bt)}</span></>}
        subtitle={`${chars.length} popular characters whose official profile lists blood type ${label(bt)}, ranked by how many fans favourite them on AniList.`}
        facts={[{ value: String(chars.length), label: "characters" }, { value: String(female), label: "female" }, { value: String(male), label: "male" }]}
        hue={350}
        posters={chars.slice(0, 3).map((c) => snapImage(c, "large"))}
      />
      <MadeBy className="mt-4" method="Blood types come from each character's AniList profile, which follows the official guidebooks and character sheets; we list only A, B, O and AB." />
      <p className="mt-4 flex flex-wrap gap-2 text-sm">{BLOOD_TYPES.map((t) => <Link key={t} href={`/characters/blood-type/${t}`} className={`chip ${t === bt ? "chip-active" : ""}`}>Type {label(t)}</Link>)}</p>

      <section className="reveal mt-8" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-3">Every blood type {label(bt)} character</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chars.map((c, i) => (
            <li key={c.id}>
              <Link href={href(c)} className="card group flex gap-3 p-2.5 transition hover:border-violet/60">
                <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-bg-2">{snapImage(c) && <Image src={snapImage(c)!} alt={c.n} fill sizes="56px" className="object-cover" />}</span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2"><span className="text-xs font-bold tabular-nums text-muted">#{i + 1}</span><span className="truncate font-semibold text-ink group-hover:text-violet-2">{c.n}</span></span>
                  <span className="block truncate text-xs text-muted">{c.t}</span>
                  {characterLine(c.id) && <span className="mt-0.5 block text-xs text-ink/80">{characterLine(c.id)}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {shows.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="shows-h">
          <h2 id="shows-h" className="h-section mb-3">Series with the most type {label(bt)} characters</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {shows.map((s) => <li key={s.slug} className="card p-3 text-sm"><Link href={animePath({ slug: s.slug })} className="font-semibold text-ink hover:text-violet-2">{s.title}</Link><span className="text-muted">: {s.chars.map((c) => c.n).join(", ")}</span></li>)}
          </ul>
        </section>
      )}

      <Faq title={`Blood type ${label(bt)} anime characters FAQ`} items={[
        { q: `Which anime characters have blood type ${label(bt)}?`, a: `${chars.slice(0, 8).map((c) => `${c.n} (${c.t})`).join(", ")}, among ${chars.length} popular characters with type ${label(bt)} on record.` },
        ...(shows[0] ? [{ q: `Which anime has the most blood type ${label(bt)} characters?`, a: `${shows[0].title}, with ${shows[0].chars.length}: ${shows[0].chars.map((c) => c.n).join(", ")}.` }] : []),
        { q: "Why do anime characters have blood types?", a: "In Japan, blood type (ketsueki-gata) is a popular way to talk about personality, much like zodiac signs elsewhere, so official character profiles often list it. There's no scientific evidence that blood type shapes personality." },
        { q: "Where does this list come from?", a: `Each character's AniList profile, refreshed monthly (last update ${snapGenerated}). Characters without an official blood type aren't listed.` },
      ]} />
    </div>
  );
}
