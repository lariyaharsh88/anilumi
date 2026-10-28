import type { Metadata } from "next";
import { premieresOn, animeOfTheDay, nowJst } from "@/lib/onthisday";
import { bdLabel } from "@/lib/birthdays";
import OnThisDayView from "@/components/OnThisDayView";

// Re-rendered hourly so "today" rolls over close to midnight in Japan.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { m, d } = nowJst();
  return {
    title: `On This Day in Anime (${bdLabel(m, d)}): Premieres & Anime of the Day`,
    description: `Anime that first aired on ${bdLabel(m, d)} in past years, plus today's anime of the day. A new page every day.`,
    alternates: { canonical: "/on-this-day" },
  };
}

export default async function OnThisDayToday() {
  const { y, m, d } = nowJst();
  const [premieres, pick] = await Promise.all([premieresOn(m, d), animeOfTheDay(y, m, d)]);
  return <OnThisDayView m={m} d={d} premieres={premieres} pick={pick} today />;
}
