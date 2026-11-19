import type { Metadata } from "next";
import GuessGamePage, { guessMetadata } from "@/components/GuessGamePage";

// Half-hourly, so "yesterday's character" turns over soon after midnight IST (today's is picked in the browser).
export const revalidate = 1800;
export const metadata: Metadata = guessMetadata("all");

/** Daily anime character guessing game, all anime (components/GuessGamePage.tsx). */
export default function GuessTheAnimeCharacter() {
  return <GuessGamePage mode="all" />;
}
