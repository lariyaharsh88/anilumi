import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import JapaneseNameTool from "@/components/JapaneseNameTool";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { GIVEN, SURNAMES } from "@/lib/jpnames";

export const revalidate = 2592000;

export const metadata: Metadata = {
  title: fitTitle(["Japanese Name Generator: Names with Kanji & Meanings", "Japanese Name Generator"]),
  description: fitDescription(`Generate Japanese names with kanji and their meanings, for boys or girls, from ${SURNAMES.length} common surnames and ${GIVEN.length} popular given names. Plus your own name in katakana.`),
  alternates: { canonical: "/japanese-name-generator" },
};

/** Japanese name generator and "your name in katakana" (lib/jpnames.ts), with the name lists as readable tables. */
export default function JapaneseNameGenerator() {
  const boys = GIVEN.filter((n) => n.g === "boy").slice(0, 10);
  const girls = GIVEN.filter((n) => n.g === "girl").slice(0, 10);
  const faq: FaqItem[] = [
    { q: "How do Japanese names work?", a: "The family name comes first and the given name second: in Tanaka Haruto, Tanaka is the surname. Each name is usually written in kanji, and the same name can have several kanji spellings with different meanings." },
    { q: "How do I write my name in Japanese?", a: "Foreign names are written in katakana, the script for loanwords, by how they sound: Harsh becomes ハルシュ (Harushu) and Priya プリヤ (Puriya). Type your name in the box above for an approximate spelling." },
    { q: "What are the most common Japanese surnames?", a: `${SURNAMES.slice(0, 6).map((n) => `${n.romaji} (${n.kanji})`).join(", ")} are among the most common.` },
    { q: "Are these real Japanese names?", a: "Yes. The surnames are among Japan's most common, and the given names are popular modern and classic ones, each with a usual kanji spelling and the meaning of those kanji." },
  ];
  const Table = ({ title, rows }: { title: string; rows: { kanji: string; romaji: string; meaning: string }[] }) => (
    <div className="card overflow-x-auto p-4">
      <h3 className="font-semibold text-ink">{title}</h3>
      <table className="mt-2 w-full text-left text-sm">
        <tbody>{rows.map((n) => <tr key={n.romaji + n.kanji} className="border-b border-line/50"><td className="py-1.5 pr-3 text-lg text-ink" lang="ja">{n.kanji}</td><td className="py-1.5 pr-3 text-ink/90">{n.romaji}</td><td className="py-1.5 text-muted">{n.meaning}</td></tr>)}</tbody>
      </table>
    </div>
  );

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", "/japanese-name-generator", "Japanese name generator")} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/japanese-name-generator", label: "Japanese name generator" }]}
        eyebrow="🎌 Free tool"
        title={<>Japanese <span className="text-gradient">name generator</span></>}
        subtitle="Real Japanese names with their kanji and what they mean, for boys or girls, and your own name written in Japanese."
        facts={[{ value: String(SURNAMES.length), label: "surnames" }, { value: String(GIVEN.length), label: "given names" }, { value: "Free", label: "no sign-up" }]}
        hue={350}
      />

      <section className="reveal mt-8" aria-label="Name generator"><JapaneseNameTool /></section>

      <section className="reveal mt-12" aria-labelledby="lists-h">
        <h2 id="lists-h" className="h-section mb-3">Popular Japanese names and their meanings</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Table title="Boy names" rows={boys} />
          <Table title="Girl names" rows={girls} />
          <Table title="Common surnames" rows={SURNAMES.slice(0, 10)} />
        </div>
      </section>

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href="/anime-name-generator" className="chip">🎴 Anime character name generator</Link>
        <Link href="/quiz/which-naruto-character-are-you" className="chip">Which Naruto character are you?</Link>
        <Link href="/anime-birthday-twin" className="chip">Your anime birthday twin</Link>
        <Link href="/random-anime-generator" className="chip">Random anime generator</Link>
      </p>

      <Faq title="Japanese names: FAQ" items={faq} />
    </div>
  );
}
