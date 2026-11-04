/**
 * Which push alerts are due now (scripts/send-push.mts sends them): episodes that aired in the last few hours,
 * from the airing snapshot, and today's character birthdays. Each alert has a key so it's sent only once. Pure.
 */
import type { AiringShow } from "./airing";
import { bdLabel, bdPath, type BdChar } from "./birthdays";
import { animeTopic, charTopic } from "./push";

export type Alert = { key: string; topic: string; title: string; body: string; url: string; icon?: string };

/** GitHub's hourly schedule can run late, so look back 3 hours; the key stops repeats. */
export const LOOKBACK_MS = 3 * 3600_000;

export function dueEpisodes(shows: AiringShow[], now = Date.now()): Alert[] {
  return shows.flatMap((s) => (!s.k || !s.s ? [] : s.n
    .filter(([, t]) => t * 1000 <= now && t * 1000 > now - LOOKBACK_MS)
    .map(([n]) => ({
      key: `a:${s.k}:${n}`,
      topic: animeTopic(s.k!),
      title: n === 1 ? `${s.t} has premiered` : `${s.t}: episode ${n} is out`,
      body: n === 1 ? "Episode 1 just aired. Where to watch, and what to expect." : "Where to watch, the episode guide and what fans think.",
      url: `/anime/${s.s}/episode/${n}`,
    }))));
}

/** Birthdays on the given UTC date (the workflow runs at 03:30 UTC, 9 AM in India). */
export function dueBirthdays(chars: BdChar[], pathFor: (id: number) => string | null, date = new Date()): Alert[] {
  const m = date.getUTCMonth() + 1, d = date.getUTCDate(), y = date.getUTCFullYear();
  return chars.filter((c) => c.m === m && c.d === d).map((c) => ({
    key: `c:${c.id}:${y}`,
    topic: charTopic(c.id),
    title: `🎂 It's ${c.n}'s birthday today`,
    body: `${c.n}${c.t ? ` from ${c.t}` : ""}. See who else was born on ${bdLabel(m, d)}.`,
    url: pathFor(c.id) ?? bdPath(m, d),
    icon: c.i || undefined,
  }));
}
