import type { Metadata } from "next";
import RegionalShowPage, { regionalShowMetadata } from "@/components/RegionalShowPage";

export const revalidate = 86400;
// Rendered on first request like the other dub pages (OpenNext 404s build-time pages with dynamicParams = false).
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return regionalShowMetadata((await params).slug, "te");
}

/** One anime's official Telugu dub (components/RegionalShowPage.tsx). */
export default async function Page({ params }: Props) {
  return <RegionalShowPage slug={(await params).slug} lang="te" />;
}
