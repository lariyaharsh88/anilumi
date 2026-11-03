import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { birthdaysOn, parseBdParams, bdLabel, bdPath, zodiacOf } from "@/lib/birthdays";
import BirthdayView from "@/components/BirthdayView";

// Rendered on first request and refreshed daily (premieres come from AniList via the cache); invalid dates 404
// in parseBdParams. All 366 dates are in the sitemap, so the cache warm-up renders them ahead of visitors.
export const revalidate = 86400;
export async function generateStaticParams() { return []; }

type Props = { params: Promise<{ month: string; day: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month, day } = await params;
  const p = parseBdParams(month, day);
  if (!p) notFound();
  const { characters, people } = birthdaysOn(p.m, p.d);
  // Searches look like "october 26 anime birthdays": lead with the date, then the most famous names.
  const top = characters.slice(0, 2).map((c) => c.n);
  const more = characters.length - top.length;
  return {
    title: characters.length
      ? `${bdLabel(p.m, p.d)} Anime Birthdays: ${top.join(", ")}${more > 0 ? ` & ${more} More` : ""}`
      : `${bdLabel(p.m, p.d)} Anime Birthdays: Characters & Voice Actors`,
    description: `Anime characters born on ${bdLabel(p.m, p.d)}${characters[0] ? `: ${characters.slice(0, 4).map((c) => `${c.n} (${c.t})`).join(", ")}${characters.length > 4 ? ` and ${characters.length - 4} more` : ""}` : ""}${people.length ? `, plus ${people.length} voice actor${people.length === 1 ? "" : "s"} with the same birthday` : ""}. Ages, heights, voice actors and the ${zodiacOf(p.m, p.d).name} sign.`,
    alternates: { canonical: bdPath(p.m, p.d) },
    ...(characters.length ? {} : { robots: { index: false } }),
  };
}

export default async function BirthdayDate({ params }: Props) {
  const { month, day } = await params;
  const p = parseBdParams(month, day);
  if (!p) notFound();
  return <BirthdayView m={p.m} d={p.d} {...birthdaysOn(p.m, p.d)} />;
}
