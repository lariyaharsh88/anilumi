/** Placeholder for an ad network unit (AdSense, Ezoic, Mediavine). Renders nothing until NEXT_PUBLIC_ADS=1. */
export default function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  if (process.env.NEXT_PUBLIC_ADS !== "1") return null;
  return <div data-ad-slot={slot} className={`my-8 flex min-h-[90px] items-center justify-center rounded-xl border border-dashed border-line text-xs text-muted ${className}`}>Advertisement</div>;
}
