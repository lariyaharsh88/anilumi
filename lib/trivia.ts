/**
 * Trivia question banks for /anime-quiz, generated from local data only: character birthdays, heights, blood types
 * and Japanese voice actors (data/characters.json + data/series-characters.json via lib/charsnap), seasons and
 * episode counts (watch-order snapshot), filler counts (lib/filler), opening songs (themes snapshot), Hindi dub
 * platforms and Pokémon's films. Every question has one right answer among four distinct options and links the page
 * that proves it. Deterministic: the same data always gives the same bank (distractors come from a seeded RNG).
 * Keyword Planner, India, Nov 2026: "anime quiz" 1.6K a month, "pokemon quiz" 2.9K, "demon slayer quiz" 1.3K,
 * "naruto quiz" 1K, "one piece quiz" 880. They want trivia, not "which character are you" (/quiz/[slug]).
 */
import { fanName } from "./charnames";
import snap from "@/data/watch-order-snap.json";
import themeData from "@/data/themes.json";
import { characterTable, characterPathFor, allSnapChars, type SnapChar } from "./charsnap";
import { bdPath, MONTHS } from "./birthdays";
import { fillerFor } from "./filler";
import { dubBySlug, dubHref, HINDI_PLATFORMS, platformKind } from "./hindidub";
import { filmFranchise, filmsPath } from "./franchisefilms";

export type TriviaQ = { q: string; o: string[]; a: number; x: string; h: string };
export type TriviaShow = {
  slug: string; name: string; emoji: string;
  /** Kitsu slugs whose casts feed the character questions. */
  cast: string[];
  /** Kitsu slug of any title in the watch-order snapshot franchise, and the /watch-order page slug. */
  wo?: string; woPage?: string;
  filler?: string[]; themes?: string[]; hindi?: string; films?: string;
};

