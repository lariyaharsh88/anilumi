/**
 * Curated filler lists and manga / light-novel continuation points, keyed by Kitsu slug.
 * Filler lists were drafted from memory on 22 Oct 2026, then corrected and cross-checked against
 * AnimeFillerList on 28 Oct 2026 (`checked`). Continuation points are still drafts. `reviewed` stays false
 * until a human signs an entry off. Episode numbers follow Kitsu's numbering for that series.
 */
/**
 * `checked`: where and when the lists were cross-checked; `animeCanon`: anime-original episodes that still count as canon;
 * `recap`: clip shows; `source: "mal"` marks entries generated from MyAnimeList flags (data/filler-mal.json).
 */
export type FillerEntry = { filler: string; mixed?: string; animeCanon?: string; recap?: string; reviewed: boolean; checked?: string; note?: string; source?: "mal" };

export const FILLER: Record<string, FillerEntry> = {
  naruto: {
    filler: "26, 97, 101-106, 136-140, 143-219",
    mixed: "7, 9, 14-16, 18-21, 23-24, 27-30, 37-41, 43-47, 49, 52-60, 63, 66, 69-72, 74, 83, 98-100, 112-114, 126-127, 130-131, 141-142, 220",
    reviewed: false,
    checked: "AnimeFillerList, 28 Oct 2026",
    note: "Almost everything after episode 135 is filler; you can jump from 135 straight to Shippuden.",
  },
  "naruto-shippuden": {
    filler: "57-71, 91-112, 144-151, 170-171, 176-196, 223-242, 257-260, 271, 279-281, 284-295, 303-320, 347-361, 376-377, 388-390, 394-413, 416-417, 422-423, 427-450, 464-468, 480-483",
    mixed: "1-19, 24-25, 45, 49-50, 54, 56, 89-90, 113, 115, 127-128, 213, 254, 296, 324, 327-328, 330-331, 338, 346, 362, 385-386, 415, 419, 426, 451-458, 460-462, 469, 471-472, 478-479",
    animeCanon: "28",
    reviewed: false,
    checked: "AnimeFillerList, 28 Oct 2026",
    note: "Episodes 451–458 adapt the Itachi Shinden novels: not manga, but well liked.",
  },
  bleach: {
    filler: "33, 50, 64-108, 128-137, 147-149, 168-189, 204-205, 213-214, 228-266, 287, 298-299, 303-305, 311-341, 355",
    mixed: "8, 27, 32, 46, 109, 111, 116, 119-120, 124, 141, 143, 146, 156, 160-161, 190, 193, 206-207, 209, 222-223, 267-268, 274, 276, 284-285, 288, 290-291, 295-296, 310, 342-343, 345, 347, 351, 357",
    reviewed: false,
    checked: "AnimeFillerList, 28 Oct 2026",
  },
  "one-piece": {
    filler: "54-60, 98-99, 102, 131-143, 196-206, 220-225, 279-283, 291-292, 303, 317-319, 326-336, 382-384, 406-407, 426-429, 457-458, 492, 542, 575-578, 590, 626-627, 747-750, 780-782, 895-896, 907, 1029-1030",
    mixed: "45-47, 61, 68-69, 101, 226, 354, 421, 489, 520, 574, 625, 628, 633, 653, 657, 679, 690, 731, 738, 751, 777-778, 789, 803, 807, 878-879, 881-885, 887-890, 924, 988-989, 991",
    animeCanon: "50-51, 93, 213-216, 418-420, 453-456, 497-499, 506, 737, 775, 1084",
    reviewed: false,
    checked: "AnimeFillerList, 28 Oct 2026",
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
