import AdUnit from "./AdUnit";

/**
 * Where an ad may go. Off until ADS.enabled is true and an AdSense ad unit id is set: AdSense (publisher id from
 * ads.txt) shows one responsive unit per slot, outside Europe only (AdUnit).
 */
export const ADS = {
  enabled: false,
  client: "ca-pub-7494206891190273", // the publisher id in public/ads.txt
  slot: "", // a responsive display ad unit id from AdSense → Ads → By ad unit
};

export default function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  if (!ADS.enabled || !ADS.slot) return null;
  return <AdUnit client={ADS.client} slot={ADS.slot} className={className} key={slot} />;
}
