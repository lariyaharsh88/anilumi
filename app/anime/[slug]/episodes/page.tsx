import type { Metadata } from "next";
import { EpisodesView, episodesMetadata } from "./view";

export const revalidate = 21600;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return episodesMetadata((await params).slug, 1);
}

export default async function EpisodesPage({ params }: Props) {
  return <EpisodesView slug={(await params).slug} page={1} />;
}
