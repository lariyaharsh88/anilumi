import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { BLOOD_TYPES, charactersByBloodType, characterPathFor, snapImage } from "@/lib/charsnap";
import { animePath } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import BarChart from "@/components/viz/BarChart";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Anime Character Blood Types: A, B, O and AB Lists",
  description: fitDescription("Which anime characters share your blood type? Popular characters with official blood types A, B, O and AB, from AniList profiles, with how common each type is."),
  alternates: { canonical: "/characters/blood-type" },
};

export default function BloodTypes() {
  const groups = BLOOD_TYPES.map((t) => ({ t, chars: charactersByBloodType(t) }));
  const total = groups.reduce((n, g) => n + g.chars.length, 0);
  const top = [...groups].sort((a, b) => b.chars.length - a.chars.length)[0];
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/characters", label: "Characters" }, { href: "/characters/blood-type", label: "Blood types" }]}
        eyebrow="🩸 Blood types"
        title={<>Anime characters <span className="text-gradient">by blood type</span></>}
        subtitle={`${total} popular characters have an official blood type. Pick yours to see who shares it.`}
        facts={groups.map((g) => ({ value: String(g.chars.length), label: `type ${g.t.toUpperCase()}` }))}
        hue={350}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <section key={g.t} className="card p-4" aria-labelledby={`bt-${g.t}`}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id={`bt-${g.t}`} className="font-bold"><Link href={`/characters/blood-type/${g.t}`} className="hover:text-violet-2">Blood type {g.t.toUpperCase()}</Link> <span className="text-sm font-normal text-muted">({g.chars.length})</span></h2>
              <Link href={`/characters/blood-type/${g.t}`} className="shrink-0 text-xs text-violet hover:underline">All →</Link>
            </div>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {g.chars.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={characterPathFor(c.id) ?? animePath({ slug: c.s })} className="group block" title={`${c.n} (${c.t})`}>
                    <span className="relative block aspect-square overflow-hidden rounded-lg bg-bg-2">{snapImage(c) && <Image src={snapImage(c)!} alt={c.n} fill sizes="80px" className="object-cover object-top" />}</span>
                    <span className="mt-1 block truncate text-[11px] font-medium text-ink/85 group-hover:text-violet-2">{c.n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-8">
        <BarChart orientation="bar" title="How common each blood type is among popular characters" subtitle="Characters with an official blood type on AniList" valueHeading="Characters" data={groups.map((g) => ({ key: g.t, label: `Type ${g.t.toUpperCase()}`, value: g.chars.length, display: `${g.chars.length} (${Math.round((g.chars.length / total) * 100)}%)`, href: `/characters/blood-type/${g.t}` }))} />
      </div>
      <Faq title="Anime blood types FAQ" items={[
        { q: "What is the most common blood type among anime characters?", a: `Type ${top.t.toUpperCase()}: ${top.chars.length} of the ${total} popular characters with an official blood type.` },
        { q: "Why do anime characters have blood types?", a: "In Japan, blood type (ketsueki-gata) is a popular way to talk about personality, much like zodiac signs elsewhere, so official character profiles often list it. There's no scientific evidence that blood type shapes personality." },
      ]} />
    </div>
  );
}
