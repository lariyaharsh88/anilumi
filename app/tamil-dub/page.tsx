import RegionalDubPage, { regionalMetadata } from "@/components/RegionalDubPage";

export const revalidate = 86400;
export const generateMetadata = () => regionalMetadata("ta");

/** Every anime with an official Tamil dub (components/RegionalDubPage.tsx). */
export default function TamilDub() {
  return <RegionalDubPage lang="ta" />;
}
