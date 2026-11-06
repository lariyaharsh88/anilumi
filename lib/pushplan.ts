/**
 * Which push alerts are due now (scripts/send-alerts.mts sends them): episodes that aired in the last few hours,
 * from the airing snapshot, and today's character birthdays. Each alert has a key so it's sent only once. Pure.
 */
import type { AiringShow } from "./airing";
import { bdLabel, bdPath, type BdChar } from "./birthdays";
import { animeTopic, charTopic } from "./push";

export type Alert = { key: string; topic: string; title: string; body: string; url: string; icon?: string };

/**
 * GitHub's schedule runs hours late or skips runs outright (Nov 2026: 3-7 hours apart for an hourly cron), so
 * look back 12 hours; each alert's key stops repeats.
 */
export const LOOKBACK_MS = 12 * 3600_000;

/** What a scheduled run should send besides new episodes, so a skipped cron slot is caught up by the next run. */
export function dueJobs(now = new Date()): { birthdays: boolean; digest: boolean } {
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const day = now.getUTCDay(); // 5 = Friday
  // Birthdays from 03:30 UTC (9 AM in India); the digest from Friday 03:30 UTC until the weekend is over.
  return { birthdays: minutes >= 210, digest: (day === 5 && minutes >= 210) || day === 6 || day === 0 };
}

/** ISO week, "2026-W45": the digest's send-once key, so a Friday and a late Saturday run can't both send. */
export function isoWeek(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

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

const dayLabel = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/**
 * The Friday digest (lib/emails.ts digestMail): premieres and the most-followed shows' new episodes in the next
 * 7 days, from the airing snapshot, plus up to 5 of the week's headlines. Each show appears once.
 */
export function buildDigest(shows: AiringShow[], news: { title: string; url: string; source: string }[], now = Date.now()) {
  const end = now + 7 * 86400_000;
  const next = shows.filter((s) => s.s).flatMap((s) => {
    const n = s.n.find(([, t]) => t * 1000 > now && t * 1000 <= end);
    return n ? [{ s, episode: n[0], at: n[1] * 1000 }] : [];
  }).sort((a, b) => b.s.p - a.s.p);
  const range = `${new Date(now).toLocaleDateString("en-GB", { day: "numeric", timeZone: "Asia/Kolkata" })}–${new Date(end).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}`;
  return {
    week: range,
    premieres: next.filter((x) => x.episode === 1).slice(0, 8).sort((a, b) => a.at - b.at).map((x) => ({ k: x.s.k, title: x.s.t, day: dayLabel(x.at), url: `/anime/${x.s.s}` })),
    episodes: next.filter((x) => x.episode > 1).slice(0, 12).sort((a, b) => a.at - b.at).map((x) => ({ k: x.s.k, title: x.s.t, episode: x.episode, day: dayLabel(x.at), url: `/anime/${x.s.s}/episode/${x.episode}` })),
    news: news.slice(0, 5),
  };
}
