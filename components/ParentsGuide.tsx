import type { ParentsGuide as Guide, Level } from "@/lib/insights";

// Status palette (fixed, never themed) paired with an icon and a word, so colour never carries meaning alone.
const LV: Record<Level, { text: string; icon: string; color: string }> = {
  none: { text: "None noted", icon: "○", color: "#0ca30c" },
  mild: { text: "Mild", icon: "◔", color: "#fab219" },
  moderate: { text: "Moderate", icon: "◑", color: "#ec835a" },
  strong: { text: "Strong", icon: "●", color: "#d03b3b" },
};

export default function ParentsGuide({ title, guide, ageRating, ageRatingGuide }: { title: string; guide: Guide; ageRating: string | null; ageRatingGuide: string | null }) {
  const heading = `Parents\u2019 guide to ${title}`;
  return (
    <section id="parents-guide" className="mt-8 scroll-mt-20" aria-labelledby="pg-h">
      <h2 id="pg-h" className="h-section mb-1">{heading}</h2>
      <p className="mb-3 text-sm text-muted">
        Best for: <strong className="text-ink">{guide.suitable}</strong>
        {ageRating ? ` · Rated ${ageRating}${ageRatingGuide ? ` (${ageRatingGuide})` : ""}` : ""}
        {guide.madeForKids ? " · Made for children" : ""}
      </p>
      <div className="card divide-y divide-line">
        {guide.areas.map((a) => (
          <div key={a.key} className="flex flex-wrap items-start gap-x-4 gap-y-1 p-3 text-sm">
            <span className="w-full font-medium text-ink sm:w-56">{a.label}</span>
            <span className="flex w-28 items-center gap-1.5 text-ink/90">
              <span aria-hidden style={{ color: LV[a.level].color }}>{LV[a.level].icon}</span>
              {LV[a.level].text}
            </span>
            <span className="min-w-0 flex-1 text-xs text-muted">
              {a.shown.length ? a.shown.join(", ") : a.level !== "none" && !a.hiddenSpoilers ? "Flagged by viewers" : ""}
              {a.hiddenSpoilers ? `${a.shown.length ? " · " : ""}${a.hiddenSpoilers} detail${a.hiddenSpoilers > 1 ? "s" : ""} hidden to avoid spoilers` : ""}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">From AniList community tags and the official age rating. Levels reflect how many viewers agree each tag applies, not a professional rating, so preview an episode before watching with younger children. Explicit tag names are never shown.</p>
    </section>
  );
}
