import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuessGamePage, { guessMetadata } from "@/components/GuessGamePage";
import { guessMode } from "@/lib/guessgame";

export const revalidate = 1800;
// Rendered on first request like the rest of the site (build-time pages 404 on the Cloudflare build).
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ mode: string }> };
const modeOf = (m: string) => { const def = guessMode(m); if (!def || def.mode === "all") notFound(); return def.mode; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return guessMetadata(modeOf((await params).mode));
}

/** Daily character guessing game for one series (components/GuessGamePage.tsx). */
export default async function GuessSeriesCharacter({ params }: Props) {
  return <GuessGamePage mode={modeOf((await params).mode)} />;
}
