import AltSitePage, { ALT_SITES, altMetadata } from "@/components/AltSitePage";

export const revalidate = 86400;
const site = ALT_SITES["anime-salt"];
export const generateMetadata = () => altMetadata(site);
export default function AnimeSaltAlternatives() {
  return <AltSitePage site={site} />;
}
