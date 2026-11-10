/**
 * Curated filler lists and manga / light-novel continuation points, keyed by Kitsu slug.
 * Filler lists were drafted from memory on 22 Oct 2026, then corrected and cross-checked against
 * AnimeFillerList on 28 Oct 2026 (`checked`). Continuation points are drafts until reviewed. `reviewed` stays false
 * until a human signs an entry off; `reviewedOn` is that date (shown as "Checked by … on …"). Episode numbers follow Kitsu's numbering for that series.
 */
/**
 * `checked`: where and when the lists were cross-checked; `animeCanon`: anime-original episodes that still count as canon;
 * `recap`: clip shows; `source: "mal"` marks entries generated from MyAnimeList flags (data/filler-mal.json).
 */
export type FillerEntry = { /** The name people search, when Kitsu's English title differs. */ name?: string; filler: string; mixed?: string; animeCanon?: string; recap?: string; reviewed: boolean; /** ISO date a person reviewed it. */ reviewedOn?: string; checked?: string; note?: string; source?: "mal" };

export const FILLER: Record<string, FillerEntry> = {
  naruto: {
    filler: "26, 97, 101-106, 136-140, 143-219",
    mixed: "7, 9, 14-16, 18-21, 23-24, 27-30, 37-41, 43-47, 49, 52-60, 63, 66, 69-72, 74, 83, 98-100, 112-114, 126-127, 130-131, 141-142, 220",
    reviewed: true,
    reviewedOn: "2026-11-03",
    checked: "AnimeFillerList, 28 Oct 2026",
    note: "Almost everything after episode 135 is filler; you can jump from 135 straight to Shippuden.",
  },
  "naruto-shippuden": {
    name: "Naruto Shippuden",
    filler: "57-71, 91-112, 144-151, 170-171, 176-196, 223-242, 257-260, 271, 279-281, 284-295, 303-320, 347-361, 376-377, 388-390, 394-413, 416-417, 422-423, 427-450, 464-468, 480-483",
    mixed: "1-19, 24-25, 45, 49-50, 54, 56, 89-90, 113, 115, 127-128, 213, 254, 296, 324, 327-328, 330-331, 338, 346, 362, 385-386, 415, 419, 426, 451-458, 460-462, 469, 471-472, 478-479",
    animeCanon: "28",
    reviewed: true,
    reviewedOn: "2026-11-03",
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
    reviewed: true,
    reviewedOn: "2026-11-03",
    checked: "AnimeFillerList, 28 Oct 2026",
    note: "One Piece's filler is short and scattered; the long arcs are all canon.",
  },
  "boruto-naruto-next-generations": {
    name: "Boruto",
    filler: "16-17, 40-41, 48-50, 67-69, 96-97, 112-119, 138-140, 152-154, 156, 256",
    mixed: "1, 18, 24, 59, 93-95, 127, 157, 192, 210-211",
    animeCanon: "2-15, 25-38, 42-47, 51-52, 60, 70-92, 98-105, 120-126, 128-137, 141-147, 155, 158-180, 190-191, 209, 221-255, 257-281",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "Only 28 episodes are pure filler, but most of Boruto is anime-original story that AnimeFillerList counts as anime canon; the manga-adapted episodes are 19-23, 39, 53-58, 61-66, 106-111, 148-151, 181-189, 193-208, 212-220 and 282-293.",
  },
  "black-clover-tv": {
    name: "Black Clover",
    filler: "68, 82, 125, 131, 134-135, 142-149",
    mixed: "2, 8-9, 12, 30, 69, 102",
    animeCanon: "3, 13, 55-56, 130, 132-133, 136-141, 150-157",
    recap: "29, 66, 123-124",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "Most of Black Clover's skippable episodes sit between 123 and 149, and the final stretch from 158 to 170 is all manga canon.",
  },
  "fairy-tail": {
    filler: "9, 19, 50, 70-75, 125-150",
    mixed: "20, 49, 69, 151",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "The two long filler runs are the Daphne arc (70-75) and the Key of the Starry Sky arc (125-150); the rest is canon apart from a few one-offs.",
  },
  "fairy-tail-2014": {
    name: "Fairy Tail (2014)",
    filler: "27-51, 93",
    mixed: "7-8, 26, 80, 85, 95",
    animeCanon: "71, 81",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "This series restarts at episode 1 (it is episodes 176-277 of the full Fairy Tail run, renumbered here); the only big filler block is 27-51, the Eclipse Celestial Spirits arc plus omake-based specials.",
  },
  "fairy-tail-2018": {
    name: "Fairy Tail: Final Series",
    filler: "",
    mixed: "35",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "The final season has no filler; only episode 35 adds anime-only scenes. Numbered 1-51 here (episodes 278-328 of the full Fairy Tail run).",
  },
  "dragon-ball": {
    filler: "30-33, 45, 79-83, 127-132, 149-153",
    mixed: "29, 42, 44",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "Dragon Ball's filler is limited to short runs: 30-33, 45, 79-83, 127-132 and the closing 149-153.",
  },
  "dragon-ball-z": {
    filler: "9-10, 12-16, 39-43, 100, 102, 108-117, 124-125, 170-171, 174, 195-199, 202-203, 274, 288",
    mixed: "11, 17-18, 20, 44, 204, 229, 251, 287",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "The Garlic Jr. arc (108-117) and the Other World episodes (195-199) are DBZ's two longer filler runs; the rest is short one-offs.",
  },
  "dragon-ball-super": {
    filler: "4, 15, 42-46, 68-70, 73-76",
    mixed: "1-2, 89",
    animeCanon: "16-17, 22, 50, 52, 71-72, 78-81, 90-91, 94-95",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "Super's filler sits mainly in two short blocks, 42-46 and 68-76 (except 71-72, the anime-original Hit episodes); the Tournament of Power (77-131) is canon apart from a few anime-original episodes.",
  },
  "hunter-x-hunter-2011": {
    name: "Hunter x Hunter (2011)",
    filler: "",
    mixed: "12",
    recap: "13, 26",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "Hunter x Hunter (2011) has no real filler; episodes 13 and 26 are recaps you can skip.",
  },
  "inuyasha": {
    filler: "59, 63-65, 68, 72, 75-79, 89-101, 129-130, 133-134, 136-140, 162-163",
    mixed: "26, 57-58, 69, 83-84, 87, 102, 127-128, 135, 141-142, 144, 147-148, 160",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "Inuyasha's filler is scattered through episodes 59-163, with the longest run at 89-101; The Final Act is a separate series with no filler.",
  },
  "detective-conan": {
    filler: "6, 14, 17, 19, 21, 24-26, 29-30, 33, 36-37, 41, 44-45, 47, 51, 53, 55-56, 59, 61-62, 64-67, 71, 73-74, 79-80, 83, 87-90, 92-95, 97, 106-111, 119-120, 123-127, 135, 140, 143, 148-152, 155, 158-161, 165, 169, 175, 179-187, 196-198, 201-204, 207-211, 214-216, 225, 232, 235-237, 245, 248, 251-252, 255-257, 260-262, 264-265, 273, 276, 281-283, 294-300, 303, 314-315, 318-322, 328, 337, 342, 348-349, 352-353, 357, 360, 363-365, 368-370, 373, 376-380, 384, 388-389, 392-393, 397, 403-405, 409-410, 413-414, 418-420, 423-424, 426, 433-434, 437, 439-442, 448, 450-452, 456, 459, 461, 468, 471, 475, 478, 480, 483, 486, 489, 512, 518-520, 527, 536, 539-541, 544, 547-548, 553-556, 562, 565-567, 570, 577, 582, 588, 591, 594-596, 599, 602-607, 629-631, 634-641, 658, 663-666, 669-670, 677-680, 686-689, 692-698, 707-709, 716-721, 726, 729-730, 733, 735-737, 742-743, 750, 753, 757-758, 761-762, 767-769, 774-778, 784, 789-791, 794-807, 813, 816-821, 824-826, 829, 833-835, 838-842, 845-846, 851-852, 855-860, 865, 868-871, 875-877, 880, 883-884, 891-893, 898-900, 903-908, 911-915, 918, 921-924, 929-940, 943-951, 955-970, 975-982, 985-992, 996-999, 1002, 1006-1010, 1013-1017, 1021-1023, 1026-1028, 1030-1032, 1036-1037, 1039-1041, 1043-1044, 1047-1052, 1055-1058, 1062-1070, 1073-1076, 1080-1084, 1087-1092, 1095-1097, 1100-1104, 1107-1108, 1111-1114, 1117-1122, 1125-1129, 1132-1134, 1137-1143, 1146-1147, 1152-1163, 1168, 1173-1177, 1180-1183, 1186, 1188-1192, 1195-1203, 1206-1213, 1217-1219",
    animeCanon: "1187",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "About 47% of Detective Conan's aired episodes are anime-original standalone cases; the Black Organization storyline is carried by the manga-canon episodes.",
  },
  "gintama": {
    filler: "1-2, 50, 57, 75, 106, 114, 124, 135, 137, 150, 155, 164, 166, 171, 173-174, 185, 189",
    mixed: "82, 111, 120",
    recap: "125, 176",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "Gintama's 19 filler episodes in this 201-episode first series are scattered one-offs, never whole arcs.",
  },
  "d-gray-man": {
    filler: "14-18, 25, 27, 29-36, 41-50",
    mixed: "26, 63-64",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "D.Gray-man's filler is concentrated in episodes 14-50; from episode 51 onward it is almost entirely manga canon.",
  },
  "katekyo-hitman-reborn": {
    name: "Reborn!",
    filler: "84-85, 120-121, 142-153, 158, 179-188",
    mixed: "10, 29, 73, 119, 141, 159, 178, 189",
    recap: "56, 97, 154",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "Reborn's two filler arcs are the Arcobaleno Trials (142-153) and the Primo Family arc (179-188); the rest is almost all manga canon.",
  },
  "yu-yu-hakusho": {
    filler: "",
    mixed: "11, 13, 109, 111",
    animeCanon: "107-108",
    reviewed: false,
    checked: "AnimeFillerList and MyAnimeList episode flags, 10 Nov 2026",
    note: "Yu Yu Hakusho has no pure filler; episodes 107-108 expand the Demon World Tournament beyond what the manga shows.",
  },
};

export type ContinueEntry = { medium: "manga" | "light novel"; chapter?: number; volume?: number; note?: string; reviewed: boolean; reviewedOn?: string; search: string };

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
  "Kimetsu-no-Yaiba-Hashira-Geikohen": { medium: "manga", chapter: 140, note: "The Infinity Castle films adapt the story from here.", reviewed: true, reviewedOn: "2026-11-03", search: "Demon Slayer manga" },
  "overlord-sei-oukoku-hen": { medium: "light novel", volume: 14, reviewed: false, search: "Overlord light novel volume 14" },
  "Mushoku-Tensei-Isekai-Ittara-Honki-Dasu-Season-2-Part-2": { medium: "light novel", volume: 13, reviewed: false, search: "Mushoku Tensei light novel volume 13" },
};
