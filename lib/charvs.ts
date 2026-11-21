/**
 * Character match-ups people search ("naruto vs luffy"): a side-by-side page on the facts both profiles have. Across
 * two series there is no canon answer, so no winner is declared; inside one series (Luffy vs Kaido) the page gives the
 * fights as they happened, behind a spoiler toggle. Only pairs with real search demand get a page (Bing keyword
 * research, 21 Nov 2026, impressions a year: "naruto vs luffy" 1.3K plus "luffy vs naruto" 0.8K, "luffy vs kaido"
 * 0.8K, "luffy vs katakuri" 0.4K; Google Keyword Planner, India: "gojo vs sukuna" 33K a month plus "sukuna vs gojo" 6.6K).
 * Pure given the data.
 */
import { snapByPage } from "./charsnap";
import { compareRow, type CompareRow } from "./charcompare";
import { characterNote } from "./charnotes";
import { characterDeep } from "./chardeep";

export type CharacterVs = {
  slug: string;
  /** Character page slugs, in the order people search them. */
  a: string;
  b: string;
  /** Short names as searched ("Naruto", "Luffy"). */
  an: string;
  bn: string;
  /** Where the two have actually appeared together, checked; null when they never have. */
  together: string | null;
  /** Same-series pairs: who won and each fight, with episodes (spoilers). Checked against two sources. */
  canon?: {
    winner: "a" | "b"; arc: string; summary: string; sources: string[];
    /** Episodes when animated (animeSlug, from, to); manga chapters otherwise, or as well. */
    bouts: { title: string; result: string; animeSlug: string | null; from: number | null; to: number | null; chapters?: [number, number] | null }[];
    /** When the anime hasn't reached the fight: where it stands ("Gojo vs Sukuna episode"). */
    animeStatus?: string;
  };
  /** Latest bounties in berries (One Piece), two sources each. */
  bounty?: { a: number; b: number; sources: string[] };
};

