import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { popularCharacters, snapImage, snapGenerated, type SnapChar } from "@/lib/charsnap";
import { animePath } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { abs } from "@/lib/site";

// Built from the monthly snapshot (data/characters.json): no live API calls.
export const revalidate = 86400;
const year = snapGenerated.slice(0, 4);
export const metadata: Metadata = {
  title: `Most Popular Anime Characters (${year}) – Top 100 with Age, Height & Voice Actors`,
  description: "The 100 anime characters fans favourite most on AniList, ranked, plus the most-loved characters of each big series. Every profile has age, height, birthday, zodiac sign and voice actors.",
  alternates: { canonical: "/characters" },
};

const fmt = (n: number) => n.toLocaleString("en-US");
const path = (c: SnapChar) => `/character/${c.k}`;

/** The anime with the most-loved casts: summed favourites of their characters in the top list. */
function byAnime(chars: SnapChar[], shows = 12, per = 6) {
  const m = new Map<string, { slug: string; title: string; total: number; chars: SnapChar[] }>();
  for (const c of chars) {
    const g = m.get(c.s) ?? { slug: c.s, title: c.t, total: 0, chars: [] };
    g.total += c.f;
    g.chars.push(c);
    m.set(c.s, g);
  }
  return [...m.values()].sort((a, b) => b.total - a.total).slice(0, shows).map((g) => ({ ...g, chars: g.chars.slice(0, per) }));
}

export default function CharactersHub() {
  const all = popularCharacters(600);
  const top = all.slice(0, 100);
  const shows = byAnime(all);
  const female = top.find((c) => c.g === "Female");
  const male = top.find((c) => c.g === "Male");
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Most popular anime characters",
    itemListElement: top.slice(0, 50).map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.n, url: abs(path(c)) })),
  };
  return (
    <div className="container-x pb-8">
      <JsonLd data={ld} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/characters", label: "Characters" }]}
        eyebrow="👤 Characters"
        title={<>Most popular <span className="text-gradient">anime characters</span></>}
        subtitle="The characters fans favourite most on AniList. Open anyone for their age, height, birthday, zodiac sign, voice actors and every anime they appear in."
        facts={[{ value: String(top.length), label: "ranked" }, { value: String(shows.length), label: "series" }]}
        hue={300}
        posters={top.slice(0, 3).map((c) => snapImage(c, "large"))}
      />

      <section className="reveal mt-10" aria-labelledby="top-h">
        <h2 id="top-h" className="h-section mb-3">Top 100 characters</h2>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {top.map((c, i) => (
            <li key={c.id}>
              <Link href={path(c)} className="group block">
                <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2 transition group-hover:border-violet/60">
                  {snapImage(c) && <Image src={snapImage(c, "large")!} alt={`${c.n} from ${c.t}`} fill sizes="(max-width:640px) 50vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />}
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-snow">#{i + 1}</span>
                </span>
                <span className="mt-2 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{c.n}</span>
                <span className="block truncate text-xs text-muted">{c.t}</span>
                <span className="block text-[11px] tabular-nums text-muted">♥ {fmt(c.f)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="reveal mt-12" aria-labelledby="series-h">
        <h2 id="series-h" className="h-section mb-1">Most-loved characters by series</h2>
        <p className="mb-4 text-sm text-muted">The anime whose casts fans favourite most, with their top characters.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {shows.map((s) => (
            <div key={s.slug} className="card p-4">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="truncate font-bold"><Link href={animePath({ slug: s.slug })} className="hover:text-violet-2">{s.title}</Link></h3>
                <Link href={`${animePath({ slug: s.slug })}/cast`} className="shrink-0 text-xs text-violet hover:underline">Full cast →</Link>
              </div>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {s.chars.map((c) => (
                  <li key={c.id}>
                    <Link href={path(c)} className="group block" title={c.n}>
                      <span className="relative block aspect-square overflow-hidden rounded-lg bg-bg-2">{snapImage(c) && <Image src={snapImage(c)!} alt={c.n} fill sizes="80px" className="object-cover object-top" />}</span>
                      <span className="mt-1 block truncate text-[11px] font-medium text-ink/85 group-hover:text-violet-2">{c.n}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href="/birthdays" className="chip">🎂 Character birthdays</Link>
        <Link href="/voice-actors" className="chip">🎙️ Popular voice actors</Link>
      </p>

      <Faq
        title="Popular anime characters FAQ"
        items={[
          ...(top[0] ? [{ q: "Who is the most popular anime character?", a: `${top[0].n} from ${top[0].t}, with ${fmt(top[0].f)} favourites on AniList. ${top[1] ? `${top[1].n} (${top[1].t}) and ${top[2]?.n} (${top[2]?.t}) come next.` : ""}` }] : []),
          ...(female ? [{ q: "Who is the most popular female anime character?", a: `${female.n} from ${female.t}, ranked #${top.indexOf(female) + 1} overall with ${fmt(female.f)} favourites.` }] : []),
          ...(male ? [{ q: "Who is the most popular male anime character?", a: `${male.n} from ${male.t}, with ${fmt(male.f)} favourites on AniList.` }] : []),
          ...(shows[0] ? [{ q: "Which anime has the most popular characters?", a: `${shows[0].title}: its characters have the most combined favourites, led by ${shows[0].chars.slice(0, 3).map((c) => c.n).join(", ")}.` }] : []),
          { q: "How is this ranking made?", a: `By the number of AniList members who marked each character as a favourite, refreshed monthly (last update ${snapGenerated}). Only characters with a profile on AniLumi are listed.` },
        ]}
      />
    </div>
  );
}
