import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EpisodesView, episodesMetadata } from "../../view";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }

type Props = { params: Promise<{ slug: string; p: string }> };
const pageOf = (p: string) => (/^[1-9]\d{0,3}$/.test(p) && Number(p) > 1 ? Number(p) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, p } = await params;
  const page = pageOf(p);
  if (!page) notFound();
  return episodesMetadata(slug, page);
}

export default async function EpisodesPaged({ params }: Props) {
  const { slug, p } = await params;
  const page = pageOf(p);
  if (!page) notFound();
  return <EpisodesView slug={slug} page={page} />;
}