export const CHARACTER_VS: CharacterVs[] = [
  { slug: "naruto-vs-luffy", a: "naruto-uzumaki", b: "luffy-monkey-d", an: "Naruto", bn: "Luffy", together: "crossover video games such as J-Stars Victory VS (2014) and Jump Force (2019), never in either series' story" },
  {
    slug: "luffy-vs-kaido", a: "luffy-monkey-d", b: "one-piece-kaido", an: "Luffy", bn: "Kaido", together: "One Piece's Wano Country arc",
    canon: {
      winner: "a", arc: "Wano Country",
      summary: "Kaido wins their first two fights and Luffy wins the third. At Kuri a single blow from Kaido knocks Luffy out. On Onigashima's rooftop, after Luffy and four other Supernovas attack him together, Kaido knocks Luffy unconscious and throws him into the sea. Luffy comes back for a third fight, awakens Gear 5 and wins with a final punch that drives Kaido underground; Kaido then falls into the magma beneath Onigashima with Big Mom.",
      bouts: [
        { title: "Round 1: Kuri", result: "Kaido wins. Luffy attacks him at Kuri and is knocked out by one blow, then taken to the Udon prison.", animeSlug: "one-piece", from: 914, to: 915 },
        { title: "Round 2: Onigashima rooftop", result: "Kaido wins. He outlasts Luffy, Zoro, Law, Kid and Killer, then knocks Luffy unconscious and throws him off the island into the sea.", animeSlug: "one-piece", from: 1033, to: 1034 },
        { title: "Round 3: Gear 5", result: "Luffy wins. He returns to the roof, awakens Gear 5 in episode 1071 and lands the final punch in episode 1076; Kaido falls into the magma in episode 1077.", animeSlug: "one-piece", from: 1049, to: 1077 },
      ],
      sources: ["https://en.wikipedia.org/wiki/One_Piece_season_20", "https://fictionhorizon.com/what-episode-and-chapter-does-luffy-fight-kaido-in/", "https://destructoid.com/?p=504966"],
    },
    bounty: { a: 3_000_000_000, b: 4_611_100_000, sources: ["https://www.cbr.com/one-piece-highest-bounties", "https://comicbook.com/anime/news/one-piece-bounties-yonko-blackbeard-shanks-kaido-big-mom-manga", "https://fictionhorizon.com/one-piece-all-of-luffys-bounties/"] },
  },
  {
    slug: "luffy-vs-katakuri", a: "luffy-monkey-d", b: "katakuri", an: "Luffy", bn: "Katakuri", together: "One Piece's Whole Cake Island arc",
    canon: {
      winner: "a", arc: "Whole Cake Island",
      summary: "Luffy wins. Their duel in Brulee's Mirro-World is the longest fight of the arc: Katakuri's Observation Haki lets him see a little into the future, and Luffy learns to do the same while fighting him. When Katakuri's sister Flampe secretly wounds Luffy, Katakuri stabs himself in the same place to keep the fight fair. Luffy wins in episode 871 (manga chapter 896), and Katakuri falls on his back.",
      bouts: [
        { title: "The Mirro-World duel", result: "Luffy wins after a fight that runs across about twenty episodes, using Gear Fourth's new Snakeman form.", animeSlug: "one-piece", from: 871, to: null },
      ],
      sources: ["https://fictionhorizon.com/in-what-episode-does-luffy-fight-katakuri-how-did-the-fight-play-out/", "https://www.oneesports.gg/anime/in-what-episode-does-luffy-fight-katakuri/", "https://comicbook.com/anime/news/one-piece-luffy-katakuri-fight-winner-manga-896"],
    },
    bounty: { a: 3_000_000_000, b: 1_057_000_000, sources: ["https://www.cbr.com/one-piece-highest-bounties", "https://comicbook.com/anime/news/one-piece-bounties-yonko-blackbeard-shanks-kaido-big-mom-manga", "https://fictionhorizon.com/one-piece-all-of-luffys-bounties/"] },
  },
  {
    slug: "gojo-vs-sukuna", a: "jujutsu-kaisen-satoru-gojou", b: "jujutsu-kaisen-sukuna", an: "Gojo", bn: "Sukuna", together: "Jujutsu Kaisen's Shinjuku Showdown arc",
    canon: {
      winner: "b", arc: "Shinjuku Showdown",
      summary: "Sukuna wins. Their duel in Shinjuku runs from manga chapter 223 to 236, with both of them expanding their Domains again and again. Gojo seems to have won at the end of chapter 235, but chapter 236 reveals that Sukuna, after letting Mahoraga adapt to Gojo's Infinity, used a slash that cuts through space itself and cut Gojo in half. Gojo dies, and the rest of the arc is the other sorcerers' fight against Sukuna.",
      bouts: [
        { title: "The Shinjuku duel", result: "Sukuna wins: Gojo is cut in half in chapter 236.", animeSlug: null, from: null, to: null, chapters: [223, 236] },
      ],
      animeStatus: "The anime hasn't reached this fight yet. Season 3 (The Culling Game Part 1) ended in March 2026. Season 4 (The Culling Game Part 2), due in 2027, adapts the rest of the Culling Game, which ends with Gojo's release from the Prison Realm; the duel follows straight after it in the manga.",
      sources: ["https://dexerto.com/anime/jujutsu-kaisen-shinjuku-showdown-explained-2868942", "https://sportskeeda.com/anime/sukuna-vs-gojo-truly-ended-long-time-ago-and-jujutsu-kaisen-chapter-236-reveals-exactly-when", "https://beebom.com/jujutsu-kaisen-gojo-vs-sukuna", "https://www.omelete.com.br/mangas-animes/jujutsu-kaisen-culling-game-parte-2-4-temporada-novo-visual", "https://respawn.outlookindia.com/pop-culture/pop-culture-news/jujutsu-kaisen-season-4-reveals-culling-game-part-2-visual"],
    },
  },
];
/** "1,500,000,000 berries" (One Piece bounties are quoted with Western digit groups). */
export const berries = (n: number) => `${n.toLocaleString("en-US")} berries`;
/** Link text on the character pages. */
export const vsLinkText = (v: CharacterVs) =>
  !v.canon ? `${v.an} vs ${v.bn}: height, age, powers and who would win →`
    : v.canon.bouts.some((f) => f.from) ? `${v.an} vs ${v.bn}: who wins, every fight and episode →`
      : `${v.an} vs ${v.bn}: who wins, which chapter and when it's animated →`;

export const vsPath = (v: CharacterVs) => `/characters/${v.slug}`;
export const characterVs = (slug: string) => CHARACTER_VS.find((v) => v.slug === slug) ?? null;

export type VsSide = { slug: string; row: CompareRow; abilities: string | null; strength: { rank: string; summary: string; spoiler: boolean } | null };

/** Both sides, or null if either character is missing from the snapshot. */
export function vsSides(v: CharacterVs): [VsSide, VsSide] | null {
  const side = (slug: string): VsSide | null => {
    const snap = snapByPage(slug);
    if (!snap) return null;
    const s = characterDeep(slug)?.strength ?? null;
    return { slug, row: compareRow(snap), abilities: characterNote(slug)?.abilities ?? null, strength: s ? { rank: s.rank, summary: s.summary, spoiler: s.spoiler } : null };
  };
  const a = side(v.a), b = side(v.b);
  return a && b ? [a, b] : null;
}
