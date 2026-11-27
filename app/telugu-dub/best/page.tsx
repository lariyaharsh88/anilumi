import RegionalBestPage, { regionalBestMetadata } from "@/components/RegionalBestPage";

export const revalidate = 86400;
export const generateMetadata = () => regionalBestMetadata("te");

/** The best anime with an official Telugu dub, ranked by fan score (components/RegionalBestPage.tsx). */
export default function BestTeluguDubbed() {
  return <RegionalBestPage lang="te" />;
}
