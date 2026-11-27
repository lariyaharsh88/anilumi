import RegionalBestPage, { regionalBestMetadata } from "@/components/RegionalBestPage";

export const revalidate = 86400;
export const generateMetadata = () => regionalBestMetadata("ta");

/** The best anime with an official Tamil dub, ranked by fan score (components/RegionalBestPage.tsx). */
export default function BestTamilDubbed() {
  return <RegionalBestPage lang="ta" />;
}
