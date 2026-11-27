import RegionalPlatformPage, { regionalPlatformMetadata } from "@/components/RegionalPlatformPage";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ platform: string }> };
export async function generateMetadata({ params }: Props) { return regionalPlatformMetadata("te", (await params).platform); }

/** Telugu dubbed anime on one platform (components/RegionalPlatformPage.tsx). */
export default async function TeluguDubPlatform({ params }: Props) {
  return <RegionalPlatformPage lang="te" slug={(await params).platform} />;
}
