/**
 * Editorial overrides for watch-order pages, keyed by the Kitsu slug of ANY title in the
 * franchise (the first match in watch order wins). `label` names the franchise on the index;
 * `intro` is shown under the title; `skip` moves entries to "safe to skip"; `demote` turns a
 * core entry (typically a prequel film/OVA Kitsu roots the graph at) into an optional extra;
 * `mainOrder` forces the core sequence.
 * Drafted 22 Oct 2026 by Claude, pending human review – keep claims factual. Run
 * `npx tsx scripts/resolve-watch-orders.ts` after editing to confirm every key still matches.
 */
export type WatchOrderOverride = { label?: string; intro: string; skip?: string[]; demote?: string[]; mainOrder?: string[] };

export const WATCH_ORDER_OVERRIDES: Record<string, WatchOrderOverride> = {
  "attack-on-titan": {
    label: "Attack on Titan",
    intro: "Watch the four TV seasons in release order. Season 3 is split into two parts and The Final Season came out in three batches between 2020 and 2023, ending with the two-part special. Skip the compilation movies, which only retell the series. Of the OVAs, No Regrets (Kuinaki Sentaku) is the one worth adding after Season 1; Junior High is an unrelated comedy spin-off.",
  },
  naruto: {
    label: "Naruto",
    intro: "Start with Naruto (2002), then Naruto: Shippuden, then Boruto. Episodes 136 to 219 of the original series are almost entirely filler, so you can go straight from episode 135 to Shippuden. Shippuden has long filler stretches as well, so keep a filler guide open. The films are standalone and optional except The Last, which is canon and sits just before Shippuden's final episodes.",
  },
  "one-piece": {
    label: "One Piece",
    intro: "There is one sequence: the TV series in order. Roughly a hundred of its 1,100-plus episodes are filler, but they come in short blocks, so use a filler guide rather than skipping whole arcs. The films are not canon; Strong World, Film Z, Stampede and Film Red are the ones with story ties, and none are required. Episode of East Blue and similar specials are recaps.",
  },
  "boku-no-hero-academia": {
    label: "My Hero Academia",
    intro: "Release order is the right order: seasons 1 through 7, then the final season that began airing in October 2025. The three films (Two Heroes, Heroes Rising, World Heroes' Mission) slot after seasons 2, 4 and 5 and are optional. The OVAs are light side stories.",
  },
  "kimetsu-no-yaiba": {
    label: "Demon Slayer",
    intro: "Season 1, then the Mugen Train film (or its TV re-cut, which adds one new episode, but not both), then the Entertainment District, Swordsmith Village and Hashira Training arcs, then the Infinity Castle film trilogy that started in 2025.",
  },
  "jujutsu-kaisen": {
    label: "Jujutsu Kaisen",
    intro: "Jujutsu Kaisen 0 is a prequel film and works either before Season 1 or right after it, but it must come before Season 2, which refers to it directly. Then Season 2 (Hidden Inventory and Shibuya Incident) and Season 3, the Culling Game, from January 2026.",
  },
  "fullmetal-alchemist-brotherhood": {
    label: "Fullmetal Alchemist: Brotherhood",
    intro: "Brotherhood is the complete, manga-faithful adaptation and the one to watch. You do not need the 2003 series first; the two diverge halfway through. The Sacred Star of Milos film and the four OVAs are optional extras. Conqueror of Shamballa belongs to the 2003 series, not to Brotherhood.",
  },
  "fullmetal-alchemist": {
    label: "Fullmetal Alchemist (2003)",
    intro: "The 2003 series follows the manga for its first half, then tells an original story that concludes in the film Conqueror of Shamballa, so watch series then film. If you only have time for one version, Brotherhood is the complete story.",
  },
  "hunter-x-hunter-2011": {
    label: "Hunter x Hunter",
    intro: "The 2011 series covers everything the 1999 version did and continues much further, so start here and ignore the 1999 series and its OVAs. The two films, Phantom Rouge and The Last Mission, are non-canon side stories. Nothing comes after episode 148; the manga continues from there.",
  },
  "dragon-ball": {
    label: "Dragon Ball",
    intro: "Dragon Ball, then Dragon Ball Z, then Dragon Ball Super, with Daima (2024) set between Z and Super, followed by the films Broly (2018) and Super Hero (2022). Kai is a trimmed re-edit of Z, so choose Z or Kai, not both. GT is a non-canon ending; watch it last or skip it.",
  },
  "sword-art-online": {
    label: "Sword Art Online",
    intro: "Release order works: Season 1 (Aincrad and Fairy Dance), Season 2, the canon film Ordinal Scale, then Alicization and War of Underworld. The Progressive films retell the Aincrad arc in more detail and are optional. Alternative: Gun Gale Online is a separate spin-off with no shared cast.",
  },
  "re-zero-kara-hajimeru-isekai-seikatsu": {
    label: "Re:Zero",
    demote: ["re-zero-kara-hajimeru-isekai-seikatsu-hyouketsu-no-kizuna"],
    intro: "Season 1 (25 episodes), then Season 2 in two halves, then Season 3. The Director's Cut is Season 1 re-edited into double-length episodes, so pick one version. Of the OVAs, The Frozen Bond is a prequel and Memory Snow a light interlude set after episode 11; both are optional.",
  },
  "steins-gate": {
    label: "Steins;Gate",
    intro: "Steins;Gate (24 episodes), then episode 23β, an alternate episode 23 that leads into Steins;Gate 0, then Steins;Gate 0, then the film Load Region of Déjà Vu as an epilogue. Watch 23β only after you have finished the original series.",
  },
  haikyuu: {
    label: "Haikyuu!!",
    intro: "Seasons 1 to 4 in order (Season 4 is split in two), then the 2024 film Decisive Battle at the Garbage Dump, which continues the story; a final film is planned. The OVAs are side matches and the recap films can be skipped.",
  },
  "tokyo-ghoul": {
    label: "Tokyo Ghoul",
    intro: "Tokyo Ghoul, then Tokyo Ghoul √A (an anime-original route), then the two seasons of Tokyo Ghoul:re. The adaptation is heavily compressed from √A onward, which is why many fans switch to the manga. The OVAs Jack and Pinto are prequel side stories.",
  },
  bleach: {
    label: "Bleach",
    intro: "Watch episodes 1 to 366 of the original series, then Thousand-Year Blood War, which has been released in parts since 2022. The filler arcs (64–109, 128–137, 168–189, 204–205, 213–214, 227–266, 287, 298–299, 303–305 and 311–342) can be skipped without losing anything.",
  },
  "mob-psycho-100": {
    label: "Mob Psycho 100",
    intro: "Three seasons in order. The Reigen special is a recap with a short epilogue, and the OVAs are side stories; none are required.",
  },
  overlord: {
    label: "Overlord",
    intro: "Four seasons in order, then the 2024 film The Sacred Kingdom, which adapts the next volume. The two compilation films retell Season 1 and can be skipped. Ple Ple Pleiades are comedy shorts.",
  },
  "kono-subarashii-sekai-ni-shukufuku-wo": {
    label: "KonoSuba",
    intro: "Season 1, Season 2, the film Legend of Crimson, then Season 3. An Explosion on This Wonderful World! is a prequel spin-off about Megumin and can be watched at any point. Each season has an optional OVA episode.",
  },
  "sousou-no-frieren": {
    label: "Frieren",
    intro: "Season 1 (28 episodes), then Season 2 from January 2026. There are no films or recaps to worry about.",
  },
  "fate-zero": {
    label: "Fate series",
    intro: "Fate/Zero is the prequel, but it spoils parts of Fate/stay night. The usual advice is Fate/stay night: Unlimited Blade Works first, then Fate/Zero, then the Heaven's Feel film trilogy. Start with Zero only if you insist on chronological order. The 2006 Fate/stay night series is skippable.",
  },
  bakemonogatari: {
    label: "Monogatari series",
    intro: "Release order is the intended order: Bakemonogatari, Nisemonogatari, Nekomonogatari (Black), Second Season, Hanamonogatari, Tsukimonogatari, Owarimonogatari, Koyomimonogatari, the Kizumonogatari films, Owarimonogatari II, Zoku Owarimonogatari, then Off & Monster Season (2024). Kizumonogatari is a prequel but lands best after Second Season.",
  },
  "spy-x-family": {
    label: "Spy x Family",
    intro: "Season 1 (two halves), then the standalone film Code: White if you want it, then Season 2 and Season 3 (October 2025).",
  },
  "chainsaw-man": {
    label: "Chainsaw Man",
    intro: "Season 1, then the 2025 film Reze Arc, which picks up directly where the series ends.",
  },
  "vinland-saga": {
    label: "Vinland Saga",
    intro: "Two seasons in order. Season 2 changes tone and pace deliberately; it is the point of the story, so do not stop after Season 1.",
  },
  "made-in-abyss": {
    label: "Made in Abyss",
    intro: "Season 1, then the film Dawn of the Deep Soul, which continues the story, then Season 2 (The Golden City of the Scorching Sun). The two compilation films retell Season 1 and can be skipped. A new film, Mezameru Shinpi, is due in 2026.",
  },
  "code-geass-lelouch-of-the-rebellion": {
    label: "Code Geass",
    intro: "Watch Lelouch of the Rebellion (2006), then R2 (2008): that is the complete original story. Lelouch of the Re;surrection (2019) is a sequel film, but it follows the continuity of the 2017–2018 compilation trilogy, which changes a few key events, so watch the third compilation film (Glorification) or read a summary of the changes before it. Akito the Exiled is a five-part side story set between the two seasons with a separate cast, and Roze of the Recapture (2024) is a later standalone spin-off. Both are optional.",
  },
  "jojo-s-bizarre-adventure-2012": {
    label: "JoJo's Bizarre Adventure",
    intro: "Watch the parts in order: the 2012 series (Parts 1 and 2, Phantom Blood and Battle Tendency), Stardust Crusaders (two cours), Diamond Is Unbreakable, Golden Wind, then Stone Ocean (released in three batches). Each part has a new lead but builds on the previous ones, so don't skip ahead. The Thus Spoke Kishibe Rohan OVAs are optional side stories best watched after Diamond Is Unbreakable. The 2000 Stardust Crusaders OVA and the 2007 Phantom Blood film are older, partial adaptations you can ignore. Part 7, Steel Ball Run, follows Stone Ocean.",
  },
  "neon-genesis-evangelion": {
    label: "Evangelion",
    intro: "Watch the 26-episode TV series, then The End of Evangelion. The film shows the outside events that episodes 25 and 26 depict as an inner monologue; the TV ending and the film are two views of the same conclusion, so watch both. Death & Rebirth is mostly a recap plus an early cut of End of Evangelion's first half, so skip it. The Rebuild films (1.0, 2.0, 3.0, 3.0+1.0) are a separate retelling with their own continuity; watch them afterwards, in order.",
    skip: ["neon-genesis-evangelion-death-rebirth"],
  },
  gintama: {
    label: "Gintama",
    intro: "Gintama (2006), Gintama' (2011), Enchousen, then the film Be Forever Yorozuya (2013), Gintama° (2015), Gintama. (2017), Porori-hen, the two Silver Soul cours (2018) and finally the film Gintama: The Final (2021), which is the real ending. Be Forever Yorozuya is an alternate-future story released before the manga ended; it is well loved but optional. The first film (Benizakura) retells an arc from the TV series and can be skipped.",
  },
  "fairy-tail": {
    label: "Fairy Tail",
    intro: "Fairy Tail (2009, 175 episodes), Fairy Tail (2014, 102 episodes), Final Series (2018, 51 episodes), then the sequel 100 Years Quest (2024). The Key of the Starry Sky arc (episodes 125–150 of the first series) is anime-original filler. The two films, Phoenix Priestess and Dragon Cry, are standalone and optional; Dragon Cry fits best after the 2014 series.",
  },
  "mushoku-tensei-isekai-ittara-honki-dasu": {
    label: "Mushoku Tensei",
    intro: "Season 1 in two cours (2021), then Season 2 in two cours (2023–2024). Season 2 opens with an episode 0 (Guardian Fitz) that is a required prologue, not a recap. The OVA episodes are optional side stories. Later seasons appear in the list below as they are announced.",
  },
  "tensei-shitara-slime-datta-ken": {
    label: "That Time I Got Reincarnated as a Slime",
    intro: "Season 1 (2018), Season 2 in two parts (2021), the film Scarlet Bond (2022), then Season 3 (2024). The Slime Diaries (2021) is a comedy spin-off you can watch any time after Season 1, and the Visions of Coleus OVAs are optional. Newer seasons and films are added below as they are announced.",
  },
  "tate-no-yuusha-no-nariagari": {
    label: "The Rising of the Shield Hero",
    intro: "Seasons 1 to 4 in release order. Season 2 is short and had a mixed reception, but Season 3 picks up directly from it, so don't skip it. There are no films to slot in.",
  },
  "dungeon-ni-deai-wo-motomeru-no-wa-machigatteiru-no-darou-ka": {
    label: "DanMachi",
    intro: "Season 1, Season 2, Season 3, Season 4 (two parts) and Season 5 in order. Sword Oratoria is a spin-off that runs parallel to Season 1 from Aiz's side; watch it after Season 1. The film Arrow of the Orion is a standalone side story that also fits after Season 1.",
  },
  "psycho-pass": {
    label: "Psycho-Pass",
    intro: "Season 1, Season 2, the 2015 film, the three Sinners of the System films (2019), Season 3, then First Inspector (2020), which finishes Season 3's story. Providence (2023) is set between the 2015 film and Season 3, but it works best watched last. Psycho-Pass: New Edit is Season 1 re-cut into double-length episodes, so pick one version.",
    skip: ["psycho-pass-re-start"],
  },
  "cowboy-bebop": {
    label: "Cowboy Bebop",
    intro: "Watch the 26 sessions in order. The film Knockin' on Heaven's Door is set between sessions 22 and 23; watch it there or after the finale, but not before the series. Session XX (Mish-Mash Blues) is a recap.",
  },
  "kaguya-sama-wa-kokurasetai-tensai-tachi-no-renai-zunousen": {
    label: "Kaguya-sama: Love Is War",
    intro: "Season 1, Season 2, Season 3 (Ultra Romantic), then the film The First Kiss Never Ends, which adapts the next arc and continues straight on from Season 3. The 2025 special Stairway to Adulthood comes after the film.",
  },
  "oshi-no-ko": {
    label: "Oshi no Ko",
    intro: "Season 1, Season 2, then Season 3. The first episode is a 90-minute prologue that the whole story depends on, so don't skip it. There are no films or OVAs to slot in.",
  },
  "solo-leveling": {
    label: "Solo Leveling",
    intro: "Season 1 (2024), then Season 2 – Arise from the Shadow (2025). ReAwakening is a theatrical recap of Season 1 with the first two episodes of Season 2 attached, so skip it if you are watching Season 2 anyway.",
    skip: ["ore-dake-level-up-na-ken-reawakening"],
  },
  "dr-stone": {
    label: "Dr. Stone",
    intro: "Season 1, Stone Wars, the Ryusui special, New World (two cours), then Science Future, the final season, released in parts from 2025. Ryusui is a full-length episode that introduces a major character, so treat it as part of the main story.",
  },
  "blue-lock": {
    label: "Blue Lock",
    intro: "Season 1, then Season 2 (VS U-20 Japan). Episode Nagi (2024) is a film that retells Season 1 from Nagi's point of view with some new scenes; it is optional and lands best after Season 1, not before.",
    demote: ["blue-lock-episode-nagi"],
  },
  "tokyo-revengers": {
    label: "Tokyo Revengers",
    intro: "Season 1, then Christmas Showdown (Season 2) and the Tenjiku arc (Season 3). The continuation adapting the final arcs follows them. Chibi Reve is a set of comedy shorts and is optional.",
  },
  "one-punch-man": {
    label: "One Punch Man",
    intro: "Season 1 (2015), Season 2 (2019), then Season 3 (2025). The studio changed after Season 1 and the animation style is noticeably different, but the story continues directly. The OVAs and specials are short comedy extras.",
  },
  "yakusoku-no-neverland": {
    label: "The Promised Neverland",
    intro: "Watch Season 1. Season 2 departs from the manga almost immediately and compresses most of the remaining story into 11 episodes, so many fans stop after Season 1 and continue with the manga from chapter 38.",
  },
  "bungou-stray-dogs": {
    label: "Bungo Stray Dogs",
    intro: "Seasons 1 and 2, then the film Dead Apple, which is set between Seasons 2 and 3, then Seasons 3, 4 and 5. Season 2 opens with a four-episode flashback arc (The Dark Era) that is essential. Kitsu's links stop at Dead Apple, so the later seasons are not in the list below. Bungo Stray Dogs Wan! is a chibi comedy spin-off.",
  },
  "black-butler": {
    label: "Black Butler",
    intro: "Season 1 follows the manga for roughly its first half and then tells an anime-original story; Season 2 continues that anime-only plot, so skip it. The manga-faithful route after Season 1 is Book of Circus (2014), Book of Murder (OVA), the film Book of the Atlantic, then Public School Arc (2024) and Emerald Witch Arc (2025).",
    skip: ["black-butler-ii"],
  },
  "fruits-basket-2019": {
    label: "Fruits Basket",
    intro: "Watch the 2019 remake: three seasons (2019, 2020 and The Final in 2021) that adapt the whole manga, then Prelude (2022), a film about Kyoko's backstory with a short epilogue. The 2001 series covers only the start of the story and has an anime-original ending; skip it.",
  },
  "toaru-majutsu-no-index": {
    label: "A Certain Magical Index / Railgun",
    intro: "Index and Railgun share a world and overlap in time. Release order works well: Index (2008), Railgun (2009), Index II (2010), Railgun S (2013), the film Miracle of Endymion (2013), Index III (2018), Accelerator (2019) and Railgun T (2020). Railgun also stands on its own if you only want Misaka's story.",
  },
  "natsume-yuujinchou": {
    label: "Natsume's Book of Friends",
    intro: "Watch the seasons in order, from the first through Zoku, San, Shi, Go, Roku and Shichi, with the film Ephemeral Bond after the sixth season. Most episodes are self-contained, but character relationships build across seasons. Kitsu's sequel links stop after Shi, so the later seasons are not in the list below.",
  },
  "kuroko-no-basket": {
    label: "Kuroko's Basketball",
    intro: "Seasons 1 to 3, then The Last Game (2017), a sequel film. The Winter Cup compilation films retell Seasons 2 and 3 and can be skipped. Tip-Off is a short prequel special; it is optional and best after Season 1.",
    demote: ["kuroko-no-basket-tip-off"],
  },
  clannad: {
    label: "Clannad",
    intro: "Clannad (24 episodes), then After Story. The two OVAs, Another World: Tomoyo Chapter and Kyou Chapter, are optional what-if routes; watch them after the first season. The 2007 film is a separate adaptation and not part of this story.",
  },
  "tengen-toppa-gurren-lagann": {
    label: "Gurren Lagann",
    intro: "Watch the 27-episode series. The two films, Childhood's End and The Lights in the Sky Are Stars, retell it in condensed form; the second adds substantial new animation in its final act, so it is worth watching afterwards, but it is not a substitute for the series.",
  },
};
