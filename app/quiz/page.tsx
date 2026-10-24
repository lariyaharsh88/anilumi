import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import QuizForm from "@/components/QuizForm";

export const metadata: Metadata = {
  title: "What Anime Should I Watch? Take the 30-Second Quiz",
  description: "Answer four quick questions about mood, time, era and intensity and get anime picks that fit, ranked by fan scores.",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/quiz", label: "Quiz" }]}
        eyebrow="🎯 30-second quiz"
        title={<>What anime <span className="text-gradient">should I watch?</span></>}
        subtitle="Four quick questions. We match your answers against thousands of titles and rank what fits by fan score."
        hue={262}
      />
      <QuizForm />
      <p className="mt-6 text-center text-sm text-muted">Feeling lucky? <Link href="/random" prefetch={false} className="text-violet hover:underline">Surprise me with a random anime 🎲</Link></p>
    </div>
  );
}
