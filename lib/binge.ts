/** Binge-time maths for the "how long to watch" pages. All pure and unit-tested. */

export type Pace = { key: string; label: string; days: number; unit: "day" | "weekend" };
export type Shortcut = { key: string; label: string; minutes: number; saved: number; note: string };

/** Openings + endings run about 3 minutes on a standard 24-minute episode. */
export const OP_ED_MIN = 3;

/** "12 days", "3 weeks", "5 months", "1.5 years". */
export function humanDays(d: number): string {
  if (d <= 0) return "–";
  if (d <= 13) return `${d} day${d === 1 ? "" : "s"}`;
  if (d <= 59) return `${Math.round(d / 7)} weeks`;
  if (d <= 729) return `${Math.round(d / 30.4)} months`;
  return `${+(d / 365).toFixed(1)} years`;
}

/** Whole hours, never rounding a short show down to zero. */
export const hoursOf = (min: number) => (min <= 0 ? 0 : Math.max(1, Math.round(min / 60)));

/** How many days (or weekends) each viewing pace takes. */
export function paces(totalMin: number, episodes: number): Pace[] {
  if (totalMin <= 0) return [];
  const per = (m: number) => Math.max(1, Math.ceil(totalMin / m));
  const out: Pace[] = [];
  if (episodes > 1) out.push({ key: "ep", label: "One episode a day", days: episodes, unit: "day" });
  out.push(
    { key: "1h", label: "1 hour a day", days: per(60), unit: "day" },
    { key: "2h", label: "2 hours a day", days: per(120), unit: "day" },
    { key: "4h", label: "4 hours a day", days: per(240), unit: "day" },
    { key: "we", label: "Weekends only, 5 h a day", days: per(600), unit: "weekend" },
  );
  return out;
}

/** Ways to get through it faster. `fillerEps` is the number of skippable filler episodes, if known. */
/**
 * Ways to get through it faster. `fillerEps` is the number of skippable filler episodes, if known.
 * `skip` is the measured opening+ending length per episode (AniSkip); otherwise a 3-minute estimate.
 */
export function shortcuts(totalMin: number, episodes: number, epLength: number, fillerEps = 0, skip?: { perEpisodeMin: number; sampled: number }): Shortcut[] {
  if (totalMin <= 0) return [];
  const out: Shortcut[] = [];
  const per = skip && skip.perEpisodeMin > 0 ? skip.perEpisodeMin : OP_ED_MIN;
  if (episodes > 1 && epLength >= 20) {
    const m = Math.round(totalMin - episodes * per);
    const note = skip
      ? `About ${per >= 1 ? `${+per.toFixed(1)} minutes` : `${Math.round(per * 60)} seconds`} saved per episode, measured on ${skip.sampled} episode${skip.sampled === 1 ? "" : "s"}.`
      : `About ${OP_ED_MIN} minutes saved per episode.`;
    out.push({ key: "oped", label: "Skip openings & endings", minutes: m, saved: totalMin - m, note });
  }
  if (fillerEps > 0 && episodes > fillerEps) {
    const m = totalMin - fillerEps * epLength;
    out.push({ key: "filler", label: "Skip filler episodes", minutes: m, saved: totalMin - m, note: `${fillerEps} filler episode${fillerEps === 1 ? "" : "s"} that aren't from the manga.` });
    if (out[0]?.key === "oped") {
      const both = Math.round((episodes - fillerEps) * (epLength - per));
      out.push({ key: "both", label: "Skip filler and openings", minutes: both, saved: totalMin - both, note: "The fastest way to the full story." });
    }
  }
  const fast = Math.round(totalMin / 1.5);
  out.push({ key: "1.5x", label: "Watch at 1.5× speed", minutes: fast, saved: totalMin - fast, note: "Most players support it; dialogue stays clear." });
  return out;
}

/** Runtime for display: "1h 40m" for short watches, "472 h" once it passes two days (clearer than "19d 16h"). */
export function fmtRun(min: number): string {
  if (min <= 0) return "–";
  if (min >= 48 * 60) return `${Math.round(min / 60).toLocaleString("en-US")} h`;
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

/**
 * Minutes per episode we can trust. Kitsu sometimes lacks episodeLength and carries a broken totalLength
 * (Banana Fish: 24 episodes, 176 minutes), so an implied length under 5 minutes is treated as unknown
 * unless the show really is a short (AniList's duration says so). Pure.
 */
export function episodeMinutes(a: { episodeCount: number | null; episodeLength: number | null; totalLength: number | null }, aniListDuration: number | null = null): number {
  if (a.episodeLength) return a.episodeLength;
  if (aniListDuration) return aniListDuration;
  const implied = a.episodeCount && a.totalLength ? a.totalLength / a.episodeCount : 0;
  return implied >= 5 ? Math.round(implied) : 0;
}
