import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import SectionNav from "@/components/fx/SectionNav";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { animeBySlugs, posterUrl } from "@/lib/kitsu";
import { dubPageEntry, hindiDubPath } from "@/lib/hindidub";
import { streamsBySlug, streamsPath } from "@/lib/streams";
import data from "@/data/describe-anime.json";

export const revalidate = 86400;

/**
 * "What anime is this?" by description, for when there's no screenshot to search: the ways people describe a show
 * they can't name ("a guy eats a fruit and turns to rubber", "a notebook that kills"), each with the answer and the
 * detail that gives it away. Each description gets almost no searches on its own, but together they're what people
 * ask ChatGPT and Copilot, which cite /what-anime-is-this 1.5K times (Bing AI Performance, Nov 2026). Data in
 * data/describe-anime.json.
 */
type Entry = { q: string; t: string; kitsu: string; group: string; clue: string; sources: string[] };
const D = data as { checked: string; groups: { id: string; label: string }[]; entries: Entry[] };
const PATH = "/what-anime-is-this/describe";
const day = new Date(`${D.checked}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const metadata: Metadata = {
  title: fitTitle([`What Anime Is This? Find It by Description (${D.entries.length} Plots & Scenes)`, "What Anime Is This? Find an Anime by Description", "Find an Anime by Description"]),
  description: fitDescription(`Can't remember the name? ${D.entries.length} anime people describe without the title, from "a guy eats a fruit and turns to rubber" to "a notebook that kills", with the answer, the detail that gives it away and where to watch it.`),
  alternates: { canonical: PATH },
};

export default async function DescribeAnime() {
  const kitsu = await animeBySlugs(D.entries.map((e) => e.kitsu), true).catch(() => new Map());
  const groups = D.groups.map((g) => ({ ...g, entries: D.entries.filter((e) => e.group === g.id) })).filter((g) => g.entries.length);
  const href = (e: Entry) => `/anime/${e.kitsu}`;
  const faq: FaqItem[] = [
    { q: "How do I find an anime if I only remember the story?", a: `Check the descriptions on this page first: they cover the ${D.entries.length} shows people most often describe without the name. If you have a screenshot or a clip, the screenshot search finds the exact episode and minute.` },
    ...["one-piece", "death-note", "attack-on-titan", "jujutsu-kaisen", "tensei-shitara-slime-datta-ken", "kimi-no-na-wa"].flatMap((s) => {
      const e = D.entries.find((x) => x.kitsu === s);
      return e ? [{ q: `What anime is it where ${e.q.charAt(0).toLowerCase()}${e.q.slice(1)}?`, a: `${e.t}. ${e.clue}` }] : [];
    }),
    { q: "What if my anime isn't on this list?", a: "Upload a screenshot to the screenshot search, which matches it against thousands of episodes. Without one, the genre pages and the seasonal charts are the quickest way to browse by year and type." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Find an anime by description", D.entries.map((e) => ({ url: href(e), name: e.t })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/what-anime-is-this", label: "What anime is this?" }, { href: PATH, label: "By description" }]}
        eyebrow="🔎 Find an anime"
        title={<>What anime is this? <span className="text-gradient">Find it by description</span></>}
        subtitle="The ways people describe an anime they can't name, and the answer for each, with the detail that gives it away. No screenshot needed."
        facts={[
          { value: String(D.entries.length), label: "descriptions" },
          { value: String(groups.length), label: "kinds" },
        ]}
        hue={265}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/what-anime-is-this" className="chip">📸 Search by screenshot</Link>
          <Link href="/overpowered-mc-anime" className="chip">Anime with an overpowered MC</Link>
          <Link href="/what-anime-should-i-watch" className="chip">What should I watch?</Link>
        </p>
      </PageHero>

      <AnswerLead checked={day}>
        Find the line that sounds like what you remember: each one names the anime and the detail that gives it away. A
        guy whose body turns to rubber is One Piece; a notebook that kills is Death Note; a boy who eats a cursed finger is
        Jujutsu Kaisen. If you have a screenshot, the <Link href="/what-anime-is-this" className="text-violet hover:underline">screenshot search</Link> finds the exact episode.
      </AnswerLead>

      <SectionNav sections={[...groups.map((g) => ({ id: g.id, label: g.label })), { id: "faq", label: "FAQ" }]} />

      {groups.map((g) => (
        <section key={g.id} id={g.id} data-section className="reveal pt-10" aria-labelledby={`${g.id}-h`}>
          <h2 id={`${g.id}-h`} className="h-section mb-4">{g.label}</h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {g.entries.map((e) => {
              const a = kitsu.get(e.kitsu);
              const img = a ? posterUrl(a, "tiny") : null;
              const hindi = dubPageEntry(e.kitsu);
              const streams = streamsBySlug(e.kitsu);
              return (
                <li key={e.kitsu + e.q} className="card flex gap-3 p-3">
                  <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-bg-2">{img && <Image src={img} alt={`${e.t} poster`} fill sizes="56px" className="object-cover" />}</span>
                  <span className="min-w-0">
                    <h3 className="text-sm text-muted">&ldquo;{e.q}&rdquo;</h3>
                    <p className="mt-1 font-semibold text-ink">→ <Link href={href(e)} className="hover:text-violet-2">{e.t}</Link></p>
                    <p className="mt-0.5 text-sm text-ink/80">{e.clue}</p>
                    {(streams || hindi) && (
                      <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
                        {streams && <Link href={streamsPath(e.kitsu)} className="text-violet hover:underline">Where to watch</Link>}
                        {hindi && <Link href={hindiDubPath(e.kitsu)} className="text-violet hover:underline">In Hindi</Link>}
                      </p>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="card mt-10 p-4 text-sm">📸 <strong>Have a screenshot or a clip?</strong> The <Link href="/what-anime-is-this" className="text-violet hover:underline">screenshot search</Link> finds the anime, the episode and the minute, then where to watch it in India and whether it&rsquo;s in Hindi.</p>
      <MadeBy className="mt-6" method="Each answer is a well-documented premise, checked against the show's Wikipedia article; the descriptions are written the way people ask for them." date={D.checked} />
      <div id="faq" data-section className="pt-2"><Faq title="Find an anime by description: FAQ" items={faq} /></div>
    </div>
  );
}
