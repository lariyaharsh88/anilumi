import JsonLd from "@/components/JsonLd";
import PageHero from "@/components/PageHero";
import Faq, { type FaqItem } from "@/components/Faq";
import MadeBy from "@/components/MadeBy";
import Link from "@/components/Link";
import TriviaGame from "@/components/TriviaGame";
import { abs, site } from "@/lib/site";
import { triviaPath, triviaShows, type TriviaQ } from "@/lib/trivia";

/** Quiz schema for the sample questions (the ones shown with answers on the page). */
function quizLd(name: string, path: string, sample: TriviaQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name,
    url: abs(path),
    inLanguage: "en",
    educationalLevel: "beginner",
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: site.name, url: site.url },
    hasPart: sample.map((q) => ({ "@type": "Question", eduQuestionType: "Multiple choice", text: q.q, acceptedAnswer: { "@type": "Answer", text: q.o[q.a] }, suggestedAnswer: q.o.filter((_, k) => k !== q.a).map((o) => ({ "@type": "Answer", text: o })) })),
  };
}

/** The trivia page body shared by /anime-quiz, /anime-quiz/[show] and /anime-quiz/guess-the-anime. */
export default function TriviaPage({ slug, path, name, emoji, title, subtitle, bank, links, faq, current }: {
  slug: string; path: string; name: string; emoji: string; title: React.ReactNode; subtitle: string; bank: TriviaQ[];
  links: { href: string; label: string }[]; faq: FaqItem[]; current: string;
}) {
  const sample = bank.filter((_, k) => k % Math.max(1, Math.floor(bank.length / 5)) === 0).slice(0, 5);
  const others = triviaShows().filter((s) => s.slug !== current);
  return (
    <div className="container-x pb-8">
      <JsonLd data={quizLd(`${name} quiz`, path, sample)} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/anime-quiz", label: "Anime quiz" }, ...(path !== "/anime-quiz" ? [{ href: path, label: name }] : [])]}
        eyebrow={`${emoji} Trivia`}
        title={title}
        subtitle={subtitle}
        facts={[{ value: "10", label: "questions a round" }, { value: String(bank.length), label: "in the question bank" }, { value: "Free", label: "no sign-up" }]}
        hue={300}
      />
      <section className="reveal mt-8" aria-label={`${name} quiz`}>
        <TriviaGame show={slug} name={name} emoji={emoji} bank={bank} url={abs(path)} />
      </section>
      <MadeBy className="mt-4" method="Every question comes from AniLumi's own data (character profiles, watch orders, filler lists, theme songs and the checked Hindi dub list), and each answer links the page that shows it." />

      <section className="reveal mt-10" aria-labelledby="sample-h">
        <h2 id="sample-h" className="h-section mb-3">Sample questions and answers</h2>
        <ol className="space-y-2">
          {sample.map((q) => (
            <li key={q.q} className="card p-4 text-sm">
              <p className="font-semibold text-ink">{q.q}</p>
              <p className="mt-1 text-muted">{q.o.join(" · ")}</p>
              <details className="mt-1"><summary className="cursor-pointer text-violet">Show the answer</summary><p className="mt-1 text-ink/90"><strong>{q.o[q.a]}.</strong> {q.x} <Link href={q.h} className="text-violet hover:underline">Source</Link></p></details>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        {links.map((l) => <Link key={l.href} href={l.href} className="chip">{l.label}</Link>)}
      </p>
      <section className="reveal mt-6" aria-labelledby="more-h">
        <h2 id="more-h" className="h-section mb-3">More anime quizzes</h2>
        <p className="flex flex-wrap gap-2 text-sm">
          {current !== "all" && <Link href="/anime-quiz" className="chip">🎌 General anime quiz</Link>}
          {current !== "guess-the-anime" && <Link href="/anime-quiz/guess-the-anime" className="chip">❓ Guess the anime</Link>}
          {others.map((s) => <Link key={s.slug} href={triviaPath(s.slug)} className="chip">{s.emoji} {s.name} quiz</Link>)}
        </p>
      </section>
      <Faq title={`${name} quiz: FAQ`} items={faq} />
    </div>
  );
}
