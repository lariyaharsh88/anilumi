/**
 * Builds data/voice-actors.json: the most-favourited voice actors (the /voice-actors hub and sitemap) plus the
 * voices of the most-favourited characters, each with the full profile getVoiceActor returns, so their pages
 * don't need live AniList calls. Each person is two requests; AniList allows ~30 a minute.
 * Runs monthly in .github/workflows/refresh-data.yml after the character snapshot; by hand:
 * npx tsx scripts/fetch-voice-actors.mts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { POPULAR_VA_Q, STAFF_Q, toPopular, toVoiceActor, type AlStaff, type VoiceActor } from "../lib/anilist";
import { packSnapshot } from "../lib/vasnap";

const TOP = Number(process.env.TOP) || 200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ask<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  for (let i = 0; i < 6; i++) {
    const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (res?.ok) return ((await res.json()) as { data: T }).data;
    if (res?.status === 404) throw new Error("not found");
    const wait = res?.status === 429 ? (Number(res.headers.get("retry-after")) || 30) * 1000 : 5000 * (i + 1);
    console.warn(`AniList ${res ? `HTTP ${res.status}` : "network error"}, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error("AniList kept failing");
}

// Hub: voice actors among the 150 most-favourited staff.
const hubStaff = [];
for (const p of [1, 2, 3]) {
  hubStaff.push(...(await ask<{ Page: { staff: Parameters<typeof toPopular>[0] } }>(POPULAR_VA_Q, { p })).Page.staff);
  await sleep(2500);
}
const hub = toPopular(hubStaff).slice(0, 100);

// Then the voices behind the most-favourited characters, by their characters' total favourites.
const chars = (JSON.parse(readFileSync(new URL("../data/characters.json", import.meta.url), "utf8")) as { characters: { f: number; jp: { id: number } | null; en: { id: number } | null }[] }).characters;
const weight = new Map<number, number>();
for (const c of chars) for (const v of [c.jp, c.en]) if (v) weight.set(v.id, (weight.get(v.id) || 0) + c.f);
const ids = [...new Set([...hub.map((v) => v.id), ...[...weight].sort((a, b) => b[1] - a[1]).map(([id]) => id)])].slice(0, TOP);

const people: Record<string, VoiceActor> = {};
for (const [n, id] of ids.entries()) {
  try {
    const p1 = await ask<{ Staff: AlStaff | null }>(STAFF_Q, { id, p: 1 });
    await sleep(2200);
    const p2 = p1.Staff && p1.Staff.characterMedia.pageInfo.total > 50 ? await ask<{ Staff: AlStaff | null }>(STAFF_Q, { id, p: 2 }) : null;
    if (p2) await sleep(2200);
    if (p1.Staff) people[id] = toVoiceActor(p1.Staff, p2?.Staff ?? null);
  } catch (e) {
    console.warn(`staff ${id}: ${(e as Error).message}`);
  }
  process.stdout.write(`voice actors ${n + 1}/${ids.length}\r`);
}

writeFileSync(new URL("../data/voice-actors.json", import.meta.url), packSnapshot({ generated: new Date().toISOString().slice(0, 10), hub, people }));
console.log(`\nwrote ${hub.length} hub entries, ${Object.keys(people).length} profiles`);
