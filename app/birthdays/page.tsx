import type { Metadata } from "next";
import { birthdaysOn, todayJst, bdLabel } from "@/lib/birthdays";
import BirthdayView from "@/components/BirthdayView";

// Re-rendered hourly so "today" rolls over close to midnight in Japan.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { m, d } = todayJst();
  const { characters } = birthdaysOn(m, d);
  return {
    // Names in the title, like the date pages: "Anime Birthdays Today (October 31): L Lawliet, Kirito & 12 More".
    title: characters.length
      ? `Anime Birthdays Today (${bdLabel(m, d)}): ${characters.slice(0, 2).map((c) => c.n).join(", ")}${characters.length > 2 ? ` & ${characters.length - 2} More` : ""}`
      : `Anime Character Birthdays Today (${bdLabel(m, d)})`,
    description: `Anime characters and voice actors celebrating a birthday today, ${bdLabel(m, d)}${characters[0] ? `: ${characters.slice(0, 3).map((c) => c.n).join(", ")} and more` : ""}.`,
    alternates: { canonical: "/birthdays" },
  };
}

export default function BirthdaysToday() {
  const { m, d } = todayJst();
  const b = birthdaysOn(m, d);
  return <BirthdayView m={m} d={d} today {...b} />;
}
