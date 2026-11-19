import type { Metadata } from "next";
import TriviaPage from "@/components/TriviaPage";
import { fitTitle, fitDescription } from "@/lib/titles";
import { mixedBank, triviaShows } from "@/lib/trivia";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const y = new Date().getFullYear();
  return {
    title: fitTitle([`Anime Quiz (${y}): 10 Questions to Test Your Anime Knowledge`, `Anime Quiz (${y}): Test Your Anime Knowledge`, "Anime Quiz"]),
    description: fitDescription(`A free anime trivia quiz: 10 questions a round on ${triviaShows().slice(0, 5).map((s) => s.name).join(", ")} and more, from birthdays and voice actors to episodes and openings. Share your score.`),
    alternates: { canonical: "/anime-quiz" },
  };
}

/** The anime trivia hub: a mixed quiz across every show plus links to each show's own quiz. */
export default function AnimeQuiz() {
  const shows = triviaShows();
  return (
    <TriviaPage
      slug="all" current="all" path="/anime-quiz" name="Anime" emoji="🎌"
      title={<>Anime <span className="text-gradient">quiz</span></>}
      subtitle={`Ten trivia questions a round from ${shows.length} big shows and the wider anime world: birthdays, voice actors, episode counts, openings and Hindi dubs. Every answer links its source.`}
      bank={mixedBank()}
      links={[{ href: "/quiz", label: "🎯 What anime should I watch?" }, { href: "/characters", label: "Anime characters" }, { href: "/watch-order", label: "Watch orders" }]}
      faq={[
        { q: "How many questions are in the anime quiz?", a: "Ten a round, drawn at random from a bank of more than a hundred, so every round is different. Press Play again for ten new ones." },
        { q: "Where do the answers come from?", a: "From AniLumi's own data: AniList character profiles (birthdays, heights, blood types, Japanese voice actors), our watch orders and filler lists, the AnimeThemes song list and our checked Hindi dub list. Each answer links the page that shows it." },
        { q: "Is there a quiz for one show?", a: `Yes: ${shows.map((s) => s.name).join(", ")}, plus a Guess the Anime round.` },
      ]}
    />
  );
}
