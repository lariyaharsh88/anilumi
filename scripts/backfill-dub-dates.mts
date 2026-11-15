/**
 * One-off: gives every available dub in data/hindi-dubs.json and data/regional-dubs.json an `added` date, the
 * date of the first commit where it was listed as available (git history), so /new-dubs can show what was added
 * when. New entries get `added` when they're written (the data check sets it); tests/dubdates.test.ts checks.
 * Run: npx tsx scripts/backfill-dub-dates.mts
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
/** Commits touching a file, oldest first: [sha, YYYY-MM-DD]. */
const history = (file: string) => git("log", "--reverse", "--format=%H %ad", "--date=short", "--", file).trim().split("\n").filter(Boolean).map((l) => l.split(" ") as [string, string]);

type Entry = { s: string; status?: string; ta?: { status: string; added?: string }; te?: { status: string; added?: string }; added?: string };

function firstSeen(file: string, keys: (e: Entry) => string[]): Map<string, string> {
  const seen = new Map<string, string>();
  for (const [sha, date] of history(file)) {
    let data: { entries: Entry[] };
    try { data = JSON.parse(git("show", `${sha}:${file}`)); } catch { continue; }
    for (const e of data.entries) for (const k of keys(e)) if (!seen.has(k)) seen.set(k, date);
  }
  return seen;
}

const today = new Date().toISOString().slice(0, 10);

const HINDI = "data/hindi-dubs.json";
const hSeen = firstSeen(HINDI, (e) => (e.status === "available" ? [e.s] : []));
const hindi = JSON.parse(readFileSync(HINDI, "utf8")) as { entries: Entry[] };
let n = 0;
for (const e of hindi.entries) if (e.status === "available" && !e.added) { e.added = hSeen.get(e.s) ?? today; n++; }
writeFileSync(HINDI, JSON.stringify(hindi, null, 1) + "\n");

const REG = "data/regional-dubs.json";
const rSeen = firstSeen(REG, (e) => (["ta", "te"] as const).flatMap((l) => (e[l]?.status === "available" ? [`${l}:${e.s}`] : [])));
const reg = JSON.parse(readFileSync(REG, "utf8")) as { entries: Entry[] };
for (const e of reg.entries) for (const l of ["ta", "te"] as const) { const x = e[l]; if (x?.status === "available" && !x.added) { x.added = rSeen.get(`${l}:${e.s}`) ?? today; n++; } }
writeFileSync(REG, JSON.stringify(reg, null, 1) + "\n");
console.log(`${n} dates added`);
