import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import CharacterQuizGame from "@/components/CharacterQuizGame";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { QUESTIONS, QUIZZES, characterCards, quizBySlug } from "@/lib/charquiz";

export const revalidate = 604800;
// Rendered on first request like the rest of the site (build-time pages 404 on the Cloudflare build).
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

function load(slug: string) {
  const quiz = quizBySlug(slug);
  if (!quiz) notFound();
  return { quiz, cards: characterCards(quiz) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { quiz } = load((await params).slug);
  return {
    title: fitTitle([`Which ${quiz.franchise} Character Are You? Free 8-Question Quiz`, `Which ${quiz.franchise} Character Are You? (Quiz)`, `${quiz.franchise} Character Quiz`]),
    description: fitDescription(`Eight quick personality questions match you with one of ${quiz.characters.length} ${quiz.franchise} characters, from ${quiz.characters.slice(0, 3).map((c) => c.name).join(", ")} to ${quiz.characters.at(-1)!.name}. Share your result on WhatsApp or Telegram.`),
    alternates: { canonical: `/quiz/${quiz.slug}` },
  };
}

export default async function CharacterQuizPage({ params }: Props) {
  const { quiz, cards } = load((await params).slug);
  const others = QUIZZES.filter((q) => q.slug !== quiz.slug);
  const faq: FaqItem[] = [
    { q: `How does the ${quiz.franchise} character quiz work?`, a: `Each answer adds points to six traits: drive, calm, brains, heart, independence and fun. Your totals are compared with each character's profile, and the closest one is your result. There are no right answers and you don't need to know the show.` },
    { q: `Which ${quiz.franchise} characters can I get?`, a: `${cards.length}: ${cards.map((c) => c.name).join(", ")}.` },
    { q: "Can I share my result?", a: "Yes: the result has WhatsApp, Telegram and copy-link buttons. The link opens the quiz with your result shown, so friends can compare." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", `/quiz/${quiz.slug}`, `Which ${quiz.franchise} character are you?`)} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/quiz", label: "Quizzes" }, { href: `/quiz/${quiz.slug}`, label: `${quiz.franchise} character quiz` }]}
        eyebrow="🎯 Personality quiz"
        title={<>Which <span className="text-gradient">{quiz.franchise}</span> character are you?</>}
        subtitle={`Eight quick questions, no spoilers and no right answers. You'll get one of ${cards.length} characters and can share your result.`}
        facts={[{ value: "8", label: "questions" }, { value: String(cards.length), label: "possible results" }, { value: "1 min", label: "to finish" }]}
        hue={300}
        posters={cards.slice(0, 3).map((c) => c.image)}
      />

      <section className="reveal mt-8 max-w-2xl" aria-label="Quiz">
        <CharacterQuizGame franchise={quiz.franchise} path={`/quiz/${quiz.slug}`} questions={QUESTIONS} cards={cards} />
      </section>

      <section className="reveal mt-12" aria-labelledby="all-h">
        <h2 id="all-h" className="h-section mb-1">All {cards.length} possible results</h2>
        <p className="mb-4 text-sm text-muted">What each result says about you. Tap a character for their age, birthday and voice actors.</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.key} id={`about-${c.key}`} className="card flex gap-3 p-3 text-sm">
              <span className="relative block h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-bg-2">{c.image && <Image src={c.image} alt={c.name} fill sizes="64px" className="object-cover object-top" />}</span>
              <span className="min-w-0"><Link href={c.href} className="font-semibold text-ink hover:text-violet-2">{c.name}</Link><span className="mt-1 block text-ink/80">{c.why}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        {others.map((q) => <Link key={q.slug} href={`/quiz/${q.slug}`} className="chip">Which {q.franchise} character are you?</Link>)}
        <Link href={`/watch-order/${quiz.watchOrder}`} className="chip">{quiz.franchise} watch order</Link>
        <Link href="/quiz" className="chip">What anime should I watch?</Link>
      </p>

      <Faq title={`${quiz.franchise} character quiz: FAQ`} items={faq} />
    </div>
  );
}
