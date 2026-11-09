import { amazonTagged } from "@/lib/affiliate";

/** Amazon's required disclosure, shown next to tagged links (nothing while no tag is set). */
export default function AffiliateNote({ className = "" }: { className?: string }) {
  if (!amazonTagged()) return null;
  return <p className={`text-[11px] text-muted ${className}`}>As an Amazon Associate, AniLumi earns from qualifying purchases.</p>;
}
