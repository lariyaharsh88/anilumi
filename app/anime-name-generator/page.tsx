import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnimeNameTool from "@/components/AnimeNameTool";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { VIBES, exampleName } from "@/lib/animenames";
import { GIVEN, SURNAMES } from "@/lib/jpnames";

export const revalidate = 2592000;

export const metadata: Metadata = {
  title: fitTitle(["Anime Name Generator: Character Names with Kanji & Titles", "Anime Name Generator"]),
  description: fitDescription(`Generate anime character names for heroes, villains, rivals, mages and more: a real Japanese name with kanji and meaning, plus a title and a power. ${SURNAMES.length * GIVEN.length}+ combinations, free.`),
  alternates: { canonical: "/anime-name-generator" },
};

/** Anime character name generator (lib/animenames.ts), with fixed examples per vibe for the crawlable page. */
export default function AnimeNameGenerator() {
  const faq: FaqItem[] = [
    { q: "How does the anime name generator work?", a: "It pairs a real Japanese surname and given name, each with a common kanji spelling and its meaning, with a title and a power that fit the vibe you pick: hero, villain, rival, mage, cute or mysterious." },
    { q: "Are these real Japanese names?", a: `Yes. The ${SURNAMES.length} surnames are among Japan's most common and the ${GIVEN.length} given names are popular modern and classic ones. The titles and powers are made up, the way anime characters' are.` },
    { q: "Can I use these names for my story, game or OC?", a: "Yes. Names can't be owned, and the titles are generic. Check that a name isn't already a famous character's if you want yours to stand out." },
    { q: "Which comes first, the surname or the given name?", a: "In Japan the surname comes first (Uchiha Sasuke); English releases often flip it (Sasuke Uchiha). The generator shows the kanji in Japanese order and the romaji in English order." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", "/anime-name-generator", "Anime name generator")} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/anime-name-generator", label: "Anime name generator" }]}
        eyebrow="🎴 Free tool"
        title={<>Anime <span className="text-gradient">name generator</span></>}
        subtitle="Names for your anime character, OC or story: a real Japanese name with kanji, plus a title and a power that fit the character."
        facts={[{ value: String(VIBES.length), label: "character vibes" }, { value: `${SURNAMES.length * GIVEN.length}+`, label: "name combinations" }, { value: "Free", label: "no sign-up" }]}
        hue={300}
      />

      <section className="reveal mt-8" aria-label="Name generator"><AnimeNameTool /></section>

      <section className="reveal mt-12" aria-labelledby="ex-h">
        <h2 id="ex-h" className="h-section mb-3">Anime name ideas by character type</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VIBES.map((v) => (
            <div key={v.key} className="card p-4">
              <h3 className="font-semibold text-ink">{v.emoji} {v.label} names</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {[0, 1, 2].map((i) => { const n = exampleName(v.key, i); return <li key={i}><span lang="ja" className="text-ink">{n.surname.kanji} {n.given.kanji}</span> <span className="text-ink/90">{n.given.romaji} {n.surname.romaji}</span><span className="text-muted">, {n.epithet}</span></li>; })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href="/japanese-name-generator" className="chip">Japanese name generator & your name in katakana</Link>
        <Link href="/quiz/which-naruto-character-are-you" className="chip">Which Naruto character are you?</Link>
        <Link href="/anime-birthday-twin" className="chip">Your anime birthday twin</Link>
      </p>

      <Faq title="Anime name generator: FAQ" items={faq} />
    </div>
  );
}
