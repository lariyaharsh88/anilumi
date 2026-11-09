import { amazonTagged } from "@/lib/affiliate";
import OneLink from "./OneLink";

/** Amazon's required disclosure, shown next to tagged links (nothing while no tag is set); also loads OneLink. */
export default function AffiliateNote({ className = "" }: { className?: string }) {
  if (!amazonTagged()) return null;
  return (
    <>
      <p className={`text-[11px] text-muted ${className}`}>As an Amazon Associate, AniLumi earns from qualifying purchases.</p>
      <OneLink />
    </>
  );
}
