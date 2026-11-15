import RegionalDubPage, { regionalMetadata } from "@/components/RegionalDubPage";

export const revalidate = 86400;
export const generateMetadata = () => regionalMetadata("te");

/** Every anime with an official Telugu dub (components/RegionalDubPage.tsx). */
export default function TeluguDub() {
  return <RegionalDubPage lang="te" />;
}
