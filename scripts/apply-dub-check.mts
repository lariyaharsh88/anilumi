/**
 * Applies a weekly Indian dub check (a JSON of changes, from the research pass) to data/hindi-dubs.json,
 * data/regional-dubs.json and data/dub-schedule.json:
 *   new      a dub not on the list (or listed as none_found): added with `added` = the check date
 *   update   new platforms or seasons: the language's platforms are replaced, `added` kept
 *   removed  no longer streaming anywhere: Hindi becomes past_broadcast, Tamil/Telugu drop the language
 * Touched entries get their own `checked` date; each file's `lastScan` records the check. The file-level `checked`
 * (when the whole list was verified) is left alone: a weekly scan for changes isn't a full re-check.
 * Run: npx tsx scripts/apply-dub-check.mts <check.json>
 */
import { readFileSync, writeFileSync } from "node:fs";

type Platform = { name: string; scope: string; url: string };
type Row = { s: string; t: string; change: "new" | "update" | "removed"; status?: string; confidence: "high" | "medium"; platforms: Platform[]; sources: string[]; note?: string };
type Check = { checked: string; hindi?: Row[]; tamil?: Row[]; telugu?: Row[]; schedule?: { t: string; started: boolean; premiere?: string | null; source?: string }[] };

const file = process.argv[2];
if (!file) throw new Error("usage: apply-dub-check.mts <check.json>");
const check = JSON.parse(readFileSync(file, "utf8")) as Check;
const date = check.checked;
const read = (f: string) => JSON.parse(readFileSync(f, "utf8"));
const write = (f: string, d: unknown) => writeFileSync(f, JSON.stringify(d, null, 1) + "\n");
const okUrl = (u: string) => /^https:\/\/[^\s"<>]+$/.test(u);
const clean = (ps: Platform[]) => ps.filter((p) => p.name && okUrl(p.url)).map((p) => ({ name: p.name, scope: p.scope ?? "", url: p.url }));
const log: string[] = [];

// Hindi
const H = "data/hindi-dubs.json";
const hindi = read(H) as { lastScan?: string; entries: { s: string; t: string; status: string; confidence: string; platforms: Platform[]; sources: string[]; note: string; added?: string; checked?: string }[] };
for (const r of check.hindi ?? []) {
  let e = hindi.entries.find((x) => x.s === r.s);
  const wasAvailable = e?.status === "available";
  if (r.change === "removed") {
    if (e) { e.status = "past_broadcast"; e.note = r.note ?? e.note; e.checked = date; log.push(`hindi removed: ${r.t}`); }
    continue;
  }
  const platforms = clean(r.platforms);
  if (!platforms.length) { log.push(`hindi SKIPPED (no valid platform url): ${r.t}`); continue; }
  if (!e) { e = { s: r.s, t: r.t, status: "available", confidence: r.confidence, platforms, sources: [], note: "" }; hindi.entries.push(e); }
  e.status = "available"; e.confidence = r.confidence; e.platforms = platforms;
  e.sources = [...new Set([...(e.sources ?? []), ...r.sources.filter(okUrl)])];
  if (r.note) e.note = r.note;
  if (!wasAvailable || !e.added) e.added = date;
  e.checked = date;
  log.push(`hindi ${wasAvailable ? "update" : "new"}: ${r.t}`);
}
hindi.lastScan = date;
write(H, hindi);

// Tamil and Telugu
const RG = "data/regional-dubs.json";
const reg = read(RG) as { checked: string; lastScan?: string; entries: Record<string, unknown>[] & { s: string; t: string; sources: string[]; note?: string; checked?: string; ta?: { status: string; confidence: string; platforms: Platform[]; added?: string }; te?: { status: string; confidence: string; platforms: Platform[]; added?: string } }[] };
for (const [lang, rows] of [["ta", check.tamil ?? []], ["te", check.telugu ?? []]] as const) {
  for (const r of rows) {
    let e = reg.entries.find((x) => x.s === r.s);
    if (r.change === "removed") {
      if (e?.[lang]) { delete e[lang]; e.note = r.note ?? e.note; e.checked = date; log.push(`${lang} removed: ${r.t}`); }
      continue;
    }
    const platforms = clean(r.platforms);
    if (!platforms.length) { log.push(`${lang} SKIPPED (no valid platform url): ${r.t}`); continue; }
    if (!e) { e = { s: r.s, t: r.t, sources: [], note: "" }; reg.entries.push(e); }
    const was = e[lang]?.status === "available" ? e[lang]!.added : undefined;
    e[lang] = { status: "available", confidence: r.confidence, platforms, added: was ?? date };
    e.sources = [...new Set([...(e.sources ?? []), ...r.sources.filter(okUrl)])];
    if (r.note) e.note = r.note;
    e.checked = date;
    log.push(`${lang} ${was ? "update" : "new"}: ${r.t}`);
  }
}
reg.lastScan = date;
write(RG, reg);

// Dub schedule: announced Hindi runs that started or got a date
const S = "data/dub-schedule.json";
const sched = read(S) as { entries: { t: string; lang: string; status: string; premiere: string | null }[] };
for (const x of check.schedule ?? []) {
  const e = sched.entries.find((y) => y.lang === "hi" && y.t === x.t);
  if (!e) { log.push(`schedule: no entry for ${x.t}`); continue; }
  if (x.premiere && x.premiere !== e.premiere) { e.premiere = x.premiere; log.push(`schedule date: ${x.t} → ${x.premiere}`); }
  if (x.started && e.status === "announced") { e.status = "airing"; log.push(`schedule started: ${x.t}`); }
}
write(S, sched);

console.log(log.length ? log.join("\n") : "no changes");
