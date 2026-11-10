import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import QuizForm from "@/components/QuizForm";
import Faq from "@/components/Faq";
import MadeBy from "@/components/MadeBy";

export const metadata: Metadata = {
  title: "What Anime Should I Watch? Take the 30-Second Quiz",
  description: "Answer five quick questions about mood, time, era, intensity and sub or dub (English or Hindi) and get anime picks that fit, ranked by fan scores, with where to watch each.",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/quiz", label: "Quiz" }]}
        eyebrow="🎯 30-second quiz"
        title={<>What anime <span className="text-gradient">should I watch?</span></>}
        subtitle="Five quick questions, including sub, English dub or Hindi dub. We match your answers against thousands of titles, keep only first seasons, and rank what fits by fan score."
        hue={262}
      />
      <QuizForm />
      <MadeBy className="mx-auto mt-6 max-w-2xl text-center" method="Mood maps to genre, time to episode count, era to air year and intensity to age rating; dub answers use our checked Hindi dub list and where-to-watch research." />
      <p className="mt-6 text-center text-sm text-muted">Feeling lucky? <Link href="/random" prefetch={false} className="text-violet hover:underline">Surprise me with a random anime 🎲</Link></p>
      <Faq title="Anime quiz FAQ" items={[
        { q: "How does the quiz pick anime?", a: "Each answer becomes a filter: mood picks the genre, time the number of episodes, era the air years and intensity the age rating. Matches are ranked by fan score, with one entry per series at its first season." },
        { q: "Can it find anime with a Hindi or English dub?", a: "Yes. The last question keeps only anime with an official Hindi dub on our checked list, or an English dub on the services we researched." },
        { q: "What if nothing matches?", a: "If an era is too narrow we widen the years, and if no match has the dub you asked for we show the best subtitled picks and say so." },
      ]} />
    </div>
  );
}
