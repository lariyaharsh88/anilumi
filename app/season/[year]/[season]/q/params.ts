import { seasonOf, shiftSeason } from "@/lib/kitsu";

/** Paths pre-built at deploy time (kept out of page.tsx: pages may only export what Next allows). */
export async function generateStaticParamsList() {
  const now = seasonOf();
  const out: { year: string; season: string }[] = [];
  for (let d = -4; d <= 2; d++) {
    const s = shiftSeason(now.season, now.year, d);
    out.push({ year: String(s.year), season: s.season });
  }
  return out;
}
