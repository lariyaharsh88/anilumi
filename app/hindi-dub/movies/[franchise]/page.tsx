import type { Metadata } from "next";
import FilmsPage, { filmsMetadata } from "@/components/FilmsPage";

export const revalidate = 86400;
// Rendered on first request like the other dub pages (OpenNext 404s build-time pages with dynamicParams = false).
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ franchise: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return filmsMetadata((await params).franchise, "hi");
}

/** Every film of a franchise with its Hindi dub status (components/FilmsPage.tsx). */
export default async function HindiFranchiseFilms({ params }: Props) {
  return <FilmsPage slug={(await params).franchise} lang="hi" />;
}
