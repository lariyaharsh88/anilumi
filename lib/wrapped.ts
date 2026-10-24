/** "My Anime Wrapped": stats from the browser-only watchlist. Pure and unit-tested. */
import type { WatchItem } from "./watchlist";

const PERSONA: Record<string, [string, string]> = {
  Action: ["The Adrenaline Junkie", "If nobody's powering up, are we even watching?"],
  Adventure: ["The Explorer", "Always one more island, one more dungeon."],
  Comedy: ["The Class Clown", "You watch anime to laugh until it hurts."],
  Drama: ["The Feels Collector", "Tissues on standby, every single week."],
  Romance: ["The Hopeless Romantic", "Will they, won't they? You need to know."],
  Fantasy: ["The World Hopper", "Magic systems are your love language."],
  "Science Fiction": ["The Future Gazer", "Mechs, time loops and big questions."],
  Thriller: ["The Edge-of-Seat Viewer", "Cliffhangers are your cardio."],
  Isekai: ["The Reincarnated Hero", "Truck-kun sends his regards."],
  Mecha: ["The Pilot", "Get in the robot. Every time."],
  Music: ["The Idol Fan", "The OP lives rent-free in your head."],
  Historical: ["The Time Traveller", "Swords, samurai and the old days."],
  Shounen: ["The Shounen Spirit", "Friendship, training arcs and never giving up."],
  Mystery: ["The Detective", "You clocked the twist in episode two."],
  Psychological: ["The Mind Bender", "The darker the head games, the better."],
  "Slice of Life": ["The Cozy Soul", "Tea, school clubs and zero stakes, perfect."],
  Sports: ["The Team Captain", "One more match point and you're screaming."],
  Horror: ["The Brave One", "Watching with the lights off, apparently."],
  Supernatural: ["The Spirit Seeker", "Ghosts, curses and things that go bump."],
};

export type Wrapped = {
  total: number; watching: number; planning: number; airing: number;
  minutesWatched: number; minutesPlanned: number; episodesWatched: number;
  topGenres: { name: string; count: number }[];
  persona: { title: string; line: string };
  mostWatched: WatchItem | null; nextUp: WatchItem | null;
};

export function computeWrapped(items: WatchItem[], now = Date.now()): Wrapped {
  const len = (i: WatchItem) => i.episodeLength || (i.runtime && i.episodeCount ? i.runtime / i.episodeCount : 24);
  const episodesWatched = items.reduce((n, i) => n + (i.progress || 0), 0);
  const minutesWatched = Math.round(items.reduce((n, i) => n + (i.progress || 0) * len(i), 0));
  const minutesPlanned = Math.round(items.reduce((n, i) => n + Math.max(0, (i.runtime || 0) - (i.progress || 0) * len(i)), 0));
  const g = new Map<string, number>();
  for (const i of items) for (const x of i.genres || []) g.set(x, (g.get(x) || 0) + 1);
  const topGenres = [...g.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 5);
  const p = topGenres.map((x) => PERSONA[x.name]).find(Boolean) || ["The Curious Newcomer", "Your list is just getting started."];
  const mostWatched = [...items].filter((i) => (i.progress || 0) > 0).sort((a, b) => (b.progress || 0) * len(b) - (a.progress || 0) * len(a))[0] || null;
  const nextUp = items.filter((i) => i.nextRelease && Date.parse(i.nextRelease) > now).sort((a, b) => Date.parse(a.nextRelease!) - Date.parse(b.nextRelease!))[0] || null;
  return {
    total: items.length,
    watching: items.filter((i) => i.listStatus === "watching" || i.listStatus === "rewatching").length,
    planning: items.filter((i) => i.listStatus === "planning").length,
    airing: items.filter((i) => i.status === "current").length,
    minutesWatched, minutesPlanned, episodesWatched, topGenres,
    persona: { title: p[0], line: p[1] },
    mostWatched, nextUp,
  };
}
