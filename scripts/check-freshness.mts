/**
 * Which hand-researched datasets are due for a recheck: each has a "checked" date and a shelf life that fits how fast
 * it changes (prices and TV schedules go stale faster than film lists). Prints a table and exits 1 when any is
 * overdue, so it can gate a reminder; it is not part of `npm test`, since an old date shouldn't block a data refresh.
 * By hand: npx tsx scripts/check-freshness.mts
 */
import { readFileSync } from "node:fs";

const SETS: { file: string; days: number; what: string; field?: string }[] = [
  { file: "data/crunchyroll-plans.json", days: 90, what: "Crunchyroll prices, trial and deals" },
  { file: "data/one-piece-bounties.json", days: 45, what: "One Piece bounties (new ones come with new chapters)" },
  { file: "data/strongest.json", days: 60, what: "Strongest-character rankings (ongoing manga can change them)" },
  { file: "data/franchise-films.json", days: 60, what: "Doraemon, Shinchan and Pokémon films, TV and streaming" },
  { file: "data/kids-tv.json", days: 60, what: "Kids' TV channels airing anime in India" },
  { file: "data/classic-films.json", days: 120, what: "Where classic anime films stream" },
  { file: "data/ghibli-films.json", days: 120, what: "Where Ghibli films stream" },
  { file: "data/donghua.json", days: 90, what: "Where donghua stream" },
  { file: "data/funimation.json", days: 365, what: "Funimation explainer" },
  { file: "data/op-mc-anime.json", days: 180, what: "Overpowered-MC anime list" },
  { file: "data/character-powers.json", days: 120, what: "Powers and transformations" },
  { file: "data/hindi-dubs.json", days: 30, what: "Hindi dub list" },
  { file: "data/sequel-news.json", days: 30, what: "Next-season news" },
];

const today = new Date();
let overdue = 0;
console.log("Dataset".padEnd(34) + "Checked".padEnd(12) + "Due".padEnd(12) + "Status");
for (const s of SETS) {
  let checked: string | null = null;
  try { checked = (JSON.parse(readFileSync(new URL(`../${s.file}`, import.meta.url), "utf8")) as { checked?: string }).checked ?? null; } catch { /* missing file */ }
  if (!checked) { console.log(s.file.padEnd(34) + "-".padEnd(12) + "-".padEnd(12) + "no checked date"); continue; }
  const due = new Date(new Date(`${checked.slice(0, 10)}T00:00:00Z`).getTime() + s.days * 86400_000);
  const late = due < today;
  if (late) overdue++;
  console.log(s.file.replace("data/", "").padEnd(34) + checked.slice(0, 10).padEnd(12) + due.toISOString().slice(0, 10).padEnd(12) + (late ? `OVERDUE: ${s.what}` : "ok"));
}
process.exit(overdue ? 1 : 0);
