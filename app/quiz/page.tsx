import { fitDescription, fitTitle } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import QuizForm from "@/components/QuizForm";
import Faq from "@/components/Faq";
import MadeBy from "@/components/MadeBy";
import { QUIZZES } from "@/lib/charquiz";

export const metadata: Metadata = {
  // "which anime character are you" (1,300 a month US, 390 India); "what anime should I watch" belongs to
  // /what-anime-should-i-watch, so the two don't compete for one search.
  title: fitTitle(["Anime Quizzes: Which Anime Character Are You? & More", "Anime Quizzes: Which Character Are You?"]),
  description: fitDescription("Which anime character are you? Personality quizzes for Naruto, Attack on Titan, JJK and more, plus anime trivia, a daily character guess and a 30-second what-to-watch quiz."),
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/quiz", label: "Quiz" }]}
        eyebrow="🎯 Quizzes"
        title={<>Anime <span className="text-gradient">quizzes</span></>}
        subtitle="Find out which anime character you are, test your anime knowledge, or answer five quick questions and get anime picks that fit, with sub, English dub or Hindi dub."
        hue={262}
      />
      <h2 className="h-section mb-3 mt-8">What anime should I watch? The 30-second quiz</h2>
      <QuizForm />
      <MadeBy className="mx-auto mt-6 max-w-2xl text-center" method="Mood maps to genre, time to episode count, era to air year and intensity to age rating; dub answers use our checked Hindi dub list and where-to-watch research." />
      <p className="mt-6 text-center text-sm text-muted">Feeling lucky? <Link href="/random" prefetch={false} className="text-violet hover:underline">Surprise me with a random anime 🎲</Link></p>
      <section className="reveal mt-10" aria-labelledby="char-h">
        <h2 id="char-h" className="h-section mb-3">Which character are you?</h2>
        <p className="flex flex-wrap gap-2 text-sm">
          {QUIZZES.map((q) => <Link key={q.slug} href={`/quiz/${q.slug}`} className="chip">Which {q.franchise} character are you?</Link>)}
          <Link href="/japanese-name-generator" className="chip">🎌 Japanese name generator</Link>
          <Link href="/guess-the-anime-character" className="chip">🎯 Guess the anime character (daily)</Link>
          <Link href="/anime-quiz" className="chip">🧠 Anime trivia quiz</Link>
        </p>
      </section>
      <Faq title="Anime quiz FAQ" items={[
        { q: "How does the quiz pick anime?", a: "Each answer becomes a filter: mood picks the genre, time the number of episodes, era the air years and intensity the age rating. Matches are ranked by fan score, with one entry per series at its first season." },
        { q: "Can it find anime with a Hindi or English dub?", a: "Yes. The last question keeps only anime with an official Hindi dub on our checked list, or an English dub on the services we researched." },
        { q: "What if nothing matches?", a: "If an era is too narrow we widen the years, and if no match has the dub you asked for we show the best subtitled picks and say so." },
      ]} />
    </div>
  );
}
