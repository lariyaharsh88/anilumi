/**
 * Character match-ups people search ("naruto vs luffy"): a side-by-side page on the facts both profiles have. Across
 * two series there is no canon answer, so no winner is declared; inside one series (Luffy vs Kaido) the page gives the
 * fights as they happened, behind a spoiler toggle. Only pairs with real search demand get a page (Bing keyword
 * research, 21 Nov 2026, impressions a year: "naruto vs luffy" 1.3K plus "luffy vs naruto" 0.8K, "luffy vs kaido"
 * 0.8K, "luffy vs katakuri" 0.4K; Google Keyword Planner, India: "gojo vs sukuna" 33K a month plus "sukuna vs gojo" 6.6K, "goku vs saitama" 12K, "naruto vs sasuke" 6.6K, "madara vs naruto" 2.4K,
 * "itachi vs sasuke" 1.9K, "gojo vs toji" 1.9K, "goku vs naruto" 1.6K, "yuji vs sukuna" 1.3K).
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
  {
    slug: "naruto-vs-sasuke", a: "naruto-uzumaki", b: "sasuke-uchiha", an: "Naruto", bn: "Sasuke", together: "Naruto and Naruto Shippuden, as teammates and rivals in Team 7",
    canon: {
      winner: "a", arc: "Sasuke Recovery Mission and Fourth Shinobi World War",
      summary: "They fight five times, and Sasuke has the better of it until the last one. Kakashi stops their rooftop duel at the hospital, Sasuke beats Naruto at the Valley of the End and leaves for Orochimaru, and their two short Shippuden clashes end without a result. The final battle, back at the Valley of the End after the war, ends with both of them too hurt to stand, each missing an arm. It is close to a draw, but Sasuke admits defeat and gives up his plan, so the story counts it as Naruto's win.",
      bouts: [
        { title: "Round 1: Hospital rooftop", result: "No winner. Naruto's Rasengan and Sasuke's Chidori are about to meet when Kakashi throws them both into water tanks. Sasuke sees that Naruto's attack blew out the back of his tank, and his jealousy grows.", animeSlug: "naruto", from: 107, to: 108, chapters: [173, 177] },
        { title: "Round 2: Valley of the End", result: "Sasuke wins. After a long fight using the Nine-Tails' chakra and the Cursed Seal, their last Rasengan and Chidori clash leaves Naruto unconscious; Sasuke spares him and walks away to join Orochimaru.", animeSlug: "naruto", from: 128, to: 134, chapters: [218, 235] },
        { title: "Round 3: Orochimaru's hideout", result: "Sasuke has the upper hand. He holds off Naruto, Sai and Sakura and stabs Yamato, and is about to finish the team when Orochimaru and Kabuto stop him and take him away.", animeSlug: "naruto-shippuden", from: 51, to: 53, chapters: [305, 310] },
        { title: "Round 4: After the Five Kage Summit", result: "No winner. A single Rasengan-Chidori clash pulls them into a shared vision where they talk; Naruto promises they will die together in their next fight, and Tobi takes Sasuke away.", animeSlug: "naruto-shippuden", from: 215, to: 216, chapters: [485, 487] },
        { title: "Round 5: The final battle", result: "Naruto wins. Tailed Beast Mode against Susanoo, then fists; their last attacks cost each of them an arm, and the next morning Sasuke admits defeat in episode 478.", animeSlug: "naruto-shippuden", from: 476, to: 478, chapters: [694, 699] },
      ],
      sources: ["https://en.wikipedia.org/wiki/Naruto_season_3", "https://en.wikipedia.org/wiki/Naruto_season_4", "https://en.wikipedia.org/wiki/Naruto:_Shippuden_season_2", "https://en.wikipedia.org/wiki/Naruto:_Shippuden_season_10", "https://en.wikipedia.org/wiki/Naruto:_Shippuden_season_21", "https://naruto.fandom.com/wiki/The_Battle_Begins:_Naruto_vs._Sasuke", "https://naruto.fandom.com/wiki/A_Cry_on_Deaf_Ears", "https://naruto.fandom.com/wiki/The_End_of_Tears", "https://naruto.fandom.com/wiki/Reunion_(episode)", "https://naruto.fandom.com/wiki/Two_Fates", "https://naruto.fandom.com/wiki/The_Final_Battle", "https://naruto.fandom.com/wiki/The_Unison_Sign"],
    },
  },
  {
    slug: "madara-vs-naruto", a: "madara-uchiha", b: "naruto-uzumaki", an: "Madara", bn: "Naruto", together: "Naruto Shippuden's Fourth Shinobi World War",
    canon: {
      winner: "a", arc: "Fourth Shinobi World War",
      summary: "Madara wins both of their fights, but Naruto's side wins the war. Brought back to life, Madara uses the Gedo Statue to tear the tailed beasts, Kurama's Yang half included, out of Naruto, who nearly dies. With the Sage of Six Paths' power Naruto and Sasuke fight him again, yet Madara still gets his Rinnegan back and casts the Infinite Tsukuyomi. Naruto never beats him: Black Zetsu stabs Madara and turns him into Kaguya, whom Naruto and Sasuke seal, and Madara dies talking with Hashirama.",
      bouts: [
        { title: "Round 1: Madara returns to life", result: "Madara wins. The Gedo Statue's chains pull the tailed beasts out of Naruto in episode 393, and losing Yang Kurama nearly kills him; episodes 394 to 413 in between are mostly flashbacks.", animeSlug: "naruto-shippuden", from: 391, to: 393, chapters: [656, 662] },
        { title: "Round 2: Six Paths Naruto and Sasuke", result: "Madara wins. Naruto saves Guy and fights Madara with Sasuke; Madara takes back his Rinnegan and casts the Infinite Tsukuyomi in episode 426 (episodes 422 and 423 are filler). Black Zetsu betrays him in episode 458.", animeSlug: "naruto-shippuden", from: 421, to: 426, chapters: [671, 677] },
      ],
      sources: ["https://en.wikipedia.org/wiki/Naruto:_Shippuden_season_18", "https://en.wikipedia.org/wiki/Naruto:_Shippuden_season_20", "https://naruto.fandom.com/wiki/Madara_Uchiha_Arises", "https://naruto.fandom.com/wiki/A_True_Ending", "https://naruto.fandom.com/wiki/The_Sage_of_the_Six_Paths_(episode)", "https://naruto.fandom.com/wiki/To_Rise_Up", "https://naruto.fandom.com/wiki/The_Infinite_Tsukuyomi", "https://fictionhorizon.com/is-naruto-stronger-than-madara-heres-what-we-think/"],
    },
  },
  {
    slug: "itachi-vs-sasuke", a: "itachi-uchiha", b: "sasuke-uchiha", an: "Itachi", bn: "Sasuke", together: "Naruto and Naruto Shippuden, as brothers",
    canon: {
      winner: "a", arc: "Itachi Pursuit",
      summary: "Itachi is the stronger brother, even though Sasuke is the one left standing. At the hotel in the original series Itachi breaks Sasuke's arm and puts him under Tsukuyomi without effort. Years later at the Uchiha hideout Sasuke wins on paper: Itachi, blind and dying of an illness, corners him with Susanoo, then taps his forehead and collapses dead. Tobi later reveals that Itachi meant to die by Sasuke's hand and held back. Revived in the war, Itachi fights beside Sasuke against Kabuto, then shows him the truth before passing on.",
      bouts: [
        { title: "Round 1: The hotel", result: "Itachi wins. Sasuke's Chidori is stopped bare-handed; Itachi breaks his wrist and knocks him out with Tsukuyomi before Jiraiya drives the Akatsuki pair off.", animeSlug: "naruto", from: 84, to: 85, chapters: [145, 148] },
        { title: "Round 2: The Uchiha hideout", result: "Sasuke wins on paper. Itachi seals Orochimaru away with Susanoo and has Sasuke at his mercy, but taps his forehead and dies of his illness in episode 138. He was holding back and meant to lose.", animeSlug: "naruto-shippuden", from: 135, to: 138, chapters: [383, 393] },
        { title: "Together against Kabuto", result: "Not a fight between them: the brothers meet again in episode 331 and team up against Kabuto. Itachi traps him with Izanami in episode 338 and ends the Reanimation Jutsu in episode 339.", animeSlug: "naruto-shippuden", from: 331, to: 339, chapters: [574, 590] },
      ],
      sources: ["https://en.wikipedia.org/wiki/Naruto_season_3", "https://en.wikipedia.org/wiki/Naruto:_Shippuden_season_6", "https://en.wikipedia.org/wiki/Naruto:_Shippuden_season_15", "https://naruto.fandom.com/wiki/Roar,_Chidori!_Brother_vs._Brother!", "https://naruto.fandom.com/wiki/Hate_Among_the_Uchihas:_The_Last_of_the_Clan!", "https://naruto.fandom.com/wiki/The_Longest_Moment", "https://naruto.fandom.com/wiki/The_End", "https://naruto.fandom.com/wiki/Sibling_Tag_Team", "https://naruto.fandom.com/wiki/I_Will_Love_You_Always", "https://fictionhorizon.com/did-itachi-let-sasuke-win-in-naruto-explained/"],
    },
  },
  {
    slug: "gojo-vs-toji", a: "jujutsu-kaisen-satoru-gojou", b: "jujutsu-kaisen-touji-fushiguro", an: "Gojo", bn: "Toji", together: "Jujutsu Kaisen's Hidden Inventory arc",
    canon: {
      winner: "a", arc: "Hidden Inventory",
      summary: "Toji wins the first fight and Gojo the second. In 2006 Toji ambushes a worn-out teenage Gojo at Jujutsu High, gets past Infinity with the Inverted Spear of Heaven and leaves him for dead, then shoots Riko Amanai. Gojo survives by using Reverse Cursed Technique for the first time, finds Toji at the Time Vessel Association and blasts away the left side of his body with his first Hollow Purple. Before dying, Toji tells him about his son Megumi.",
      bouts: [
        { title: "Round 1: Jujutsu High ambush", result: "Toji wins. He catches Gojo exhausted after two days of guarding Riko, cuts through Infinity with a technique-nullifying cursed tool and stabs him, apparently killing him.", animeSlug: "jujutsu-kaisen-2", from: 3, to: null, chapters: [71, 72] },
        { title: "Round 2: The rematch", result: "Gojo wins. Healed by Reverse Cursed Technique, he finds Toji after the bounty is paid and kills him with Hollow Purple.", animeSlug: "jujutsu-kaisen-2", from: 4, to: null, chapters: [74, 75] },
      ],
      sources: ["https://en.wikipedia.org/wiki/Jujutsu_Kaisen_season_2", "https://jujutsu-kaisen.fandom.com/wiki/Chapter_71", "https://jujutsu-kaisen.fandom.com/wiki/Chapter_72", "https://jujutsu-kaisen.fandom.com/wiki/Chapter_74", "https://jujutsu-kaisen.fandom.com/wiki/Chapter_75", "https://www.sportskeeda.com/anime/jujutsu-kaisen-season-2-episode-4-gojo-returns-dead-fight-toji-geto-loses-battle"],
    },
  },
  {
    slug: "yuji-vs-sukuna", a: "jujutsu-kaisen-yuji-itadori", b: "jujutsu-kaisen-sukuna", an: "Yuji", bn: "Sukuna", together: "Jujutsu Kaisen, with Sukuna living inside Yuji's body",
    canon: {
      winner: "a", arc: "Shinjuku Showdown",
      summary: "Sukuna wins every early clash; Yuji wins the one that counts. In season 1 Sukuna refuses to give back Yuji's body, tears out his heart, then beheads him inside his innate domain and forces the Enchain vow on him. Later Sukuna moves into Megumi's body and escapes Yuji with Uraume's help. In the Shinjuku Showdown Yuji, now able to use Shrine and his own Domain Expansion, fights him alongside Yuta, Maki, Todo and Nobara, and in chapter 268 tears Megumi free. Sukuna crumbles away.",
      bouts: [
        { title: "Round 1: The first finger", result: "Yuji wins. After swallowing the finger he keeps control of his body and pushes Sukuna back down, which nobody expected.", animeSlug: "jujutsu-kaisen", from: 1, to: 2, chapters: [1, 2] },
        { title: "Round 2: The detention centre and Sukuna's domain", result: "Sukuna wins. He keeps Yuji's body and tears out his heart so Yuji dies on switching back; inside his domain he beheads Yuji in an instant and forces the Enchain vow before Yuji revives.", animeSlug: "jujutsu-kaisen", from: 5, to: 6, chapters: [9, 11] },
        { title: "Round 3: Tokyo Colony No. 1", result: "No winner. Yuji, with Maki, attacks Sukuna in Megumi's body; Uraume freezes the area and Sukuna flies off on Nue. Manga only.", animeSlug: null, from: null, to: null, chapters: [213, 215] },
        { title: "Round 4: Shinjuku Showdown", result: "Yuji wins, with help. He opens his Domain Expansion in chapter 265, Nobara's Resonance breaks Sukuna's domain in chapter 267, and in chapter 268 his last punch tears Megumi out and Sukuna falls. Manga only.", animeSlug: null, from: null, to: null, chapters: [244, 268] },
      ],
      animeStatus: "The anime has animated the first two clashes (season 1, episodes 1, 2, 5 and 6). Season 3 (The Culling Game Part 1) ended in March 2026 at the Sendai Colony. Season 4 (The Culling Game Part 2), due in 2027, adapts the rest of the Culling Game, where Sukuna takes Megumi's body; the Shinjuku Showdown follows it in the manga, which ended with chapter 271 in September 2024.",
      sources: ["https://en.wikipedia.org/wiki/Jujutsu_Kaisen_season_1", "https://en.wikipedia.org/wiki/Jujutsu_Kaisen_season_3", "https://jujutsu-kaisen.fandom.com/wiki/Chapter_11", "https://jujutsu-kaisen.fandom.com/wiki/Episode_6", "https://jujutsu-kaisen.fandom.com/wiki/Yuji_Itadori,_Maki_Zenin_%26_Hana_Kurusu_vs._Sukuna", "https://jujutsu-kaisen.fandom.com/wiki/Jujutsu_Sorcerers_vs._Sukuna", "https://jujutsu-kaisen.fandom.com/wiki/Chapter_265", "https://jujutsu-kaisen.fandom.com/wiki/Chapter_268", "https://www.omelete.com.br/mangas-animes/jujutsu-kaisen-culling-game-parte-2-4-temporada-novo-visual"],
    },
  },
  { slug: "goku-vs-saitama", a: "goku-son", b: "saitama", an: "Goku", bn: "Saitama", together: null },
  { slug: "goku-vs-naruto", a: "goku-son", b: "naruto-uzumaki", an: "Goku", bn: "Naruto", together: "crossover video games such as Jump Super Stars (2005), Battle Stadium D.O.N (2006), J-Stars Victory VS (2014) and Jump Force (2019), never in either series' story" },
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
