import RegionalPlatformPage, { regionalPlatformMetadata } from "@/components/RegionalPlatformPage";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ platform: string }> };
export async function generateMetadata({ params }: Props) { return regionalPlatformMetadata("ta", (await params).platform); }

/** Tamil dubbed anime on one platform (components/RegionalPlatformPage.tsx). */
export default async function TamilDubPlatform({ params }: Props) {
  return <RegionalPlatformPage lang="ta" slug={(await params).platform} />;
}
