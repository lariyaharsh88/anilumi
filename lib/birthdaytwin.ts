/**
 * The birthday-twin tool's data: for every day of the year, its five most-loved characters (with our one-line intro),
 * two voice actors and the zodiac sign. Served as /anime-birthday-twin/data.json so the page itself stays light. Pure.
 */
import type { TwinDay } from "@/components/BirthdayTwin";
import { allDays, birthdaysOn, bdLabel, bdPath, zodiacOf } from "./birthdays";
import { characterPathFor } from "./charsnap";
import { characterLine } from "./charlines";
import { animePath } from "./kitsu";
import { vaPath } from "./anilist";

/** Every day of the year: its five most-loved characters (with who they are) and two voice actors. */
export function twinDays(): Record<string, TwinDay> {
  const out: Record<string, TwinDay> = {};
  for (const { m, d } of allDays()) {
    const { characters, people } = birthdaysOn(m, d);
    const z = zodiacOf(m, d);
    out[`${m}-${d}`] = {
      label: bdLabel(m, d), path: bdPath(m, d), sign: `${z.symbol} ${z.name}`, total: characters.length,
      c: characters.slice(0, 5).map((c) => ({ n: c.n, t: c.t, i: c.i, h: characterPathFor(c.id) ?? (c.s ? animePath({ slug: c.s }) : null), l: characterLine(c.id) })),
      p: people.slice(0, 2).map((p) => ({ n: p.n, i: p.i, h: vaPath({ id: p.id, name: p.n }) })),
    };
  }
  return out;
}