export const TRIVIA_SHOWS: TriviaShow[] = [
  { slug: "naruto", name: "Naruto", emoji: "🍥", cast: ["naruto", "naruto-shippuden"], wo: "naruto", woPage: "naruto", filler: ["naruto", "naruto-shippuden"], themes: ["naruto", "naruto-shippuden"], hindi: "naruto" },
  { slug: "one-piece", name: "One Piece", emoji: "🏴‍☠️", cast: ["one-piece"], wo: "one-piece", woPage: "one-piece", filler: ["one-piece"], themes: ["one-piece"], hindi: "one-piece" },
  { slug: "demon-slayer", name: "Demon Slayer", emoji: "🗡️", cast: ["kimetsu-no-yaiba"], wo: "kimetsu-no-yaiba", woPage: "kimetsu-no-yaiba", themes: ["kimetsu-no-yaiba"], hindi: "kimetsu-no-yaiba" },
  { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen", emoji: "🌀", cast: ["jujutsu-kaisen"], wo: "jujutsu-kaisen", woPage: "jujutsu-kaisen", themes: ["jujutsu-kaisen"], hindi: "jujutsu-kaisen" },
  { slug: "attack-on-titan", name: "Attack on Titan", emoji: "🧱", cast: ["attack-on-titan"], wo: "attack-on-titan", woPage: "attack-on-titan", themes: ["attack-on-titan"], hindi: "attack-on-titan" },
  { slug: "dragon-ball", name: "Dragon Ball", emoji: "🐉", cast: ["dragon-ball-z"], wo: "dragon-ball", woPage: "dragon-ball", filler: ["dragon-ball-z", "dragon-ball"], themes: ["dragon-ball-z"], hindi: "dragon-ball" },
  { slug: "pokemon", name: "Pokémon", emoji: "⚡", cast: ["pokemon"], wo: "pokemon", woPage: "pokemon", filler: ["pokemon"], hindi: "pokemon", films: "pokemon" },
  { slug: "death-note", name: "Death Note", emoji: "📓", cast: ["death-note"], wo: "death-note", woPage: "death-note", themes: ["death-note"], hindi: "death-note" },
  { slug: "haikyuu", name: "Haikyuu!!", emoji: "🏐", cast: ["haikyuu"], wo: "haikyuu", woPage: "haikyuu", themes: ["haikyuu"], hindi: "haikyuu" },
  { slug: "my-hero-academia", name: "My Hero Academia", emoji: "🦸", cast: ["boku-no-hero-academia", "boku-no-hero-academia-2nd-season"], wo: "boku-no-hero-academia", woPage: "boku-no-hero-academia", themes: ["boku-no-hero-academia"], hindi: "boku-no-hero-academia" },
];
export const MIN_BANK = 15;
export const triviaShow = (slug: string) => TRIVIA_SHOWS.find((s) => s.slug === slug) ?? null;
export const triviaPath = (slug: string) => `/anime-quiz/${slug}`;

/** mulberry32 seeded from a string: the same show always gets the same distractors. */
export function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = <T,>(xs: T[], r: () => number): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** A question from a right answer and a pool of wrong ones: three distinct distractors, then shuffled. Null if the pool is too small. */
export function makeQ(q: string, right: string, wrongPool: string[], x: string, h: string, r: () => number): TriviaQ | null {
  const wrong = shuffle([...new Set(wrongPool.filter((w) => w && w !== right))], r).slice(0, 3);
  if (wrong.length < 3) return null;
  const o = shuffle([right, ...wrong], r);
  return { q, o, a: o.indexOf(right), x, h };
}

const fmtDate = (m: number, d: number) => `${MONTHS[m - 1][0].toUpperCase()}${MONTHS[m - 1].slice(1)} ${d}`;
type Row = { c: SnapChar; cm: number | null };

/** The show's characters, most-favourited first, merged across its cast slugs. */
function castOf(show: TriviaShow): Row[] {
  const byId = new Map<number, Row>();
  for (const s of show.cast) for (const r of characterTable(s) ?? []) if (!byId.has(r.c.id)) byId.set(r.c.id, { c: { ...r.c, n: fanName(r.c) }, cm: r.cm });
  // Characters too few for a table still count (a show's top names in the popular snapshot).
  for (const c of allSnapChars()) if (show.cast.includes(c.s) && !byId.has(c.id)) byId.set(c.id, { c: { ...c, n: fanName(c) }, cm: null });
  return [...byId.values()].sort((a, b) => b.c.f - a.c.f);
}
const charHref = (show: TriviaShow, c: SnapChar) => characterPathFor(c.id) ?? `/anime/${show.cast[0]}/characters`;

function characterQs(show: TriviaShow, r: () => number): TriviaQ[] {
  const cast = castOf(show).slice(0, 40);
  const out: (TriviaQ | null)[] = [];
  const dated = cast.filter((x) => x.c.m && x.c.d);
  const dates = dated.map((x) => fmtDate(x.c.m!, x.c.d!));
  // Birthday, both ways; "whose birthday is…" only for dates no one else in the show shares.
  for (const x of dated.slice(0, 12)) out.push(makeQ(`When is ${x.c.n}'s birthday?`, fmtDate(x.c.m!, x.c.d!), dates, `${x.c.n} was born on ${fmtDate(x.c.m!, x.c.d!)}.`, charHref(show, x.c), r));
  const count = new Map<string, number>(); for (const d of dates) count.set(d, (count.get(d) ?? 0) + 1);
  for (const x of dated.slice(0, 8)) {
    const d = fmtDate(x.c.m!, x.c.d!);
    if (count.get(d) !== 1) continue;
    out.push(makeQ(`Which ${show.name} character's birthday is ${d}?`, x.c.n, dated.filter((y) => fmtDate(y.c.m!, y.c.d!) !== d).map((y) => y.c.n), `${x.c.n} was born on ${d}.`, bdPath(x.c.m!, x.c.d!), r));
  }
  // Height: four heights at least 3 cm apart.
  const tall = cast.filter((x) => x.cm);
  for (const x of tall.slice(0, 8)) {
    const others = tall.filter((y) => Math.abs(y.cm! - x.cm!) >= 3).map((y) => `${y.cm} cm`);
    const spread = [...new Set(others)].filter((h, i, a) => a.every((k, j) => j >= i || Math.abs(parseInt(k) - parseInt(h)) >= 3));
    out.push(makeQ(`How tall is ${x.c.n}?`, `${x.cm} cm`, spread, `${x.c.n} is ${x.cm} cm tall.`, charHref(show, x.c), r));
  }
  // Japanese voice actor.
  const voiced = cast.filter((x) => x.c.jp?.n);
  for (const x of voiced.slice(0, 10)) out.push(makeQ(`Who voices ${x.c.n} in Japanese?`, x.c.jp!.n, voiced.filter((y) => y.c.jp!.n !== x.c.jp!.n).map((y) => y.c.jp!.n), `${x.c.jp!.n} voices ${x.c.n} in the Japanese version.`, charHref(show, x.c), r));
  // Blood type, where it's a real one.
  for (const x of cast.filter((y) => y.c.bt && /^(A|B|O|AB)$/.test(y.c.bt)).slice(0, 4)) out.push(makeQ(`What is ${x.c.n}'s blood type?`, x.c.bt!, ["A", "B", "O", "AB"], `${x.c.n}'s official blood type is ${x.c.bt}.`, charHref(show, x.c), r));
  return out.filter((q): q is TriviaQ => q !== null);
}

type SnapRowT = [string, string, string, string | null, string | null, number | null, string, string];
const ORDERS = (snap as unknown as { orders: { e: SnapRowT[] }[] }).orders;
function watchOrderQs(show: TriviaShow, r: () => number): TriviaQ[] {
  if (!show.wo) return [];
  const o = ORDERS.find((x) => x.e.some((e) => e[1] === show.wo));
  if (!o) return [];
  const h = `/watch-order/${show.woPage ?? show.wo}`;
  const mains = o.e.filter((e) => e[6] === "main" && e[4]);
  const out: (TriviaQ | null)[] = [];
  for (const e of mains.slice(0, 6)) {
    const y = Number(e[4]!.slice(0, 4));
    const years = [-4, -3, -2, -1, 1, 2, 3, 4].map((d) => String(y + d)).filter((v) => Number(v) <= 2027);
    out.push(makeQ(`In which year did ${e[2]} first air in Japan?`, String(y), years, `${e[2]} premiered in ${y}.`, h, r));
  }
  for (const e of mains.filter((m) => m[5] && m[5] > 1 && (m[3] === "TV" || m[3] === "ONA")).slice(0, 4)) {
    const n = e[5]!;
    const near = [0.5, 0.75, 0.85, 1.15, 1.3, 1.5, 2].map((k) => String(Math.max(1, Math.round(n * k)))).filter((v) => Math.abs(Number(v) - n) >= Math.max(2, n * 0.1));
    out.push(makeQ(`How many episodes does ${e[2]} have?`, String(n), near, `${e[2]} has ${n} episodes.`, h, r));
  }
  return out.filter((q): q is TriviaQ => q !== null);
}

function fillerQs(show: TriviaShow, r: () => number): TriviaQ[] {
  const out: (TriviaQ | null)[] = [];
  for (const slug of show.filler ?? []) {
    const f = fillerFor(slug, null);
    if (!f || f.count < 5) continue;
    const name = f.entry.name ?? (slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "));
    const h = `/anime/${slug}/filler-list`;
    const n = f.count;
    const near = [0.6, 0.75, 0.85, 1.2, 1.35, 1.6].map((k) => String(Math.round(n * k))).filter((v) => Math.abs(Number(v) - n) >= Math.max(3, n * 0.1));
    out.push(makeQ(`How many filler episodes does ${name} have?`, String(n), near, `${n} of ${name}'s ${f.total} episodes are filler (${Math.round(f.share)}%).`, h, r));
    // Spot the filler: one filler episode among three canon ones (not mixed, recap or anime-canon).
    const canon = Array.from({ length: f.total }, (_, i) => i + 1).filter((e) => !f.filler.has(e) && !f.mixed.has(e) && !f.recap.has(e) && !f.animeCanon.has(e));
    const fill = [...f.filler];
    for (let k = 0; k < 2 && fill.length && canon.length >= 3; k++) {
      const e = fill[Math.floor(r() * fill.length)];
      out.push(makeQ(`Which of these ${name} episodes is filler?`, `Episode ${e}`, canon.map((c) => `Episode ${c}`), `Episode ${e} is filler; the others adapt the manga.`, h, r));
    }
  }
  return out.filter((q): q is TriviaQ => q !== null);
}

type ThemeT = { type: "OP" | "ED"; song: string | null };
const THEMES = (themeData as unknown as { themes: Record<string, { t: ThemeT[] }> }).themes;
const kitsuId = (() => { let m: Map<string, string> | null = null; return (slug: string) => (m ??= new Map(ORDERS.flatMap((o) => o.e.map((e) => [e[1], e[0]] as [string, string])))).get(slug); })();
const songsOf = (slugs: string[], type?: "OP" | "ED") => [...new Set(slugs.flatMap((s) => { const id = kitsuId(s); return id ? (THEMES[id]?.t ?? []) : []; }).filter((t) => t.song && (!type || t.type === type)).map((t) => t.song!))];
function themeQs(show: TriviaShow, r: () => number): TriviaQ[] {
  if (!show.themes) return [];
  const mine = new Set(songsOf(show.themes));
  const ops = songsOf(show.themes, "OP");
  // Distractors: other trivia shows' theme songs, never this show's own.
  const others = TRIVIA_SHOWS.filter((s) => s.slug !== show.slug).flatMap((s) => songsOf(s.themes ?? [])).filter((s) => !mine.has(s));
  const h = `/anime/${show.themes[0]}/openings-endings`;
  return shuffle(ops, r).slice(0, 6).map((song) => makeQ(`Which of these songs is a ${show.name} opening?`, song, others, `"${song}" is an opening theme of ${show.name}.`, h, r)).filter((q): q is TriviaQ => q !== null);
}

// Streaming services only: a TV channel isn't something that "streams" a show, and our dub rows don't list every
// channel that has aired one (Doraemon is on Disney Channel), so a channel could be a wrong "wrong answer".
const PLATFORM_NAMES = HINDI_PLATFORMS.filter((p) => platformKind(p.label) !== "tv").map((p) => p.label.replace(/ \(.*\)$/, ""));
function hindiQs(show: TriviaShow, r: () => number): TriviaQ[] {
  const d = show.hindi ? dubBySlug(show.hindi) : null;
  if (!d || d.status !== "available") return [];
  // Every platform any of its rows matches is "right" ("Muse India (YouTube)" is both Muse India and YouTube), so none can be a distractor.
  const mine = HINDI_PLATFORMS.filter((x) => d.platforms.some((p) => x.match.test(p.name))).map((x) => x.label.replace(/ \(.*\)$/, ""));
  if (!mine.length) return [];
  const q = makeQ(`Which of these streams ${show.name} with an official Hindi dub?`, mine[0], PLATFORM_NAMES.filter((p) => !mine.includes(p)), `${show.name} is on ${mine.join(", ")} in Hindi.`, dubHref(d), r);
  return q ? [q] : [];
}

function filmQs(show: TriviaShow, r: () => number): TriviaQ[] {
  const f = show.films ? filmFranchise(show.films) : null;
  if (!f) return [];
  const out: (TriviaQ | null)[] = [];
  const anime = f.films.filter((x) => !x.live_action);
  for (const x of shuffle(anime, r).slice(0, 15)) {
    const years = [-3, -2, -1, 1, 2, 3].map((d) => String(x.year + d)).filter((y) => !anime.some((o) => o !== x && o.en === x.en && String(o.year) === y));
    out.push(makeQ(`In which year did "${x.en}" come out in Japan?`, String(x.year), years, `${x.en} was released in ${x.year}.`, filmsPath(f.slug), r));
  }
  const now = anime.filter((x) => x.hindi === "available");
  const where = (x: (typeof anime)[number]) => (x.where.join(" ").match(/JioHotstar|Netflix|Prime Video|YouTube/) ?? [null])[0];
  for (const x of now.slice(0, 6)) {
    const w = where(x);
    if (!w) continue;
    out.push(makeQ(`Where can you watch "${x.en}" in Hindi?`, w, ["JioHotstar", "Netflix", "Prime Video", "Crunchyroll", "YouTube"].filter((p) => p !== w), `${x.en} has Hindi audio on ${w}.`, filmsPath(f.slug), r));
  }
  return out.filter((q): q is TriviaQ => q !== null);
}

/** Every question for a show, in a fixed order (pages pick 10 at random on the client). */
export function triviaBank(slug: string): TriviaQ[] {
  const show = triviaShow(slug);
  if (!show) return [];
  const r = rng(`trivia:${slug}`);
  const seen = new Set<string>();
  return [...characterQs(show, r), ...watchOrderQs(show, r), ...fillerQs(show, r), ...themeQs(show, r), ...hindiQs(show, r), ...filmQs(show, r)].filter((q) => !seen.has(q.q) && seen.add(q.q));
}

/** "Which anime has these characters?": three of a show's most-favourited characters, four anime to pick from. */
export function guessTheAnimeBank(): TriviaQ[] {
  const r = rng("trivia:guess-the-anime");
  const bySeries = new Map<string, SnapChar[]>();
  for (const c of allSnapChars()) bySeries.set(c.s, [...(bySeries.get(c.s) ?? []), c]);
  const shows = [...bySeries.entries()].filter(([, cs]) => cs.length >= 3).map(([s, cs]) => ({ s, t: cs[0].t, top: [...cs].sort((a, b) => b.f - a.f).slice(0, 3) }));
  // One title per franchise name, so "Naruto" and "Naruto: Shippuuden" aren't both options.
  const base = (t: string) => t.toLowerCase().split(/[:(]/)[0].replace(/\s+(season|part)\b.*$/, "").trim();
  const titles = [...new Map(shows.map((x) => [base(x.t), x.t])).values()];
  return shows.filter((x) => titles.includes(x.t)).slice(0, 80).map((x) =>
    makeQ(`Which anime has these characters: ${x.top.map(fanName).join(", ")}?`, x.t, titles.filter((t) => base(t) !== base(x.t)), `${x.top.map(fanName).join(", ")} are all from ${x.t}.`, `/anime/${x.s}`, r),
  ).filter((q): q is TriviaQ => q !== null);
}

/** The mixed quiz on /anime-quiz: a slice of every show's bank plus guess-the-anime. */
export function mixedBank(): TriviaQ[] {
  const r = rng("trivia:mixed");
  return shuffle([...TRIVIA_SHOWS.flatMap((s) => shuffle(triviaBank(s.slug), rng(`mix:${s.slug}`)).slice(0, 8)), ...guessTheAnimeBank().slice(0, 30)], r);
}

/** What a bank asks about, for descriptions ("character birthdays, voice actors and episode counts"). */
export function bankTopics(bank: TriviaQ[]): string[] {
  const T: [RegExp, string][] = [[/birthday/, "character birthdays"], [/How tall/, "heights"], [/voices/, "voice actors"], [/blood type/, "blood types"], [/In which year/, "release years"], [/How many episodes/, "episode counts"], [/filler/, "filler episodes"], [/opening/, "opening songs"], [/Hindi/, "Hindi dubs"], [/these characters/, "who's in which show"]];
  return T.filter(([re]) => bank.some((q) => re.test(q.q))).map(([, t]) => t);
}
export const listOf = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");

/** Shows with enough questions for their own page. */
export const triviaShows = (): TriviaShow[] => TRIVIA_SHOWS.filter((s) => triviaBank(s.slug).length >= MIN_BANK);
