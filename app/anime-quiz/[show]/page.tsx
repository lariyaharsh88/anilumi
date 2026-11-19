import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TriviaPage from "@/components/TriviaPage";
import { fitTitle, fitDescription } from "@/lib/titles";
import { MIN_BANK, bankTopics, guessTheAnimeBank, listOf, triviaBank, triviaPath, triviaShow, type TriviaShow } from "@/lib/trivia";
import { filmsPath } from "@/lib/franchisefilms";
import { characterTable } from "@/lib/charsnap";

export const revalidate = 86400;
// Rendered on first request like the rest of the site (OpenNext 404s build-time pages with dynamicParams = false).
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ show: string }> };

const GUESS = "guess-the-anime";
function load(slug: string): { show: TriviaShow | null; bank: ReturnType<typeof triviaBank> } {
  if (slug === GUESS) return { show: null, bank: guessTheAnimeBank() };
  const show = triviaShow(slug);
  const bank = show ? triviaBank(slug) : [];
  if (!show || bank.length < MIN_BANK) notFound();
  return { show, bank };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).show;
  const { show, bank } = load(slug);
  if (!show) return {
    title: fitTitle(["Guess the Anime: Name the Show From Its Characters", "Guess the Anime Quiz"]),
    description: fitDescription(`Guess the anime from three of its characters: ${bank.length} rounds from Jujutsu Kaisen and One Piece to hidden gems, 10 at a time. A free anime quiz with a score to share with friends.`),
    alternates: { canonical: triviaPath(GUESS) },
  };
  return {
    title: fitTitle([`${show.name} Quiz: 10 Questions Only True Fans Get Right`, `${show.name} Quiz: How Well Do You Know It?`, `${show.name} Quiz`]),
    description: fitDescription(`A free ${show.name} quiz: 10 trivia questions a round from a bank of ${bank.length}, on ${listOf(bankTopics(bank).slice(0, 4))}. See the answers and their sources, then share your score.`),
    alternates: { canonical: triviaPath(slug) },
  };
}

/** One show's trivia quiz, or the Guess the Anime round. */
export default async function ShowQuiz({ params }: Props) {
  const slug = (await params).show;
  const { show, bank } = load(slug);
  if (!show) return (
    <TriviaPage
      slug={GUESS} current={GUESS} path={triviaPath(GUESS)} name="Guess the Anime" emoji="❓"
      title={<>Guess the <span className="text-gradient">anime</span></>}
      subtitle="Three characters, four anime: which show are they all from? Ten rounds at a time, from the biggest hits to cult favourites."
      bank={bank}
      links={[{ href: "/what-anime-is-this", label: "🔍 Find an anime from a screenshot" }, { href: "/characters", label: "Anime characters" }]}
      faq={[
        { q: "How does Guess the Anime work?", a: "Each round shows three of a show's most popular characters and four anime titles. Pick the show they're from; you get ten rounds and a score to share." },
        { q: "Where do the characters come from?", a: "AniList's most-favourited characters, grouped by show. Titles are the official ones, so some appear in romaji." },
      ]}
    />
  );
  const cast = show.cast[0];
  return (
    <TriviaPage
      slug={show.slug} current={show.slug} path={triviaPath(show.slug)} name={show.name} emoji={show.emoji}
      title={<>{show.name} <span className="text-gradient">quiz</span></>}
      subtitle={`How well do you know ${show.name}? Ten trivia questions a round on ${listOf(bankTopics(bank))}. Each answer links the page that proves it.`}
      bank={bank}
      links={[
        ...(show.woPage ? [{ href: `/watch-order/${show.woPage}`, label: `${show.name} watch order` }] : []),
        ...(show.filler?.length ? [{ href: `/anime/${show.filler[0]}/filler-list`, label: `${show.name} filler list` }] : []),
        ...(characterTable(cast) ? [{ href: `/anime/${cast}/characters`, label: `${show.name} characters` }] : []),
        ...(show.films ? [{ href: filmsPath(show.films), label: `${show.name} movies in Hindi` }] : []),
      ]}
      faq={[
        { q: `How many questions are in the ${show.name} quiz?`, a: `Ten a round, drawn at random from ${bank.length}, so you can play again for a different set.` },
        { q: "Where do the answers come from?", a: "AniList character profiles, AniLumi's watch orders and filler lists, the AnimeThemes song list and our checked Hindi dub list. Each answer links its source." },
        { q: "Are there spoilers?", a: `Light ones at most: the quiz asks about ${listOf(bankTopics(bank))}. No plot twists.` },
      ]}
    />
  );
}
