import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseBdParams, bdLabel } from "@/lib/birthdays";
import { premieresOn, otdPath } from "@/lib/onthisday";
import OnThisDayView from "@/components/OnThisDayView";

export const revalidate = 604800;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ month: string; day: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month, day } = await params;
  const p = parseBdParams(month, day);
  if (!p) notFound();
  const premieres = await premieresOn(p.m, p.d);
  return {
    title: `Anime Released on ${bdLabel(p.m, p.d)}`,
    description: `Anime that premiered on ${bdLabel(p.m, p.d)}${premieres[0] ? `: ${premieres.slice(0, 4).map((x) => `${x.anime?.title || x.title} (${x.year})`).join(", ")}` : ""}.`,
    alternates: { canonical: otdPath(p.m, p.d) },
    robots: premieres.length ? undefined : { index: false },
  };
}

export default async function OnThisDate({ params }: Props) {
  const { month, day } = await params;
  const p = parseBdParams(month, day);
  if (!p) notFound();
  return <OnThisDayView m={p.m} d={p.d} premieres={await premieresOn(p.m, p.d)} />;
}
