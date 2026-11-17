import AltSitePage, { ALT_SITES, altMetadata } from "@/components/AltSitePage";

export const revalidate = 86400;
const site = ALT_SITES["animetoon"];
export const generateMetadata = () => altMetadata(site);
export default function AnimeToonAlternatives() {
  return <AltSitePage site={site} />;
}
