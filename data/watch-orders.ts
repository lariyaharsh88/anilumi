/**
 * Editorial overrides for watch-order pages, keyed by the Kitsu slug of the franchise ROOT
 * (the first entry the graph walk resolves to). `intro` is shown under the title;
 * `skip` moves entries into the "safe to skip" list; `mainOrder` forces the core sequence.
 * Drafted 22 Oct 2026, pending review – keep claims factual and dated.
 */
export type WatchOrderOverride = { intro: string; skip?: string[]; mainOrder?: string[] };

export const WATCH_ORDER_OVERRIDES: Record<string, WatchOrderOverride> = {
  "attack-on-titan": {
    intro: "Watch the four TV seasons in release order. Season 3 is split into two parts and The Final Season came out in three batches between 2020 and 2023, ending with the two-part special. Skip the compilation movies, which only retell the series. Of the OVAs, No Regrets (Kuinaki Sentaku) is the one worth adding after Season 1; Junior High is an unrelated comedy spin-off.",
  },
  naruto: {
    intro: "Start with Naruto (2002), then Naruto: Shippuden, then Boruto. Episodes 136 to 219 of the original series are almost entirely filler, so you can go straight from episode 135 to Shippuden. Shippuden has long filler stretches as well, so keep a filler guide open. The films are standalone and optional except The Last, which is canon and sits just before Shippuden's final episodes.",
  },
  "one-piece": {
    intro: "There is one sequence: the TV series in order. Roughly a hundred of its 1,100-plus episodes are filler, but they come in short blocks, so use a filler guide rather than skipping whole arcs. The films are not canon; Strong World, Film Z, Stampede and Film Red are the ones with story ties, and none are required. Episode of East Blue and similar specials are recaps.",
  },
  "boku-no-hero-academia": {
    intro: "Release order is the right order: seasons 1 through 7, then the final season that began airing in October 2025. The three films (Two Heroes, Heroes Rising, World Heroes' Mission) slot after seasons 2, 4 and 5 and are optional. The OVAs are light side stories.",
  },
  "kimetsu-no-yaiba": {
    intro: "Season 1, then the Mugen Train film (or its TV re-cut, which adds one new episode, but not both), then the Entertainment District, Swordsmith Village and Hashira Training arcs, then the Infinity Castle film trilogy that started in 2025.",
  },
  "jujutsu-kaisen": {
    intro: "Jujutsu Kaisen 0 is a prequel film and works either before Season 1 or right after it, but it must come before Season 2, which refers to it directly. Then Season 2 (Hidden Inventory and Shibuya Incident) and Season 3, the Culling Game, from January 2026.",
  },
  "fullmetal-alchemist-brotherhood": {
    intro: "Brotherhood is the complete, manga-faithful adaptation and the one to watch. You do not need the 2003 series first; the two diverge halfway through. The Sacred Star of Milos film and the four OVAs are optional extras. Conqueror of Shamballa belongs to the 2003 series, not to Brotherhood.",
  },
  "fullmetal-alchemist": {
    intro: "The 2003 series follows the manga for its first half, then tells an original story that concludes in the film Conqueror of Shamballa, so watch series then film. If you only have time for one version, Brotherhood is the complete story.",
  },
  "hunter-x-hunter-2011": {
    intro: "The 2011 series covers everything the 1999 version did and continues much further, so start here and ignore the 1999 series and its OVAs. The two films, Phantom Rouge and The Last Mission, are non-canon side stories. Nothing comes after episode 148; the manga continues from there.",
  },
  "dragon-ball": {
    intro: "Dragon Ball, then Dragon Ball Z, then Dragon Ball Super, with Daima (2024) set between Z and Super, followed by the films Broly (2018) and Super Hero (2022). Kai is a trimmed re-edit of Z, so choose Z or Kai, not both. GT is a non-canon ending; watch it last or skip it.",
  },
  "sword-art-online": {
    intro: "Release order works: Season 1 (Aincrad and Fairy Dance), Season 2, the canon film Ordinal Scale, then Alicization and War of Underworld. The Progressive films retell the Aincrad arc in more detail and are optional. Alternative: Gun Gale Online is a separate spin-off with no shared cast.",
  },
  "re-zero-kara-hajimeru-isekai-seikatsu": {
    intro: "Season 1 (25 episodes), then Season 2 in two halves, then Season 3. The Director's Cut is Season 1 re-edited into double-length episodes, so pick one version. Of the OVAs, The Frozen Bond is a prequel and Memory Snow a light interlude set after episode 11; both are optional.",
  },
  "steins-gate": {
    intro: "Steins;Gate (24 episodes), then episode 23β, an alternate episode 23 that leads into Steins;Gate 0, then Steins;Gate 0, then the film Load Region of Déjà Vu as an epilogue. Watch 23β only after you have finished the original series.",
  },
  haikyuu: {
    intro: "Seasons 1 to 4 in order (Season 4 is split in two), then the 2024 film Decisive Battle at the Garbage Dump, which continues the story; a final film is planned. The OVAs are side matches and the recap films can be skipped.",
  },
  "tokyo-ghoul": {
    intro: "Tokyo Ghoul, then Tokyo Ghoul √A (an anime-original route), then the two seasons of Tokyo Ghoul:re. The adaptation is heavily compressed from √A onward, which is why many fans switch to the manga. The OVAs Jack and Pinto are prequel side stories.",
  },
  bleach: {
    intro: "Watch episodes 1 to 366 of the original series, then Thousand-Year Blood War, released in four parts between 2022 and 2025. The filler arcs (64–109, 128–137, 168–189, 204–205, 213–214, 227–266, 287, 298–299, 303–305 and 311–342) can be skipped without losing anything.",
  },
  "mob-psycho-100": {
    intro: "Three seasons in order. The Reigen special is a recap with a short epilogue, and the OVAs are side stories; none are required.",
  },
  overlord: {
    intro: "Four seasons in order, then the 2024 film The Sacred Kingdom, which adapts the next volume. The two compilation films retell Season 1 and can be skipped. Ple Ple Pleiades are comedy shorts.",
  },
  "kono-subarashii-sekai-ni-shukufuku-wo": {
    intro: "Season 1, Season 2, the film Legend of Crimson, then Season 3. An Explosion on This Wonderful World! is a prequel spin-off about Megumin and can be watched at any point. Each season has an optional OVA episode.",
  },
  "sousou-no-frieren": {
    intro: "Season 1 (28 episodes), then Season 2 from January 2026. There are no films or recaps to worry about.",
  },
  "fate-zero": {
    intro: "Fate/Zero is the prequel, but it spoils parts of Fate/stay night. The usual advice is Fate/stay night: Unlimited Blade Works first, then Fate/Zero, then the Heaven's Feel film trilogy. Start with Zero only if you insist on chronological order. The 2006 Fate/stay night series is skippable.",
  },
  bakemonogatari: {
    intro: "Release order is the intended order: Bakemonogatari, Nisemonogatari, Nekomonogatari (Black), Second Season, Hanamonogatari, Tsukimonogatari, Owarimonogatari, Koyomimonogatari, the Kizumonogatari films, Owarimonogatari II, Zoku Owarimonogatari, then Off & Monster Season (2024). Kizumonogatari is a prequel but lands best after Second Season.",
  },
  "spy-x-family": {
    intro: "Season 1 (two halves), then the standalone film Code: White if you want it, then Season 2 and Season 3 (October 2025).",
  },
  "chainsaw-man": {
    intro: "Season 1, then the 2025 film Reze Arc, which picks up directly where the series ends.",
  },
  "vinland-saga": {
    intro: "Two seasons in order. Season 2 changes tone and pace deliberately; it is the point of the story, so do not stop after Season 1.",
  },
  "made-in-abyss": {
    intro: "Season 1, then the film Dawn of the Deep Soul, which continues the story, then Season 2 (The Golden City of the Scorching Sun). The two compilation films retell Season 1 and can be skipped. A new film, Mezameru Shinpi, is due in 2026.",
  },
};
