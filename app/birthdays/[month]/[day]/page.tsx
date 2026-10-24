import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allDays, birthdaysOn, parseBdParams, bdLabel, bdPath, MONTHS } from "@/lib/birthdays";
import BirthdayView from "@/components/BirthdayView";

export const dynamicParams = false;
export function generateStaticParams() {
  return allDays().map(({ m, d }) => ({ month: MONTHS[m - 1], day: String(d) }));
}

type Props = { params: Promise<{ month: string; day: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month, day } = await params;
  const p = parseBdParams(month, day);
  if (!p) notFound();
  const { characters } = birthdaysOn(p.m, p.d);
  return {
    title: `Anime Characters Born on ${bdLabel(p.m, p.d)}`,
    description: `Anime characters and voice actors with a ${bdLabel(p.m, p.d)} birthday${characters[0] ? `: ${characters.slice(0, 4).map((c) => `${c.n} (${c.t})`).join(", ")}` : ""}.`,
    alternates: { canonical: bdPath(p.m, p.d) },
    robots: characters.length ? undefined : { index: false },
  };
}

export default async function BirthdayDate({ params }: Props) {
  const { month, day } = await params;
  const p = parseBdParams(month, day);
  if (!p) notFound();
  return <BirthdayView m={p.m} d={p.d} {...birthdaysOn(p.m, p.d)} />;
}
