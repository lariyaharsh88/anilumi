/**
 * Curated filler lists and manga / light-novel continuation points, keyed by Kitsu slug.
 * DRAFT (22 Oct 2026, written by Claude from memory): every entry has reviewed: false, and the site
 * shows a "draft" note until a human checks it (e.g. against animefillerlist.com and the manga)
 * and flips reviewed to true. Episode numbers follow Kitsu's numbering for that series.
 */
export type FillerEntry = { filler: string; mixed?: string; reviewed: boolean; note?: string };

export const FILLER: Record<string, FillerEntry> = {
  naruto: { filler: "26, 97, 101-106, 136-141, 143-219", reviewed: false, note: "Almost everything after episode 135 is filler; you can jump from 135 straight to Shippuden." },
  "naruto-shippuden": {
    filler: "57-71, 90-112, 144-151, 170-171, 176-196, 223-242, 257-260, 271, 279-281, 284-295, 303-320, 347-361, 376-377, 388-390, 394-413, 416, 422-423, 427-450, 460-462, 464-469, 480-483",
    mixed: "451-458",
    reviewed: false,
    note: "Episodes 451–458 adapt the Itachi Shinden novels: not manga, but well liked.",
  },
  bleach: { filler: "33, 50, 64-109, 128-137, 147-149, 168-189, 204-205, 213-214, 227-266, 287, 298-299, 303-305, 311-342, 355", reviewed: false },
  "one-piece": {
    filler: "54-61, 98-99, 102, 131-143, 196-206, 220-226, 279-283, 291-292, 303, 317-319, 326-336, 382-384, 406-407, 426-429, 457-458, 492, 542, 575-578, 590, 626-628, 747-750, 780-782, 895-896, 907, 1029-1030",
    reviewed: false,
    note: "One Piece's filler is short and scattered; the long arcs are all canon.",
  },
};

export type ContinueEntry = { medium: "manga" | "light novel"; chapter?: number; volume?: number; note?: string; reviewed: boolean; search: string };

/** Where the source picks up after the season or film with this slug ends. */
export const CONTINUE: Record<string, ContinueEntry> = {
  "yakusoku-no-neverland": { medium: "manga", chapter: 38, note: "Season 2 departs from the manga almost immediately, so read from here instead.", reviewed: false, search: "The Promised Neverland manga" },
  "chainsaw-man": { medium: "manga", chapter: 39, note: "The Reze Arc film adapts chapters 39–52.", reviewed: false, search: "Chainsaw Man manga" },
  "Chainsaw-Man--The-Movie-Reze-Arc": { medium: "manga", chapter: 53, reviewed: false, search: "Chainsaw Man manga" },
  "sousou-no-frieren": { medium: "manga", chapter: 61, reviewed: false, search: "Frieren Beyond Journey's End manga" },
  "jujutsu-kaisen-2": { medium: "manga", chapter: 137, note: "Picks up with the Culling Game.", reviewed: false, search: "Jujutsu Kaisen manga" },
  "tokyo-revengers-tenjikuhen": { medium: "manga", chapter: 186, reviewed: false, search: "Tokyo Revengers manga" },
  "vinland-saga-season-2": { medium: "manga", chapter: 101, reviewed: false, search: "Vinland Saga manga" },
  "made-in-abyss-retsujitsu-no-ougonkyou": { medium: "manga", chapter: 61, reviewed: false, search: "Made in Abyss manga" },
  "Kimetsu-no-Yaiba-Hashira-Geikohen": { medium: "manga", chapter: 140, note: "The Infinity Castle films adapt the story from here.", reviewed: false, search: "Demon Slayer manga" },
  "overlord-sei-oukoku-hen": { medium: "light novel", volume: 14, reviewed: false, search: "Overlord light novel volume 14" },
  "Mushoku-Tensei-Isekai-Ittara-Honki-Dasu-Season-2-Part-2": { medium: "light novel", volume: 13, reviewed: false, search: "Mushoku Tensei light novel volume 13" },
};
