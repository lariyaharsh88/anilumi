import type { AiringNotice } from "@/lib/kitsu";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Tokyo" });

/** Break / disagreement notice. Renders nothing when the schedule is normal and sources agree. */
export default function AiringNoticeBanner({ n, title }: { n: AiringNotice; title: string }) {
  if (!n.next || (!n.onBreak && !n.disagree)) return null;
  const weeks = n.breakDays ? Math.round(n.breakDays / 7) : 0;
  return (
    <div className="mt-3 rounded-xl border border-[#fab219]/40 bg-[#fab219]/10 p-3 text-sm" role="note">
      {n.onBreak && (
        <p>
          <span aria-hidden className="mr-1.5">⏸</span>
          <strong className="text-ink">On a break.</strong>{" "}
          <span className="text-ink/90">No new episode of {title} until {fmt(n.next)}, about {weeks > 1 ? `${weeks} weeks` : `${n.breakDays} days`} away. It normally airs weekly.</span>
        </p>
      )}
      {n.disagree && (
        <p className={n.onBreak ? "mt-1.5" : ""}>
          <span aria-hidden className="mr-1.5">⚠</span>
          <strong className="text-ink">Sources disagree.</strong>{" "}
          <span className="text-ink/90">AniList says {fmt(n.disagree.aniList)}, Kitsu says {fmt(n.disagree.kitsu)}. We show AniList, which tracks broadcast schedules more closely.</span>
        </p>
      )}
      <p className="mt-1 text-xs text-muted">Next-episode time from {n.source}. Dates in Japan time.</p>
    </div>
  );
}
