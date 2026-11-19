import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import { abs } from "@/lib/site";
import { fitTitle, fitDescription } from "@/lib/titles";
import { KIND_LABEL, TERMS, sortedTerms, termPath, termsPath, type TermKind } from "@/lib/animeterms";

export const revalidate = 2592000;

/**
 * Anime dictionary hub. Keyword Planner (Nov 2026): "<term> meaning" searches add up to about 150K a month in
 * English, plus about 20K for Hindi meanings ("anime meaning in hindi" 4.4K, "sayonara meaning in hindi" 3.6K).
 * Results today are spam pages and general dictionaries without anime examples or Hindi.
 */
export const metadata: Metadata = {
  title: fitTitle([`Anime Dictionary: ${TERMS.length} Anime Words & Meanings (+ Hindi)`, `Anime Dictionary: ${TERMS.length} Anime Words & Meanings`, "Anime Dictionary"]),
  description: fitDescription(`What tsundere, senpai, kawaii, otaku, isekai and ${TERMS.length - 5} more anime words mean, with the Japanese, how to say them, the Hindi meaning and real anime examples.`),
  alternates: { canonical: termsPath },
};

const ORDER: TermKind[] = ["archetype", "phrase", "fandom"];

/** All terms, A–Z within each group, with the one-line meaning. */
export default function AnimeDictionary() {
  const all = sortedTerms();
  const letters = [...new Set(all.map((t) => t.term[0].toUpperCase()))];
  const faq: FaqItem[] = [
    { q: "What is the meaning of anime in Hindi?", a: "Anime (एनीमे) means Japanese animation: cartoons and animated films made in Japan, like Naruto, One Piece and Demon Slayer. In Hindi you can say जापानी एनिमेशन." },
    { q: "What are the most common Japanese words in anime?", a: "Arigatō (thank you), sayonara (goodbye), konnichiwa (hello), senpai (senior), sensei (teacher), kawaii (cute), sugoi (amazing), nani (what?), baka (idiot) and daijōbu (are you OK?) come up in almost every show." },
    { q: "What do tsundere, yandere, kuudere and dandere mean?", a: "They're character types. Tsundere: harsh outside, loving inside. Yandere: loving to a dangerous, obsessive degree. Kuudere: cool and emotionless on the surface. Dandere: shy and quiet until comfortable." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "DefinedTermSet", "@id": `${abs(termsPath)}#set`, name: "AniLumi anime dictionary", url: abs(termsPath), hasDefinedTerm: all.map((t) => ({ "@type": "DefinedTerm", name: t.term, description: t.short, url: abs(termPath(t.slug)) })) }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: termsPath, label: "Anime dictionary" }]}
        eyebrow="📖 Anime dictionary"
        title={<>Anime <span className="text-gradient">dictionary</span></>}
        subtitle="The Japanese words, character types and fandom slang you hear in anime, with how to say them, the Hindi meaning and real examples."
        facts={[{ value: String(TERMS.length), label: "terms" }, { value: "हिंदी", label: "Hindi meanings" }, { value: String(TERMS.reduce((n, t) => n + t.examples.length, 0)), label: "anime examples" }]}
        hue={210}
      />

      <AnswerLead>Start with the character types (<Link href={termPath("tsundere")} className="text-violet hover:underline">tsundere</Link>, <Link href={termPath("yandere")} className="text-violet hover:underline">yandere</Link>), the everyday words (<Link href={termPath("senpai")} className="text-violet hover:underline">senpai</Link>, <Link href={termPath("arigato")} className="text-violet hover:underline">arigato</Link>) or the fandom terms (<Link href={termPath("otaku")} className="text-violet hover:underline">otaku</Link>, <Link href={termPath("isekai")} className="text-violet hover:underline">isekai</Link>). Every entry has the Japanese, the Hindi meaning and anime examples.</AnswerLead>

      <nav aria-label="A to Z" className="mt-6 flex flex-wrap gap-1.5 text-sm">
        {letters.map((l) => <a key={l} href={`#letter-${l}`} className="chip">{l}</a>)}
      </nav>

      {ORDER.map((kind) => {
        const group = all.filter((t) => t.kind === kind);
        return (
          <section key={kind} className="reveal mt-10" aria-labelledby={`${kind}-h`}>
            <h2 id={`${kind}-h`} className="h-section mb-3">{KIND_LABEL[kind]}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((t) => (
                <li key={t.slug} className="card p-4">
                  <p className="flex flex-wrap items-baseline gap-x-2"><Link href={termPath(t.slug)} className="font-semibold text-ink hover:text-violet-2">{t.term}</Link>{t.jp !== "—" && <span className="text-sm text-muted" lang="ja">{t.jp}</span>}</p>
                  <p className="mt-1 text-sm text-ink/85">{t.short}</p>
                  <p className="mt-1 text-xs text-muted" lang="hi">{t.hi.word}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="reveal mt-10" aria-labelledby="az-h">
        <h2 id="az-h" className="h-section mb-3">A to Z</h2>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {letters.map((l) => (
            <div key={l} id={`letter-${l}`} className="scroll-mt-28">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{l}</p>
              <ul className="mt-1 space-y-1 text-sm">
                {all.filter((t) => t.term[0].toUpperCase() === l).map((t) => <li key={t.slug}><Link href={termPath(t.slug)} className="text-ink/90 hover:text-violet-2">{t.term}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <MadeBy className="mt-10" method="Meanings are checked against Japanese dictionaries (Jisho), Merriam-Webster and Wikipedia; anime examples against AniLumi's character data and series wikis." />
      <p className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href="/japanese-name-generator" className="chip">🎌 Japanese name generator</Link>
        <Link href="/anime-name-generator" className="chip">🎴 Anime name generator</Link>
        <Link href="/anime-quiz" className="chip">🧠 Anime trivia quiz</Link>
      </p>

      <Faq title="Anime dictionary: FAQ" items={faq} />
    </div>
  );
}
