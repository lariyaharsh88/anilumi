/**
 * Editorial overrides for watch-order pages, keyed by the Kitsu slug of ANY title in the
 * franchise (the first match in watch order wins). `label` names the franchise on the index;
 * `intro` is shown under the title; `skip` moves entries to "safe to skip"; `demote` turns a
 * core entry (typically a prequel film/OVA Kitsu roots the graph at) into an optional extra;
 * `mainOrder` forces the core sequence.
 * Drafted 22 Oct 2026 by Claude; `checked` is the date a person reviewed a guide (shown as "Checked by … on …",
 * and as lastReviewed in the page's JSON-LD). Keep claims factual. Run
 * `npx tsx scripts/resolve-watch-orders.ts` after editing to confirm every key still matches.
 */
export type WatchOrderOverride = { label?: string; intro: string; skip?: string[]; demote?: string[]; mainOrder?: string[]; /** Slugs to make core entries (fetched when Kitsu doesn't link them). */ promote?: string[]; /** Slugs to drop (unrelated crossovers). */ exclude?: string[]; /** Slugs shown as optional extras (retellings, reboots, sequel series), fetched when Kitsu doesn't link them. */ optional?: string[]; /** ISO date a person checked the guide (shown as "Checked on"). */ checked?: string };

export const WATCH_ORDER_OVERRIDES: Record<string, WatchOrderOverride> = {
  "attack-on-titan": {
    label: "Attack on Titan",
    intro: "Watch the four TV seasons in release order. Season 3 is split into two parts and The Final Season came out in three batches between 2020 and 2023, ending with the two-part special. Skip the compilation movies, which only retell the series. Of the OVAs, No Regrets (Kuinaki Sentaku) is the one worth adding after Season 1; Junior High is an unrelated comedy spin-off.",
    checked: "2026-11-03",
  },
  naruto: {
    label: "Naruto",
    intro: "Start with Naruto (2002), then Naruto: Shippuden, then Boruto. Episodes 136 to 219 of the original series are almost entirely filler, so you can go from episode 135 to episode 220, where Naruto leaves with Jiraiya, and then start Shippuden. Shippuden has long filler stretches as well, so keep a filler guide open. The films are standalone and optional except two canon ones: The Last, which sits just before Shippuden's final episodes, and Boruto: Naruto the Movie, which leads into Boruto.",
    promote: ["boruto-naruto-next-generations"],
  },
  "one-piece": {
    label: "One Piece",
    intro: "There is one sequence: the TV series in order. Roughly a hundred of its 1,100-plus episodes are filler, but they come in short blocks, so use a filler guide rather than skipping whole arcs. The films are not canon; Strong World, Film Z, Stampede and Film Red are the ones with story ties, and none are required. Episode of East Blue and similar specials are recaps.",
    optional: ["one-piece-strong-world", "one-piece-film-z", "one-piece-film-gold", "one-piece-stampede", "one-piece-film-red"],
    skip: ["one-piece-episode-of-east-blue-luffy-to-4-nin-no-nakama-no-daibouken"],
    checked: "2026-11-03",
  },
  "boku-no-hero-academia": {
    label: "My Hero Academia",
    intro: "Release order is the right order: seasons 1 through 7, then the final season that began airing in October 2025, then the bonus episode No. 170+1: More (May 2026), an epilogue set years later. The four films (Two Heroes, Heroes Rising, World Heroes' Mission and You're Next) fit after seasons 3, 4, 5 and 7 and are optional; Two Heroes is set just after the Season 2 exams, so it also works before Season 3. The OVAs are light side stories.",
  },
  "kimetsu-no-yaiba": {
    label: "Demon Slayer",
    intro: "Season 1, then the Mugen Train film (or its TV re-cut, which adds one new episode, but not both), then the Entertainment District, Swordsmith Village and Hashira Training arcs, then the Infinity Castle film trilogy that started in 2025.",
    checked: "2026-11-03",
  },
  "jujutsu-kaisen": {
    label: "Jujutsu Kaisen",
    intro: "Jujutsu Kaisen 0 is a prequel film and works either before Season 1 or right after it, but it must come before Season 2, which refers to it directly. Then Season 2 (Hidden Inventory and Shibuya Incident) and Season 3 (The Culling Game Part 1, January–March 2026). Part 2, the fourth season, has been announced.",
  },
  "fullmetal-alchemist-brotherhood": {
    label: "Fullmetal Alchemist: Brotherhood",
    intro: "Brotherhood is the complete, manga-faithful adaptation and the one to watch. You do not need the 2003 series first; the two diverge halfway through. The Sacred Star of Milos film and the four OVAs are optional extras. Conqueror of Shamballa belongs to the 2003 series, not to Brotherhood.",
  },
  "fullmetal-alchemist": {
    label: "Fullmetal Alchemist (2003)",
    intro: "The 2003 series follows the manga for its first half, then tells an original story that concludes in the film Conqueror of Shamballa, so watch series then film. If you only have time for one version, Brotherhood is the complete story.",
    optional: ["fullmetal-alchemist-brotherhood"],
  },
  "hunter-x-hunter-2011": {
    label: "Hunter x Hunter",
    intro: "The 2011 series covers everything the 1999 version did and continues much further, so start here and ignore the 1999 series and its OVAs. The two films, Phantom Rouge and The Last Mission, are non-canon side stories. Nothing comes after episode 148; the manga continues from there.",
  },
  "dragon-ball": {
    label: "Dragon Ball",
    intro: "Dragon Ball, then Dragon Ball Z, then Dragon Ball Super, with Daima (2024) set between Z and Super, followed by the films Broly (2018) and Super Hero (2022). Kai is a trimmed re-edit of Z, so choose Z or Kai, not both. GT is a non-canon ending; watch it last or skip it. The films Battle of Gods and Resurrection 'F' are retold in Super's first two arcs, so they are optional too, as is Dragon Ball Super: Beerus (from October 2026), a remastered version of Super's early arcs. The thirteen Z films from 1989 to 1995 are non-canon side stories. A new series, Dragon Ball Super: The Galactic Patrol, set after Broly, was announced in January 2026 with no date yet.",
    promote: ["dragon-ball-daima", "dragon-ball-super", "dragon-ball-super-broly", "dragon-ball-super-super-hero"],
    optional: ["dragon-ball-gt", "dragon-ball-gt-goku-gaiden-yuuki-no-akashi-wa-suushinchuu", "dragon-ball-kai", "dragon-ball-z-movie-14-kami-to-kami", "dragon-ball-z-movie-15", "dragon-ball-super-beerus"],
    mainOrder: ["dragon-ball", "dragon-ball-z", "dragon-ball-daima", "dragon-ball-super", "dragon-ball-super-broly", "dragon-ball-super-super-hero"],
  },
  "sword-art-online": {
    label: "Sword Art Online",
    intro: "Release order works: Season 1 (Aincrad and Fairy Dance), Season 2, the canon film Ordinal Scale, then Alicization and War of Underworld. The Progressive films retell the Aincrad arc in more detail and are optional. Extra Edition is mostly a recap of Season 1 with a short new story, and Unanswered//butterfly (July 2026) is a side-story film; both are optional. Alternative: Gun Gale Online is a separate spin-off with no shared cast.",
    optional: ["sword-art-online-progressive-movie-hoshi-naki-yoru-no-aria", "sword-art-online-progressive-movie-kuraki-yuuyami-no-scherzo", "unanswered-butterfly-sword-art-online"],
    demote: ["sword-art-online-extra-edition"],
    exclude: ["sword-art-online-movie-movie"],
  },
  "re-zero-kara-hajimeru-isekai-seikatsu": {
    label: "Re:Zero",
    demote: ["re-zero-kara-hajimeru-isekai-seikatsu-hyouketsu-no-kizuna"],
    skip: ["re-zero-kara-hajimeru-isekai-seikatsu-hyouketsu-no-kizuna-manner-movie"],
    intro: "Season 1 (25 episodes), then Season 2 in two halves, then Season 3, then Season 4 (April–September 2026). The Director's Cut is Season 1 re-edited into double-length episodes, so pick one version. Of the OVAs, The Frozen Bond is a prequel and Memory Snow a light interlude set after episode 11; both are optional.",
  },
  "steins-gate": {
    label: "Steins;Gate",
    intro: "Steins;Gate (24 episodes), then episode 23β, an alternate episode 23 that leads into Steins;Gate 0, then Steins;Gate 0, then the film Load Region of Déjà Vu as an epilogue. Watch 23β only after you have finished the original series.",
    promote: ["steins-gate-episode-23", "steins-gate-0"],
    demote: ["steins-gate-egoistic-poriomania"],
    mainOrder: ["steins-gate", "steins-gate-episode-23", "steins-gate-0", "steins-gate-fuka-ryouiki-no-deja-vu"],
  },
  haikyuu: {
    label: "Haikyuu!!",
    intro: "Seasons 1 to 4 in order (Season 4 is split in two), then the 2024 film Decisive Battle at the Garbage Dump, which continues the story; the second film, Haikyu!! vs. The Little Giant, is due in 2027. The OVAs are side matches and the recap films can be skipped.",
    promote: ["Haikyuu-Gomi-Suteba-no-Kessen"],
    mainOrder: ["haikyuu", "haikyuu-2", "haikyuu-karasuno-koukou-vs-shiratorizawa-gakuen-koukou", "haikyuu-to-the-top", "haikyuu-to-the-top-2", "Haikyuu-Gomi-Suteba-no-Kessen"],
  },
  "tokyo-ghoul": {
    label: "Tokyo Ghoul",
    intro: "Tokyo Ghoul, then Tokyo Ghoul √A (an anime-original route), then the two seasons of Tokyo Ghoul:re. The adaptation is heavily compressed from √A onward, which is why many fans switch to the manga. The OVAs Jack and Pinto are prequel side stories.",
  },
  bleach: {
    label: "Bleach",
    intro: "Watch episodes 1 to 366 of the original series, then Thousand-Year Blood War (50 episodes in four parts, 2022–2026), which adapts the final arc to the end. The filler episodes (33, 50, 64–108, 128–137, 147–149, 168–189, 204–205, 213–214, 228–266, 287, 298–299, 303–305, 311–341 and 355) can be skipped without losing anything; 109 and 342 mix canon and filler. The four films (Memories of Nobody, The DiamondDust Rebellion, Fade to Black and Hell Verse) are non-canon side stories and optional.",
  },
  "mob-psycho-100": {
    label: "Mob Psycho 100",
    intro: "Three seasons in order. The Reigen special is a recap with a short epilogue, and the OVAs are side stories; none are required.",
  },
  overlord: {
    label: "Overlord",
    intro: "Four seasons in order, then the 2024 film The Sacred Kingdom, which adapts the Holy Kingdom arc (light novel volumes 12 and 13). Season 4 skipped those two volumes, so the film fills that gap and is best watched after Season 4. The two compilation films retell Season 1 and can be skipped. Ple Ple Pleiades are comedy shorts, and Isekai Quartet is an optional crossover comedy.",
    skip: ["isekai-quartet-relay-pv"],
  },
  "kono-subarashii-sekai-ni-shukufuku-wo": {
    label: "KonoSuba",
    intro: "Season 1, Season 2, the film Legend of Crimson, then Season 3. Season 4 was announced in January 2026 and is due in 2027. An Explosion on This Wonderful World! (2023) is a prequel spin-off about Megumin and can be watched at any point. Each season has optional OVA episodes.",
    optional: ["kono-subarashii-sekai-ni-bakuen-wo"],
  },
  "sousou-no-frieren": {
    label: "Frieren",
    intro: "Season 1 (28 episodes), then Season 2 (January–March 2026). Season 3 is announced for October 2027. There are no films or recaps to worry about.",
  },
  "fate-zero": {
    label: "Fate series",
    intro: "Fate/Zero is the prequel, but it spoils parts of Fate/stay night. The usual advice is Fate/stay night: Unlimited Blade Works first, then Fate/Zero, then the Heaven's Feel film trilogy. Start with Zero only if you insist on chronological order. The 2006 Fate/stay night series is skippable.",
    promote: ["fate-stay-night-unlimited-blade-works-2014", "fate-stay-night-unlimited-blade-works-tv-2", "fate-stay-night-movie-heaven-s-feel", "fate-stay-night-movie-heaven-s-feel-2", "fate-stay-night-movie-heaven-s-feel-3"],
    mainOrder: ["fate-stay-night-unlimited-blade-works-2014", "fate-stay-night-unlimited-blade-works-tv-2", "fate-zero", "fate-zero-2nd-season", "fate-stay-night-movie-heaven-s-feel", "fate-stay-night-movie-heaven-s-feel-2", "fate-stay-night-movie-heaven-s-feel-3"],
    skip: ["fate-stay-night", "fate-stay-night-unlimited-blade-works", "fate-stay-night-tv-reproduction", "fate-zero-remix", "fate-zero-cafe"],
  },
  bakemonogatari: {
    label: "Monogatari series",
    intro: "Release order is the intended order: Bakemonogatari, Nisemonogatari, Nekomonogatari (Black), Second Season, Hanamonogatari, Tsukimonogatari, Owarimonogatari, Koyomimonogatari, the Kizumonogatari films, Owarimonogatari II, Zoku Owarimonogatari, then Off & Monster Season (2024). Kizumonogatari is a prequel but lands best after Second Season. Kizumonogatari: Koyomi Vamp (2024) re-edits the three Kizumonogatari films into one, so watch one or the other. A new Off & Monster Season episode, Wazamonogatari: Karen Ogre, has been announced for a winter broadcast.",
    promote: ["monogatari-series-off-monster-season"],
    exclude: ["mahou-shoujo-madoka-magica-movie-3-hangyaku-no-monogatari-magica-quartet-x-nisioisin", "nisekoimonogatari", "okitegami-kyouko-no-bibouroku-x-monogatari", "minna-to-manner-wo-manabou", "naisho-no-hanashi"],
  },
  "spy-x-family": {
    label: "Spy x Family",
    intro: "Season 1 (two halves, April–December 2022), then the standalone film Code: White (December 2023) if you want it, then Season 2 (October–December 2023) and Season 3 (October–December 2025). A fourth season and a second film were announced in November 2026, both for 2027.",
  },
  "chainsaw-man": {
    label: "Chainsaw Man",
    intro: "Season 1, then the 2025 film Reze Arc, which picks up directly where the series ends. A continuation, the Assassins Arc, was announced in December 2025.",
  },
  "vinland-saga": {
    label: "Vinland Saga",
    intro: "Two seasons in order. Season 2 changes tone and pace deliberately; it is the point of the story, so do not stop after Season 1.",
  },
  "made-in-abyss": {
    label: "Made in Abyss",
    intro: "Season 1, then the film Dawn of the Deep Soul, which continues the story, then Season 2 (The Golden City of the Scorching Sun). The two compilation films retell Season 1 and can be skipped. The film Awakening Mystery (Mezameru Shinpi), which opened in Japan in October 2026, continues after Season 2 and is the first of a new film series.",
  },
  "code-geass-lelouch-of-the-rebellion": {
    label: "Code Geass",
    intro: "Watch Lelouch of the Rebellion (2006), then R2 (2008): that is the complete original story. Lelouch of the Re;surrection (2019) is a sequel film, but it follows the continuity of the 2017–2018 compilation trilogy, which changes a few key events, so watch the third compilation film (Glorification) or read a summary of the changes before it. Akito the Exiled is a five-part side story set between the two seasons with a separate cast, and Roze of the Recapture (2024) is a later standalone spin-off. Both are optional.",
    optional: ["code-geass-hangyaku-no-lelouch-iii-oudou", "code-geass-akito-the-exiled-2-the-torn-up-wyvern", "code-geass-akito-the-exiled-3", "code-geass-akito-the-exiled-4", "code-geass-akito-the-exiled-5-to-those-who-are-precious", "code-geass-dakkan-no-z"],
  },
  "jojo-s-bizarre-adventure-2012": {
    label: "JoJo's Bizarre Adventure",
    intro: "Watch the parts in order: the 2012 series (Parts 1 and 2, Phantom Blood and Battle Tendency), Stardust Crusaders (two cours), Diamond Is Unbreakable, Golden Wind, then Stone Ocean (released in three batches). Each part has a new lead but builds on the previous ones, so don't skip ahead. The Thus Spoke Kishibe Rohan OVAs are optional side stories best watched after Diamond Is Unbreakable. The 1993–2002 Stardust Crusaders OVA and the 2007 Phantom Blood film are older, partial adaptations you can ignore. Part 7, Steel Ball Run, follows Stone Ocean; its first episode premiered on Netflix on March 19, 2026, and the remaining 11 episodes stream weekly from September 25, 2026.",
  },
  "neon-genesis-evangelion": {
    label: "Evangelion",
    intro: "Watch the 26-episode TV series, then The End of Evangelion. The film shows the outside events that episodes 25 and 26 depict as an inner monologue; the TV ending and the film are two views of the same conclusion, so watch both. Death & Rebirth is mostly a recap plus an early cut of End of Evangelion's first half, so skip it. The Rebuild films (1.0, 2.0, 3.0, 3.0+1.0) are a separate retelling with their own continuity; watch them afterwards, in order. A new Evangelion TV series from Studio Khara and CloverWorks, written by Yoko Taro, was announced in February 2026 and has no release date yet.",
    skip: ["neon-genesis-evangelion-death-rebirth"],
    promote: ["evangelion-1-0-you-are-not-alone", "evangelion-2-0-you-can-not-advance", "evangelion-3-0-you-can-not-redo", "evangelion-3-0-1-0"],
    exclude: ["evangelion-shito-hakata-shuurai"],
    mainOrder: ["neon-genesis-evangelion", "neon-genesis-evangelion-the-end-of-evangelion", "evangelion-1-0-you-are-not-alone", "evangelion-2-0-you-can-not-advance", "evangelion-3-0-you-can-not-redo", "evangelion-3-0-1-0"],
  },
  gintama: {
    label: "Gintama",
    intro: "Gintama (2006), Gintama' (2011), Enchousen, then the film Be Forever Yorozuya (2013), Gintama° (2015), Gintama. (2017), Porori-hen, the two Silver Soul cours (2018) and finally the film Gintama: The Final (2021), which is the real ending. Be Forever Yorozuya is an alternate-future story released before the manga ended; it is well loved but optional. The first film (Benizakura), the On Theater 2D compilation films and Yoshiwara in Flames (2026) retell arcs from the TV series and can be skipped, and the 2025 spin-off series Mr. Ginpachi's Zany Class is optional.",
    skip: ["gintama-on-theater-2d-ikkoku-keisei-hen"],
    demote: ["gintama-kanketsu-hen-yorozuya-yo-eien-nare"],
  },
  "fairy-tail": {
    label: "Fairy Tail",
    intro: "Fairy Tail (2009, 175 episodes), Fairy Tail (2014, 102 episodes), Final Series (2018, 51 episodes), then the sequel 100 Years Quest (2024). The Key of the Starry Sky arc (episodes 125–150 of the first series) is anime-original filler. The two films, Phoenix Priestess and Dragon Cry, are standalone and optional; Dragon Cry fits best after the 2014 series.",
  },
  "mushoku-tensei-isekai-ittara-honki-dasu": {
    label: "Mushoku Tensei",
    intro: "Season 1 in two cours (2021), then Season 2 in two cours (2023–2024). Season 2 opens with an episode 0 (Guardian Fitz) that is a required prologue, not a recap; Kitsu lists it separately, just before Season 2 below. The OVA (Eris the Goblin Slayer, 2022) is an optional side story. Season 3 Part 1 aired July–September 2026, with Part 2 due in 2027.",
    promote: ["mushoku-tensei-ii-isekai-ittara-honki-dasu-shugo-jutsushi-fitz"],
    mainOrder: ["mushoku-tensei-isekai-ittara-honki-dasu", "mushoku-tensei-isekai-ittara-honki-dasu-part-2", "mushoku-tensei-ii-isekai-ittara-honki-dasu-shugo-jutsushi-fitz", "mushoku-tensei-isekai-ittara-honki-dasu-season-2", "Mushoku-Tensei-Isekai-Ittara-Honki-Dasu-Season-2-Part-2", "Mushoku-Tensei-Isekai-Ittara-Honki-Dasu-Season-3", "mushoku-tensei-iii-isekai-ittara-honki-dasu-part-2"],
  },
  "tensei-shitara-slime-datta-ken": {
    label: "That Time I Got Reincarnated as a Slime",
    intro: "Season 1 (2018), Season 2 in two parts (2021), the film Scarlet Bond (2022), Season 3 (2024), the film Tears of the Azure Sea (February 2026), then Season 4 (from April 2026, planned as five cours). The Slime Diaries (2021) is a comedy spin-off you can watch any time after Season 1, and the Visions of Coleus OVAs are optional.",
  },
  "tate-no-yuusha-no-nariagari": {
    label: "The Rising of the Shield Hero",
    intro: "Seasons 1 to 4 in release order; Season 5 is due in 2027. Season 2 is short and had a mixed reception, but Season 3 picks up directly from it, so don't skip it. There are no films to slot in.",
  },
  "dungeon-ni-deai-wo-motomeru-no-wa-machigatteiru-no-darou-ka": {
    label: "DanMachi",
    intro: "Season 1, Season 2, Season 3, Season 4 (two parts) and Season 5 in order; Season 6 was announced in February 2026 but has no premiere date yet. Sword Oratoria is a spin-off that runs parallel to Season 1 from Aiz's side; watch it after Season 1. The film Arrow of the Orion is a standalone side story that also fits after Season 1.",
  },
  "psycho-pass": {
    label: "Psycho-Pass",
    intro: "Season 1, Season 2, the 2015 film, the three Sinners of the System films (2019), Season 3, then First Inspector (2020), which finishes Season 3's story. Providence (2023) is set between Sinners of the System and Season 3, but it works best watched last. Psycho-Pass: New Edit is Season 1 re-cut into double-length episodes, so pick one version.",
    skip: ["psycho-pass-re-start"],
    promote: ["psycho-pass-providence"],
  },
  "cowboy-bebop": {
    label: "Cowboy Bebop",
    intro: "Watch the 26 sessions in order. The film Knockin' on Heaven's Door is set between sessions 22 and 23; watch it there or after the finale, but not before the series. Session XX (Mish-Mash Blues) is a recap.",
  },
  "kaguya-sama-wa-kokurasetai-tensai-tachi-no-renai-zunousen": {
    label: "Kaguya-sama: Love Is War",
    intro: "Season 1, Season 2, Season 3 (Ultra Romantic), then the film The First Kiss That Never Ends, which adapts the next arc and continues straight on from Season 3. The 2025 special Stairway to Adulthood (December 31, 2025) comes after the film, and a concluding film, The Final Chapter, with an original story by Aka Akasaka, was announced the same night.",
  },
  "oshi-no-ko": {
    label: "Oshi no Ko",
    intro: "Season 1, Season 2, then Season 3 (January–March 2026); a fourth and final season was announced in March 2026. The first episode is a 90-minute prologue that the whole story depends on, so don't skip it. There are no films or OVAs to slot in.",
  },
  "solo-leveling": {
    label: "Solo Leveling",
    intro: "Season 1 (January–March 2024), then Season 2 – Arise from the Shadow (January–March 2025). ReAwakening is a theatrical recap of Season 1 with the first two episodes of Season 2 attached, so skip it if you are watching Season 2 anyway; the February 2024 special How to Get Stronger is also a recap. A film, Beyond the System, which continues after Season 2, was announced in July 2026 with no release date yet.",
    skip: ["ore-dake-level-up-na-ken-reawakening"],
  },
  "dr-stone": {
    label: "Dr. Stone",
    intro: "Season 1, Stone Wars, the Ryusui special, New World (two cours), then Science Future, the final season, which aired in three parts from January 2025 to June 2026. Ryusui is a full-length episode that introduces a major character, so treat it as part of the main story. Dr. Stone: Terraforming, which adapts the manga's epilogue set after the finale, was announced in October 2026; its date and format are not yet known.",
  },
  "blue-lock": {
    label: "Blue Lock",
    intro: "Season 1 (October 2022–March 2023), then Season 2, VS. U-20 Japan (October–December 2024). Episode Nagi (2024) is a film that retells Season 1 from Nagi's point of view with some new scenes; it is optional and lands best after Season 1, not before. A third season, Neo Egoist League, has been announced with no premiere date yet.",
    demote: ["blue-lock-episode-nagi"],
  },
  "tokyo-revengers": {
    label: "Tokyo Revengers",
    intro: "Season 1, then Christmas Showdown (Season 2) and the Tenjiku arc (Season 3). Season 4, the War of the Three Titans arc, follows; it premiered in October 2026. Chibi Reve is a set of comedy shorts and is optional.",
  },
  "one-punch-man": {
    label: "One Punch Man",
    intro: "Season 1 (2015), Season 2 (2019), then Season 3 (part 1 October–December 2025; part 2 set for January 2027). The studio changed after Season 1 and the animation style is noticeably different, but the story continues directly. The OVAs and specials are short comedy extras.",
  },
  "yakusoku-no-neverland": {
    label: "The Promised Neverland",
    intro: "Watch Season 1. Season 2 departs from the manga almost immediately and compresses most of the remaining story into 11 episodes, so many fans stop after Season 1 and continue with the manga from chapter 38.",
  },
  "bungou-stray-dogs": {
    label: "Bungo Stray Dogs",
    intro: "Seasons 1 and 2, then the film Dead Apple (2018), which is set between Seasons 2 and 3, then Season 3 (2019), Season 4 (January–March 2023) and Season 5 (July–September 2023). Season 2 opens with a four-episode flashback arc (The Dark Era) that is essential. No sixth season has been announced. Bungo Stray Dogs Wan! (2021, with a second season in 2026) is a chibi comedy spin-off.",
    promote: ["bungou-stray-dogs-3", "bungou-stray-dogs-4", "bungou-stray-dogs-5"],
    mainOrder: ["bungou-stray-dogs", "bungou-stray-dogs-2", "bungou-stray-dogs-dead-apple", "bungou-stray-dogs-3", "bungou-stray-dogs-4", "bungou-stray-dogs-5"],
  },
  "black-butler": {
    label: "Black Butler",
    intro: "Season 1 follows the manga for roughly its first half and then tells an anime-original story; Season 2 continues that anime-only plot, so skip it. The manga-faithful route after Season 1 is Book of Circus (2014), Book of Murder (OVA), the film Book of the Atlantic, then Public School Arc (2024) and Emerald Witch Arc (2025).",
    skip: ["black-butler-ii"],
    promote: ["black-butler-book-of-circus", "black-butler-book-of-murder", "black-butler-book-of-the-atlantic", "kuroshitsuji-2024", "kuroshitsuji-midori-no-majo-hen"],
    mainOrder: ["black-butler", "black-butler-book-of-circus", "black-butler-book-of-murder", "black-butler-book-of-the-atlantic", "kuroshitsuji-2024", "kuroshitsuji-midori-no-majo-hen"],
  },
  "fruits-basket-2019": {
    label: "Fruits Basket",
    intro: "Watch the 2019 remake: three seasons (2019, 2020 and The Final in 2021) that adapt the whole manga, then Prelude (2022), a film about Kyoko's backstory with a short epilogue. The 2001 series covers only the start of the story and has an anime-original ending; skip it.",
  },
  "toaru-majutsu-no-index": {
    label: "A Certain Magical Index / Railgun",
    intro: "Index and Railgun share a world and overlap in time. Release order works well: Index (2008), Railgun (2009), Index II (2010), the film Miracle of Endymion (February 2013), Railgun S (April 2013), Index III (2018), Accelerator (2019) and Railgun T (2020). Railgun also stands on its own if you only want Misaka's story. A fourth Railgun season was announced in February 2025 and has no release date yet.",
    promote: ["toaru-kagaku-no-railgun", "toaru-kagaku-no-railgun-s", "toaru-kagaku-no-accelerator", "toaru-kagaku-no-railgun-t"],
    mainOrder: ["toaru-majutsu-no-index", "toaru-kagaku-no-railgun", "toaru-majutsu-no-index-ii", "toaru-kagaku-no-railgun-s", "toaru-majutsu-no-index-iii", "toaru-kagaku-no-accelerator", "toaru-kagaku-no-railgun-t"],
  },
  "natsume-yuujinchou": {
    label: "Natsume's Book of Friends",
    intro: "Watch the seven seasons in order: Natsume's Book of Friends (2008), Zoku (2009), San (2011), Shi (2012), Go (2016), Roku (2017) and Shichi (2024), with the film Ephemeral Bond (September 2018) after Roku. The 2021 film The Waking Rock and the Strange Visitor and the 2014 OVA Itsuka Yuki no Hi ni are optional extras. Most episodes are self-contained, but character relationships build across seasons.",
    promote: ["natsume-yuujinchou-go", "natsume-yuujinchou-roku", "natsume-yuujinchou-movie", "natsume-yuujinchou-shichi"],
    demote: ["natsume-yuujinchou-itsuka-yuki-no-hi-ni"],
    mainOrder: ["natsume-yuujinchou", "zoku-natsume-yuujinchou", "natsume-yuujinchou-san", "natsume-yuujinchou-shi", "natsume-yuujinchou-go", "natsume-yuujinchou-roku", "natsume-yuujinchou-movie", "natsume-yuujinchou-shichi"],
  },
  "kuroko-no-basket": {
    label: "Kuroko's Basketball",
    intro: "Seasons 1 to 3, then The Last Game (2017), a sequel film. The Winter Cup compilation films retell Seasons 2 and 3 and can be skipped. Tip-Off is a short prequel special; it is optional and best after Season 1.",
    demote: ["kuroko-no-basket-tip-off"],
  },
  clannad: {
    label: "Clannad",
    intro: "Clannad (23 episodes), then After Story. The two OVAs, Another World: Tomoyo Chapter and Kyou Chapter, are optional what-if routes; watch them after the first season. The 2007 film is a separate adaptation and not part of this story.",
  },
  "tengen-toppa-gurren-lagann": {
    label: "Gurren Lagann",
    intro: "Watch the 27-episode series. The two films, Childhood's End and The Lights in the Sky Are Stars, retell it in condensed form; the second adds substantial new animation in its final act, so it is worth watching afterwards, but it is not a substitute for the series.",
    optional: ["tengen-toppa-gurren-lagann-movie-lagann-hen"],
  },
  "nanatsu-no-taizai": {
    label: "The Seven Deadly Sins",
    intro: "TV seasons in order: The Seven Deadly Sins (2014–2015), Signs of Holy War (2016), Revival of the Commandments (2018), Imperial Wrath of the Gods (2019–2020) and Dragon's Judgement (2021). The film Prisoners of the Sky came out between the third and fourth seasons, and Cursed by Light followed the final season in July 2021. Grudge of Edinburgh (2022–2023) is a spin-off, and the sequel series Four Knights of the Apocalypse began in October 2023.",
    optional: ["nanatsu-no-taizai-ensa-no-edinburgh", "nanatsu-no-taizai-ensa-no-edinburgh-kouhen", "Nanatsu-no-Taizai-Mokushiroku-no-Yonkishi", "Nanatsu-no-Taizai-Mokushiroku-no-Yonkishi-2nd-season"],
  },
  "ansatsu-kyoushitsu-tv": {
    label: "Assassination Classroom",
    intro: "Season 1 (22 episodes, 2015) and Season 2 (25 episodes, 2016) tell the whole story; watch them in order. The 2014 special Meeting Time is an optional extra. After Season 2 comes the film Our Time (March 2026), which adds manga chapters the TV series left out and continues the main story. 365 Days' Time (2016) is a compilation film that retells the series, so you can skip it. Koro-sensei Q! (2016) is a separate comedy spin-off.",
    demote: ["ansatsu-kyoushitsu-tv-episode-0"],
    promote: ["ansatsu-kyoushitsu-minna-no-jikan"],
    mainOrder: ["ansatsu-kyoushitsu-tv", "ansatsu-kyoushitsu-tv-2", "ansatsu-kyoushitsu-minna-no-jikan"],
  },
  "no-game-no-life": {
    label: "No Game No Life",
    intro: "Watch the 12-episode series (2014) first, then the film No Game No Life: Zero (2017). Zero is a prequel set 6,000 years before the series and was released three years after it; it does not continue the TV story. The six specials released with the Blu-rays are optional, and the manners short and the Jibril promo video can be skipped.",
    demote: ["no-game-no-life-zero"],
    skip: ["no-game-no-life-zero-manner-movie", "satsuriku-tenshi-jibril-pv"],
  },
  noragami: {
    label: "Noragami",
    intro: "Noragami (January–March 2014), then Noragami Aragoto (October–December 2015). Each season has a two-episode OVA that was released with limited editions of the manga; they are optional side episodes and fit after the season they belong to. There are no films, and no recap episodes to skip.",
  },
  "shokugeki-no-souma": {
    label: "Food Wars!",
    intro: "Watch the five seasons in order: Food Wars! (2015), The Second Plate (2016), The Third Plate (two halves, October 2017 and April 2018, listed separately below), The Fourth Plate (2019) and The Fifth Plate (2020), the final season. The OVAs were released with manga volumes and are optional extras; watch each after the season it sits next to.",
  },
  "violet-evergarden": {
    label: "Violet Evergarden",
    intro: "Watch the 13-episode series (2018) and its extra episode from the final Blu-ray volume, then the side-story film Eternity and the Auto Memory Doll (2019), then Violet Evergarden: The Movie (2020), the sequel film. The commercials are promotional clips and can be skipped.",
  },
  "anohana-the-flower-we-saw-that-day": {
    label: "Anohana",
    intro: "Watch the 11-episode series (2011), then the 2013 film. The film is set a year after the series and revisits its events through each character's memories, so watch the series first. The short 2012 special and the promotional campaign clip are optional.",
  },
  "mirai-nikki-tv": {
    label: "Future Diary",
    intro: "Watch the 26-episode series (October 2011–April 2012), then the OVA Redial (2013), a short epilogue set after the final episode. The Ura Mirai Nikki shorts released alongside the series are optional. The 2010 pilot OVA is an earlier, separate version and is not needed.",
  },
  "ao-no-exorcist": {
    label: "Blue Exorcist",
    intro: "Watch Blue Exorcist (25 episodes, 2011), then Kyoto Saga (2017), Shimane Illuminati Saga (January 2024), Beyond the Snow Saga (October 2024) and The Blue Night Saga (January 2025); the last two are the two halves of the fourth season. Blue Exorcist: The Movie (2012) and the Kuro Runs Away From Home OVA are optional side stories that fit after the first season.",
  },
  "the-devil-is-a-part-timer": {
    label: "The Devil Is a Part-Timer!",
    intro: "Watch the 2013 series, then Season 2 (July–September 2022) and its second part (July–September 2023). Season 2 arrived nine years after the first season and continues its story. The Chiichai! Maou-sama!! shorts are optional, and the 2023 recap special can be skipped.",
  },
  "soul-eater": {
    label: "Soul Eater and Fire Force",
    intro: "Fire Force and Soul Eater are both by Atsushi Ohkubo, and the two series are connected in a way Fire Force's ending reveals, which is why both appear below; release order (Soul Eater first) works fine. Fire Force: Season 1 (2019), Season 2 (2020) and the final Season 3, which aired in two parts (April 2025 and January 2026). Soul Eater: one 51-episode series (April 2008–March 2009) that stands on its own. The Late Night Show version is the same episodes with extra footage, and Soul Eater Not! (2014) is a spin-off.",
  },
  durarara: {
    label: "Durarara!!",
    intro: "Durarara!! (24 episodes, 2010), then Durarara!!×2, which aired as three parts: Shō (January 2015), Ten (July 2015) and Ketsu (January 2016). Watch the three parts in that order; they are one continuous season. The specials released between episodes and parts are optional extras.",
  },
  "seishun-buta-yarou-wa-bunny-girl-senpai-no-yume-wo-minai": {
    label: "Rascal Does Not Dream (Bunny Girl Senpai)",
    intro: "Release order is story order: the TV series (2018), the films Dreaming Girl (2019), Sister Venturing Out (June 2023) and Knapsack Kid (December 2023), the second TV series Santa Claus (July–September 2025), then the film Dear Friend (October 16, 2026). The films are not side stories; they continue the main story between the two TV series, so do not skip them.",
  },
  another: {
    label: "Another",
    intro: "Another is a single 12-episode series (January–March 2012). The OVA The Other: Inga is set before the series but was released two months after it ended, as a bonus with the manga; it is optional and can be watched after the series. There are no sequels.",
    demote: ["another-the-other-inga"],
  },
  "mahou-shoujo-madoka-magica": {
    label: "Madoka Magica",
    intro: "Watch the 12-episode series (2011), then the sequel film Rebellion (2013), then Walpurgisnacht: Rising, which opened on August 28, 2026. The 2012 films Beginnings and Eternal retell the series and can be skipped if you watched it. Magia Record is a separate spin-off. The concept film, the manners short and the Sonico and Nisioisin collaboration clips are not part of the story.",
    skip: ["mahou-shoujo-madoka-magica-concept-movie", "mahou-shoujo-sonico-magica"],
    exclude: ["minna-to-manner-wo-manabou", "mahou-shoujo-madoka-magica-movie-3-hangyaku-no-monogatari-magica-quartet-x-nisioisin", "magia-record-mahou-shoujo-madoka-magica-gaiden"],
    optional: ["magia-record-mahou-shoujo-madoka-magica-gaiden-tv"],
  },
  "saiki-kusuo-no-psi-nan-tv": {
    label: "The Disastrous Life of Saiki K.",
    intro: "Season 1 (2016), Season 2 (2018), the Final Arc special (December 28, 2018), then Reawakened, six episodes released on Netflix on December 30, 2019. Season 1 aired as 120 short daily episodes that were also put together into 24 half-hour episodes, so pick one version, not both. The 2013 flash-anime short is optional.",
  },
  "chuunibyou-demo-koi-ga-shitai": {
    label: "Love, Chunibyo & Other Delusions",
    intro: "Season 1 (2012) and its OVA episode, then Season 2, Heart Throb (2014), the special The Rikka Wars, and the film Take On Me (2018), which is set after Season 2 and ends the anime. The 2013 film Rikka Version retells Season 1 and can be skipped. The Lite, Depth of Field and other shorts are optional extras.",
  },
  "yahari-ore-no-seishun-love-comedy-wa-machigatteiru": {
    label: "My Teen Romantic Comedy SNAFU (Oregairu)",
    intro: "SNAFU (2013), SNAFU Too! (2015), then SNAFU Climax! (July–September 2020), the third and final season. Each season has one OVA, released with a video game; they are optional and fit after their season. Kitsu lists the seasons by their Japanese titles: Yahari Ore no Seishun Love Comedy wa Machigatteiru, Zoku and Kan.",
  },
  "black-clover-tv": {
    label: "Black Clover",
    intro: "Watch the 170-episode series (October 2017–March 2021), then Season 2, which premiered on October 3, 2026. The film Sword of the Wizard King (June 2023) is an optional side story released between the two. The Jump Festa specials and the Petit Clover shorts are optional extras.",
  },
  "kobayashi-san-chi-no-maid-dragon": {
    label: "Miss Kobayashi's Dragon Maid",
    intro: "Season 1 (2017) and its OVA, then Dragon Maid S (July–September 2021) and its OVA, then the film A Lonely Dragon Wants to Be Loved (June 27, 2025), the sequel film. The Mini Dragon shorts and other specials are optional.",
    promote: ["kobayashisan-Chi-no-Maidragon-Samishii-Gariya-no-Ryuu", "kobayashi-san-chi-no-dragon-maid-s-ova"],
    optional: ["kobayashi-san-chi-no-maidragon-s-mini-dra"],
  },
  "magi-the-kingdom-of-magic": {
    label: "Magi",
    intro: "Start with Magi: The Labyrinth of Magic (2012–2013), then The Kingdom of Magic (2013–2014). Magi: Adventure of Sinbad (TV, 2016) is a prequel spin-off about Sinbad's youth; it was made after the main series and is optional, so watch it afterwards. A five-episode Adventure of Sinbad OVA (2014–2015) also exists and is optional.",
    demote: ["magi-sinbad-no-bouken-tv"],
    optional: ["magi-sinbad-no-bouken"],
  },
  nichijou: {
    label: "Nichijou",
    intro: "Nichijou is one 26-episode series (April–September 2011). The Episode 0 OVA, released with manga volume 6 shortly before the TV series, is optional. There are no other seasons or films. It was released in English as Nichijou: My Ordinary Life.",
    demote: ["nichijou-episode-0"],
  },
  "high-school-dxd": {
    label: "High School DxD",
    intro: "Watch the four seasons in order: High School DxD (2012), New (2013), BorN (2015) and Hero (2018), each followed by the OVA episodes listed after it. The first season's two OVAs were released as episodes 13 and 14, after the TV run ended. The short specials that came with the Blu-ray volumes are optional extras.",
    promote: ["high-school-dxd-hero-taiikukan-ura-no-holy"],
    mainOrder: ["high-school-dxd", "high-school-dxd-ova", "high-school-dxd-new", "high-school-dxd-new-ova", "high-school-dxd-born", "high-school-dxd-born-yomigaerarenai-pheonix", "high-school-dxd-hero-taiikukan-ura-no-holy", "high-school-dxd-hero"],
  },
  "log-horizon": {
    label: "Log Horizon",
    intro: "Season 1 (25 episodes, 2013–2014), Season 2 (25 episodes, 2014–2015), then Destruction of the Round Table (12 episodes, January–March 2021), the third season, which came out six years after the second. All three seasons follow one continuous story, so do not start with the third.",
  },
  "kyoukai-no-kanata": {
    label: "Beyond the Boundary",
    intro: "Watch the 12-episode series (October–December 2013), then the OVA Daybreak (Shinonome, July 2014), then the film I'll Be Here – Future (April 2015), which is set one year after the series. The first film, I'll Be Here – Past (March 2015), retells the TV series and can be skipped. The Idol Trial and Mini Theater shorts are optional.",
    demote: ["kyoukai-no-kanata-shinonome"],
  },
  "hellsing-ultimate": {
    label: "Hellsing",
    intro: "Watch Hellsing Ultimate, the 10-episode OVA series released from 2006 to 2012. The 2001 TV series Hellsing uses the same characters but tells a different story from the manga, so it is a separate adaptation, not a prequel or sequel. Hellsing: The Dawn, three short episodes included with Ultimate episodes 8 to 10, is an optional prequel side story and can be watched after Ultimate. Digest for Freaks is a recap.",
    demote: ["hellsing-the-dawn"],
  },
  "spice-and-wolf": {
    label: "Spice and Wolf",
    intro: "The original adaptation is Spice and Wolf (2008), the OVA The Wolf and the Amber Melancholy (April 2009), then Spice and Wolf II (July–September 2009). Spice and Wolf: Merchant Meets the Wise Wolf (25 episodes, April–September 2024) is a remake that starts the story over from the beginning; a second season of the remake is set for 2027. Pick one version and watch it from its first episode.",
  },
  "guilty-crown": {
    label: "Guilty Crown",
    intro: "Guilty Crown is a single 22-episode series (October 2011–March 2012). Lost Christmas, a short OVA bundled with a spin-off visual novel in 2012, is a prequel about the Lost Christmas incident; it is optional and can be watched after the series. Reassortment is a recap special, and the 4-koma shorts are optional extras.",
    demote: ["guilty-crown-lost-christmas"],
  },
  "the-disappearance-of-haruhi-suzumiya": {
    label: "Haruhi Suzumiya",
    intro: "Watch both TV seasons before the film: the 14 episodes from 2006 and the 14 new episodes from 2009, which Kitsu lists separately below. In 2009 the old and new episodes were broadcast together in story order, and that combined order is the easiest way to watch. Then watch The Disappearance of Haruhi Suzumiya (2010), which follows the 2009 episodes. Haruhi-chan and Nagato Yuki-chan are spin-offs.",
    promote: ["the-melancholy-of-haruhi-suzumiya-2009"],
  },
  "mahoutsukai-no-yome": {
    label: "The Ancient Magus' Bride",
    intro: "Those Awaiting a Star, a three-part prequel OVA (2016–2017), came out before the TV series; watch it first or after Season 1. Then watch Season 1 (24 episodes, 2017–2018), the three-part OVA The Boy from the West and the Knight of the Blue Storm (2021–2022) and Season 2, which aired in two parts in April and October 2023. The December 2017 special is a recap and can be skipped.",
  },
  "owari-no-seraph": {
    label: "Seraph of the End",
    intro: "Seraph of the End: Vampire Reign (April–June 2015), then Battle in Nagoya (October–December 2015); together they are one 24-episode series split into two halves. The OVA Vampire Shahar (2016) is an optional side story. The Seraph of the Endless omake shorts from the Blu-ray volumes are optional.",
  },
  nisekoi: {
    label: "Nisekoi",
    intro: "Season 1 (20 episodes, January–May 2014), then Season 2 (April–June 2015), whose title is written Nisekoi: with a colon. The OVAs were released with limited editions of the manga and are optional; watch each one after the season it is listed with.",
  },
  kakegurui: {
    label: "Kakegurui",
    intro: "Kakegurui (12 episodes, July–September 2017), then Kakegurui×× (12 episodes, January–March 2019). Kakegurui Twin (Netflix, August 2022, 6 episodes) is a prequel spin-off centred on Mary Saotome, set a year before the first season; it is optional and can be watched any time after Season 1.",
    demote: ["kakegurui-twin"],
  },
  "darker-than-black": {
    label: "Darker than Black",
    intro: "Watch Darker than Black (25 episodes, 2007), then the four-episode Gaiden OVA, then Gemini of the Meteor (October–December 2009). Gaiden was released in 2010 with Gemini of the Meteor's home video volumes, but it is set between the two seasons. Episode 26, Beneath the Fully Bloomed Cherry Blossoms, is an optional extra from the first season's final DVD.",
  },
  mushishi: {
    label: "Mushishi",
    intro: "Watch the 26-episode first season (2005–2006), then the special The Shadow That Devours the Sun (January 2014), Next Passage part 1 (April–June 2014), the special Path of Thorns (August 2014), Next Passage part 2 (October–December 2014) and the film Bell Droplets (May 2015), the final entry. The 2006 digest broadcast is a recap and can be skipped.",
  },
  "k-on": {
    label: "K-On!",
    intro: "K-On! (13 episodes, 2009), then K-On!! (26 episodes, April–September 2010), then K-On! The Movie (December 2011), an original story about the band's graduation trip to London. Each season has one OVA episode from its final Blu-ray volume (Live House! and Plan!) that is optional and fits after it. The Ura-On! shorts are optional extras.",
  },
  "black-lagoon": {
    label: "Black Lagoon",
    intro: "Black Lagoon (12 episodes, April–June 2006), then The Second Barrage (12 episodes, October–December 2006), then the five-episode OVA Roberta's Blood Trail (2010–2011), which continues the story. There are no films or recap episodes to skip.",
  },
  "yuri-on-ice": {
    label: "Yuri!!! on Ice",
    intro: "Yuri!!! on Ice is a single 12-episode series (October–December 2016). The short Welcome to The Madness, released with the final Blu-ray volume in May 2017, shows Yuri Plisetsky's exhibition skate and is an optional extra. The announced film Ice Adolescence was cancelled in April 2024, so there is nothing else to watch.",
    exclude: ["yuri-on-ice-movie-ice-adolescence"],
  },
  "mahouka-koukou-no-rettousei": {
    label: "The Irregular at Magic High School",
    intro: "Season 1 (26 episodes, 2014), the film The Girl Who Summons the Stars (2017), the Visitor Arc (October–December 2020), the Reminiscence Arc special (December 31, 2021), Season 3 (April–June 2024), then the film Yotsuba Succession Arc (May 8, 2026). Reminiscence Arc is a prequel about Tatsuya and Miyuki's past; it aired after the Visitor Arc. A further part was announced in June 2026. The Honor Student at Magic High School (2021) is a spin-off.",
    demote: ["mahouka-koukou-no-rettousei-tsuioku-hen"],
    promote: ["mahouka-koukou-no-rettousei-raihousha-hen", "mahouka-koukou-no-rettousei-3rd-season", "mahouka-koukou-no-rettousei-yotsuba-keishou-hen"],
    exclude: ["mahouka-koukou-no-rettousei-anime-part-2"],
    mainOrder: ["mahouka-koukou-no-rettousei", "mahouka-koukou-no-rettousei-movie-hoshi-wo-yobu-shoujo", "mahouka-koukou-no-rettousei-raihousha-hen", "mahouka-koukou-no-rettousei-3rd-season", "mahouka-koukou-no-rettousei-yotsuba-keishou-hen"],
  },
  "kimi-ni-todoke": {
    label: "Kimi ni Todoke",
    intro: "Season 1 (25 episodes, October 2009–March 2010), Season 2 (12 episodes, January–March 2011), then Season 3, which came out on Netflix in August 2024, more than 13 years later. The specials released alongside Season 2 are optional, and the recap specials can be skipped.",
  },
  "danganronpa-kibou-no-gakuen-to-zetsubou-no-koukousei-the-animation": {
    label: "Danganronpa",
    intro: "Danganronpa: The Animation (13 episodes, 2013) adapts the first game. Then watch Danganronpa 3: Future Arc and Despair Arc, which aired in parallel, alternating episodes, from July to September 2016, and finish with Hope Arc (September 29, 2016), the single-episode ending to both. Despair Arc is set in the past, during the characters' school days. Danganronpa 3 is an original story written for the anime as a sequel to the games, including the second game, Super Danganronpa 2, which has no anime adaptation, so play it or read a summary first.",
    promote: ["danganronpa-3-the-end-of-kibougamine-gakuen-zetsubou-hen"],
    mainOrder: ["danganronpa-kibou-no-gakuen-to-zetsubou-no-koukousei-the-animation", "danganronpa-3-the-end-of-kibougamine-gakuen-mirai-hen", "danganronpa-3-the-end-of-kibougamine-gakuen-zetsubou-hen", "danganronpa-3-the-end-of-kibougamine-gakuen-kibou-hen"],
  },
  flcl: {
    label: "FLCL",
    intro: "Start with the original six-episode FLCL (2000–2001). Then watch the sequels in release order: Progressive (June 2018), Alternative (September 2018), Grunge and Shoegaze (both 2023). Each sequel follows a new cast, with Haruko as the link. Shoegaze is set ten years after Alternative. In Japan, Progressive and Alternative were first shown as compilation films in 2018; the TV versions are the same story.",
  },
  "date-a-live": {
    label: "Date A Live",
    intro: "Watch the seasons in order: Date A Live (2013), Date A Live II (2014), the film Mayuri Judgment (August 2015), then III (January–March 2019), IV (April–June 2022) and V (April–June 2024). Each of the first two seasons has an OVA that fits after it. A theatrical film, Date A Live F: Last Date, is set for March 26, 2027. Date A Bullet is a spin-off.",
    promote: ["date-a-live-III", "date-a-live-iv", "date-a-live-v"],
    mainOrder: ["date-a-live", "date-a-live-ova", "date-a-live-ii", "date-a-live-mayuri-judgement", "date-a-live-III", "date-a-live-iv", "date-a-live-v"],
  },
  "ghost-in-the-shell-2015": {
    label: "Ghost in the Shell: Arise",
    intro: "Arise is a reboot with its own continuity, separate from Stand Alone Complex and the 1995 film. Watch either the four OVA Borders (June 2013–September 2014) or Alternative Architecture (TV, April–June 2015), which re-edits them as a TV series and adds two new episodes, Pyrophoric Cult. If you watch the Borders, also watch Pyrophoric Cult, released separately as Border 5 in August 2015; it is listed below with the alternative versions but is not a retelling. Then watch Ghost in the Shell: The New Movie (June 2015), which follows on from Arise.",
  },
  "ghost-in-the-shell-stand-alone-complex": {
    label: "Ghost in the Shell: Stand Alone Complex",
    intro: "Watch Stand Alone Complex (26 episodes, 2002–2003), 2nd GIG (26 episodes, 2004–2005) and the TV film Solid State Society (2006), then SAC_2045 Season 1 (Netflix, April 2020) and Season 2 (May 2022). The Laughing Man and Individual Eleven are compilation films of the first two seasons, and Sustainable Warfare and The Last Human recut SAC_2045; skip all four if you watch the series. The Tachikomatic Days shorts are optional. THE GHOST IN THE SHELL (July 2026, Science SARU) is a new adaptation of Masamune Shirow's manga with its own continuity; it is listed below with the alternative versions but is not a retelling of Stand Alone Complex.",
  },
  trigun: {
    label: "Trigun",
    intro: "The 1998 series (26 episodes) is the original adaptation, and the film Badlands Rumble (2010) is an optional side story for it. Trigun Stampede (January–March 2023) is a separate, reimagined adaptation, not a sequel; its continuation Trigun Stargaze aired from January to March 2026. Watch either the 1998 series or Stampede and Stargaze; they do not share a continuity.",
    optional: ["trigun-stargaze"],
  },
  "fate-kaleid-liner-prisma-illya": {
    label: "Fate/kaleid liner Prisma Illya",
    intro: "Watch the TV seasons in order: Prisma Illya (2013), 2wei! (2014), 2wei Herz! (2015) and 3rei!! (2016), then the films Vow in the Snow (August 2017) and Licht – The Nameless Girl (August 2021). A fifth and final season, Prisma Illya Finale, is set for 2027. The shorts and OVAs released with each season, and the 2019 OVA Prisma Phantasm, are optional extras. It is an alternate-universe spin-off of Fate/stay night.",
  },
  "kekkai-sensen": {
    label: "Blood Blockade Battlefront",
    intro: "Blood Blockade Battlefront (12 episodes; it began in April 2015 and its final episode aired in October 2015), then Blood Blockade Battlefront & Beyond (12 episodes, October–December 2017). Each season has one OVA, released in 2016 and 2018; both are optional side episodes that fit after their season.",
  },
  barakamon: {
    label: "Barakamon",
    intro: "Barakamon is a single 12-episode series (July–September 2014). Handa-kun (July–September 2016) is a prequel spin-off about Seishu Handa's high school days; it is optional and was made after Barakamon, so watch it afterwards. The Mijikamon shorts are optional extras.",
    demote: ["handa-kun"],
  },
  "boku-wa-tomodachi-ga-sukunai": {
    label: "Haganai: I Don't Have Many Friends",
    intro: "Watch Haganai (12 episodes, October–December 2011), then the OVA released on September 26, 2012, then Haganai NEXT (12 episodes, January–March 2013), the second season. The Episode 0 OVA came bundled with the seventh light novel on September 22, 2011, two weeks before the TV series began; it is optional.",
    demote: ["boku-wa-tomodachi-ga-sukunai-episode-0"],
  },
  "higurashi-no-naku-koro-ni": {
    label: "Higurashi: When They Cry",
    intro: "Watch Higurashi (26 episodes, April–September 2006), Kai (24 episodes, July–December 2007) and the Rei OVA (2009), then Gou (24 episodes, October 2020–March 2021) and its sequel Sotsu (July–September 2021). Gou was first promoted as a remake, but it continues from the earlier anime, so do not start with it. Kira (2011), Outbreak (2013) and the Nekogoroshi-hen special are optional extras. A new TV anime by Studio Deen, which made the 2006 series, was announced in June 2026 and has no release date yet.",
    promote: ["higurashi-no-naku-koro-ni-gou", "higurashi-no-naku-koro-ni-sotsu"],
    mainOrder: ["higurashi-no-naku-koro-ni", "higurashi-no-naku-koro-ni-kai", "higurashi-no-naku-koro-ni-rei", "higurashi-no-naku-koro-ni-gou", "higurashi-no-naku-koro-ni-sotsu"],
  },
  "k-project": {
    label: "K (K Project)",
    intro: "Watch K (October–December 2012), then the film K: Missing Kings (July 2014), which is set a year after the series, then K: Return of Kings (13 episodes, October–December 2015). The six K: Seven Stories films came out once a month from July to December 2018; watch them after Return of Kings. The Missing Kings manner movie can be skipped, and The Idol K shorts are optional.",
    skip: ["k-missing-kings-manner-movie"],
  },
  oreimo: {
    label: "Oreimo",
    intro: "Watch episodes 1 to 11 of Oreimo (October–December 2010), then the four web episodes released in 2011; they replace the broadcast episode 12 with an ending that follows the light novels. Oreimo 2 has 13 TV episodes (April–June 2013) and three more web episodes, 14 to 16, released on August 18, 2013, which finish the story. The commentary specials, SD shorts and music videos are optional.",
  },
  free: {
    label: "Free!",
    intro: "Watch Free! (July–September 2013), Eternal Summer (July–September 2014), the film Take Your Marks (October 2017), which is set between the second and third seasons, Dive to the Future (July–September 2018), then the two-part film The Final Stroke (September 2021 and April 2022). The Timeless Medley films (2017) and Road to the World (2019) are compilations. Starting Days (2015) is an optional prequel film set in middle school.",
    demote: ["free-starting-days"],
    skip: ["free-timeless-melody-kizuna"],
    promote: ["free-take-your-marks"],
    mainOrder: ["free", "free-eternal-summer", "free-take-your-marks", "free-dive-to-the-future", "free–the-final-stroke", "free-the-final-stroke-kouhen"],
  },
  given: {
    label: "Given",
    intro: "Watch the TV series (July–September 2019), then Given the Movie (August 2020), which continues it directly, then the two-part film project Hiiragi Mix (January 2024) and To the Sea (September 2024). The OVAs from December 2021 and October 2025 were bundled with manga volumes and are optional, as are the Hiiragi Mix specials.",
  },
  "yu-yu-hakusho": {
    label: "Yu Yu Hakusho",
    intro: "Yu Yu Hakusho is one 112-episode TV series (October 1992–January 1995), so start there. The films The Golden Seal (July 1993) and Poltergeist Report (April 1994) have original stories and are optional. Two Shots / All or Nothing (October 2018) adapts a bonus chapter about how Hiei and Kurama met and a chapter from the end of the manga; watch it after the series. The Eizou Hakusho videos and the 2009 picture drama are short extras.",
    demote: ["yu-yu-hakusho-picture-drama"],
  },
  "youkoso-jitsuryoku-shijou-shugi-no-kyoushitsu-e-tv": {
    label: "Classroom of the Elite",
    intro: "Watch the four seasons in order: Classroom of the Elite (July–September 2017), II (July–September 2022), III (January–March 2024) and the 4th Season (16 episodes, April–June 2026), subtitled Second Year, First Semester, which starts the second-year story. A fifth season was announced after the fourth season's final episode and has no release date yet.",
    skip: ["youkoso-jitsuryoku-shijou-shugi-no-kyoushitsu-e"],
  },
  "zero-no-tsukaima": {
    label: "The Familiar of Zero",
    intro: "Watch the four seasons in order: The Familiar of Zero (13 episodes, July–September 2006), Knight of the Twin Moons (12 episodes, July–September 2007), Rondo of Princesses (12 episodes, July–September 2008) and F (12 episodes, January–March 2012). Rondo of Princesses has one OVA episode, released in December 2008, that is optional and fits after it. The picture drama shorts are optional extras.",
  },
  berserk: {
    label: "Berserk",
    intro: "The 1997 series (25 episodes) and the Golden Age Arc film trilogy (2012–2013) both adapt the Golden Age arc, so watch one of them; the films are listed under safe to skip for that reason. Then watch Berserk (July–September 2016) and its second season (April–June 2017), which continue from the end of the films. The Memorial Edition (October–December 2022) is a 13-episode TV re-edit of the films.",
  },
  inuyasha: {
    label: "InuYasha",
    intro: "Watch InuYasha (167 episodes, October 2000–September 2004), then InuYasha: The Final Act (26 episodes, October 2009–March 2010). The four films (December 2001 to December 2004) have original stories and are optional; the first three came out while the first series was airing, the fourth after it ended. Yashahime: Princess Half-Demon (two seasons, October 2020–March 2022) is an anime-original sequel about the next generation.",
    skip: ["shounen-sunday-cm-gekijou-inuyasha-hen"],
  },
  "the-world-god-only-knows": {
    label: "The World God Only Knows",
    intro: "Watch Season 1 (12 episodes, October–December 2010), Season 2 (April–June 2011), the OVA Four Girls and an Idol (September 2011), the two-part OVA Tenri Arc (October and December 2012), then Goddesses (July–September 2013). Tenri Arc introduces the goddess story that Goddesses continues, so do not skip it. Flag 0 (September 2010) is a short prologue OVA bundled with manga volume 10 and is optional.",
    demote: ["kami-nomi-zo-shiru-sekai-flag-0"],
  },
  "accel-world": {
    label: "Accel World",
    intro: "Watch the 24-episode series (April–September 2012), then the film Accel World: Infinite Burst (July 2016). The two-episode EX OVA, bundled with the two Accel World video games in September 2012 and January 2013, is a pair of optional side episodes. The Acchel World chibi specials are optional too.",
    demote: ["accel-world-ex"],
  },
  "youjo-senki": {
    label: "The Saga of Tanya the Evil",
    intro: "Watch Season 1 (12 episodes, January–March 2017), then Saga of Tanya the Evil: The Movie (February 2019), a direct sequel to the first season, then Saga of Tanya the Evil II (12 episodes, July–September 2026). The Youjo Shenki chibi shorts, Operation Desert Pasta (2021) and Isekai Quartet are optional extras. The manner movie is a cinema-etiquette clip and the Isekai Quartet relay PV is a trailer.",
    skip: ["youjo-senki-movie-manner-eizou", "isekai-quartet-relay-pv"],
  },
  "eden-of-the-east": {
    label: "Eden of the East",
    intro: "Watch the 11-episode series (April–June 2009), then the two films The King of Eden (November 2009) and Paradise Lost (March 2010), which continue the story from the end of the series and conclude it. Air Communication (September 2009) is a re-edit of the TV episodes and can be skipped. Falling Down is the music video for the opening theme by Oasis.",
  },
  "gate-jieitai-kanochi-nite-kaku-tatakaeri": {
    label: "GATE",
    intro: "Watch GATE (12 episodes, July–September 2015) and GATE Part 2 (12 episodes, January–March 2016); they are the two halves of one 24-episode series. Gate 2: Tides of Conflict, an adaptation of the sequel novels, is set to premiere in 2027. There are no OVAs, films or recap episodes to fit in.",
  },
  "trinity-seven": {
    label: "Trinity Seven",
    intro: "Watch the 12-episode series (October–December 2014), then the films Eternity Library & Alchemic Girl (February 2017) and Heavens Library & Crimson Lord (March 2019). The OVA (March 2015) is a side episode that fits after the series.",
    optional: ["trinity-seven-movie-2"],
  },
  "akagami-no-shirayuki-hime": {
    label: "Snow White with the Red Hair",
    intro: "Watch Season 1 (12 episodes, July–September 2015), then Season 2 (12 episodes, January–March 2016). The OVA, bundled with a limited edition of manga volume 15, adapts three manga chapters, including chapter 41, that the TV series did not cover; it is optional.",
  },
  "goblin-slayer": {
    label: "Goblin Slayer",
    intro: "Watch Season 1 (12 episodes, October–December 2018), the film Goblin's Crown (February 2020), then Season 2 (October–December 2023). Season 2 is not linked to the rest on Kitsu, so it was added to the list below by hand. Adventure Sheet (December 2018), listed under safe to skip, is a recap special.",
    promote: ["goblin-slayer-2nd-season"],
  },
  sk8: {
    label: "SK8 the Infinity",
    intro: "Watch the 12-episode series (January–April 2021), then the OVA SK8 the Infinity Extra Part, screened in theatres from January 24, 2025 and released on home video on March 19, 2025. A second season has been announced but had no release date as of November 2026. Crazy Rock Jam (March 2021) is a recap special and can be skipped.",
  },
  "blood-lad": {
    label: "Blood Lad",
    intro: "Blood Lad is a single 10-episode series (July–September 2013). The OVA released in December 2013 is an extra episode that goes after the series. The 2017 Kanketsu Kinen video is a short promotional clip, not an episode, so it can be skipped. There is no second season.",
    skip: ["blood-lad-kanketsu-kinen"],
  },
  "koutetsujou-no-kabaneri": {
    label: "Kabaneri of the Iron Fortress",
    intro: "Watch the 12-episode series (April–June 2016), then the film The Battle of Unato (May 2019), which is set six months after the series. The two compilation films (December 2016 and January 2017) recap the first and second halves of the series and can be skipped. The Ran and Mumei Ranman videos are promotional clips for a mobile game and a figure, so they are listed under safe to skip, and the Sakaseyasakase music video is an optional extra.",
    skip: ["koutetsujou-no-kabaneri-ran-hajimaru-michiato", "koutetsujou-no-kabaneri-mumei-ranman"],
  },
  "lucky-star": {
    label: "Lucky Star",
    intro: "Lucky Star is one 24-episode series (April–September 2007), followed by a single OVA (September 2008), released a year after the TV series ended; there is no second season. Miyakawa-ke no Kūfuku (April–July 2013), streamed online, is a spin-off and is listed separately below.",
  },
  "baka-to-test-to-shoukanjuu": {
    label: "Baka and Test: Summon the Beasts",
    intro: "Watch Baka and Test (13 episodes, January–March 2010), the two-episode OVA Matsuri (February–March 2011), then Baka and Test 2 (13 episodes, July–September 2011). The Matsuri OVA sits between the two seasons. The short specials and the LIPS video are optional extras.",
  },
  "dragon-ball-z-movie-14-kami-to-kami": {
    label: "Dragon Ball Z: Battle of Gods",
    intro: "Watch Battle of Gods (March 2013), then its sequel Resurrection 'F' (April 2015); both are set after the defeat of Majin Buu. Episodes 1 to 27 of Dragon Ball Super retell both films with extra scenes, so watch the films or those episodes, not both; that is why Super appears under safe to skip. Dragon Ball Super: Beerus, a TV series that began on October 11, 2026, covers the same events.",
  },
  "amagi-brilliant-park": {
    label: "Amagi Brilliant Park",
    intro: "Amagi Brilliant Park is one 13-episode series (October–December 2014). The OVA No Time to Take It Easy!, bundled with the seventh DVD and Blu-ray volume, is an unaired extra episode that goes after the series. The seven Wakuwaku Mini Theater shorts also came with the disc volumes and are optional.",
  },
  "sukitte-ii-na-yo": {
    label: "Say \"I Love You\".",
    intro: "Say \"I Love You\". is one TV series (October–December 2012). The OVA, bundled with a limited edition of manga volume 11 in July 2013, is an extra episode that goes after the series; the Mei and Marshmallow shorts are optional. The 2014 film is live action and separate from the anime.",
  },
  "kore-wa-zombie-desu-ka": {
    label: "Is This a Zombie?",
    intro: "Watch Is This a Zombie? (12 episodes, January–April 2011) and its OVA episodes, then Is This a Zombie? of the Dead (10 episodes, April–June 2012) and its OVA from October 2012. The OVAs were released with light novel and manga volumes as extra episodes.",
  },
  bakuman: {
    label: "Bakuman.",
    intro: "Watch the three seasons in order: Bakuman. (25 episodes, October 2010–April 2011), Season 2 (25 episodes, October 2011–March 2012) and Season 3 (25 episodes, October 2012–March 2013). The specials are optional. Deraman, listed under safe to skip, is a recap of the first two seasons.",
  },
  "masamune-kun-no-revenge": {
    label: "Masamune-kun's Revenge",
    intro: "Watch Season 1 (12 episodes, January–March 2017), then Masamune-kun's Revenge R (July–September 2023), the second season. The OVA (July 2018) is an optional extra episode released between the two seasons. R came out six years after Season 1 and continues its story, so start with Season 1. Twilight Little Star is a music video.",
  },
  sankarea: {
    label: "Sankarea: Undying Love",
    intro: "Sankarea is one 12-episode series (April–June 2012). Two OVA episodes came with manga volumes 6 and 7 (June and November 2012), and a special episode came with the sixth Blu-ray and DVD volume (November 2012); all three are extra episodes that go after the series. There is no second season.",
  },
  "rurouni-kenshin": {
    label: "Rurouni Kenshin (1996)",
    intro: "Watch the TV series (January 1996–September 1998), then the OVA Trust & Betrayal (1999), a prequel about Kenshin's past made after the series; it is listed below as a side story but is strongly recommended. Then watch the OVA Reflection (2001–2002), set after the series. The 1997 film is optional. New Kyoto Arc (2011–2012) retells the Kyoto arc and can be skipped. The 2023 series and its second season, Kyoto Disturbance (2024–2025), are a separate new adaptation, and a third season of it has been announced.",
    demote: ["rurouni-kenshin-tsuiokuhen"],
  },
  "aldnoah-zero": {
    label: "Aldnoah.Zero",
    intro: "Watch Season 1 (12 episodes, July–September 2014), then Season 2 (12 episodes, January–March 2015). The Penultimate Truth, an extra episode numbered 24.5, was first shown inside the compilation film Aldnoah.Zero (Re+) in February 2025 and released on its own in March 2025; watch it after Season 2. Extra Archives is a recap special.",
  },
  "3-gatsu-no-lion": {
    label: "March Comes In Like a Lion",
    intro: "Watch Season 1 (22 episodes, October 2016–March 2017), then Season 2 (22 episodes, October 2017–March 2018). The omnibus special from December 2016 is a recap and can be skipped. The music videos and the Lion meets HachiClo clips are optional extras, not episodes.",
    skip: ["lion-meets-hachiclo"],
  },
  "is-infinite-stratos": {
    label: "Infinite Stratos",
    intro: "Watch Infinite Stratos (12 episodes, January–April 2011) and the OVA Encore (December 2011), then Infinite Stratos 2 (12 episodes, October–December 2013) and the OVA World Purge (November 2014). The Long Vacation OVA from October 2013 is listed under safe to skip, and the Infinite Wedding special is an optional extra.",
  },
  "strike-the-blood": {
    label: "Strike the Blood",
    intro: "Watch the 24-episode TV series (October 2013–March 2014), then the OVA seasons in order: II (8 episodes, November 2016–May 2017), III (10 episodes, December 2018–September 2019), IV (April 2020–June 2021) and FINAL (4 episodes, March–July 2022). After the TV series the story continues only as OVAs. Kingdom of the Valkyria (2015) and The Lost Holy Spear (January 2020) are optional side OVAs.",
    optional: ["strike-the-blood-kieta-seisou-hen"],
  },
  "91-days": {
    label: "91 Days",
    intro: "91 Days is one 12-episode series (July–October 2016). The 2017 special is a side story that goes after the series. Brief Candle (August 2016) is a recap episode that aired mid-season and can be skipped, and the 91 Daze shorts are optional. There is no second season.",
  },
  "hajime-no-ippo": {
    label: "Hajime no Ippo (Fighting Spirit)",
    intro: "Watch Hajime no Ippo (75 episodes, October 2000–March 2002) and episode 76, which was only on the last DVD, then the TV film Champion Road (April 2003), the OVA Mashiba vs. Kimura (September 2003), New Challenger (26 episodes, January–June 2009) and Rising (25 episodes, October 2013–March 2014). The Boxer's Fist special from 2003 is optional.",
  },
  "eureka-seven": {
    label: "Eureka Seven",
    intro: "Watch Eureka Seven (50 episodes, April 2005–April 2006), then the sequel Eureka Seven AO (24 episodes, April–November 2012), whose last two episodes aired together in November 2012. AO's OVA, The Flower Fields of Jungfrau, is set between its episodes 8 and 9, and the 2017 web episode One More Time is an expanded version of AO's finale; both are optional, as are the AO Aratanari Fukaki Ao shorts. The 2009 film Pocket Full of Rainbows is an alternative version and is listed under safe to skip. The Hi-Evolution trilogy (2017–2021) is a reimagining: its first film retells part of the original series, while the second and third tell a new story in their own continuity and are optional.",
    optional: ["eureka-seven-ao-final-episode-one-more-time-lord-don-t-slow-me-down", "koukyoushihen-eureka-seven-hi-evolution-2", "koukyoushihen-eureka-seven-hi-evolution-3"],
  },
  "himouto-umaru-chan": {
    label: "Himouto! Umaru-chan",
    intro: "Watch Himouto! Umaru-chan (12 episodes, July–September 2015), then Umaru-chan R (October–December 2017), the second season. The two OVAs were bundled with manga volumes 7 (October 2015) and 10 (April 2017) and are extra episodes. The Umaru-chanS shorts (2015–2016) are optional too.",
  },
  "to-love-ru": {
    label: "To Love Ru",
    intro: "Watch To Love Ru (26 episodes, April–September 2008), Motto To Love Ru (12 episodes, October–December 2010), To Love Ru Darkness (12 episodes, October–December 2012) and Darkness 2nd (July–October 2015). The OVA episodes, most of them bundled with manga volumes, are extra stories. The 2017 OVA came with To Love Ru Chronicle, a book for the franchise's 10th anniversary.",
  },
  "saenai-heroine-no-sodate-kata": {
    label: "Saekano: How to Raise a Boring Girlfriend",
    intro: "Watch Saekano (January–March 2015), whose broadcast began with episode 0 on January 9, then Saekano Flat (April–June 2017), then the film Saekano the Movie: Finale (October 2019). Flat also has an episode 0, streamed online a week before its TV broadcast began; it is optional. Kitsu lists the first season's episode 0 separately, at the top of the list.",
  },
  chihayafuru: {
    label: "Chihayafuru",
    intro: "Watch the three seasons in order: Chihayafuru (25 episodes, October 2011–March 2012), Chihayafuru 2 (25 episodes, January–June 2013) and Chihayafuru 3 (24 episodes, October 2019–March 2020). The OVA bundled with manga volume 22 in September 2013 belongs to the second season and fits after it. The January 2020 special listed under safe to skip is a recap.",
  },
  "shakugan-no-shana": {
    label: "Shakugan no Shana",
    intro: "Watch the three TV seasons in order: Shakugan no Shana (24 episodes, October 2005–March 2006), Second (24 episodes, October 2007–March 2008) and Final (24 episodes, October 2011–March 2012), with the four-episode OVA Shakugan no Shana S (October 2009–September 2010) between Second and Final. The SP OVA (December 2006) is optional. The 2007 film is listed under safe to skip.",
  },
  "the-tatami-galaxy": {
    label: "The Tatami Galaxy",
    intro: "The Tatami Galaxy is one 11-episode series (April–July 2010); the three seven-minute shorts on its DVD and Blu-ray volumes are optional. Then watch The Tatami Time Machine Blues (six episodes, September–October 2022). Its theatrical compilation leaves out the sixth episode, so watch the series version. The Night Is Short, Walk On Girl (April 2017) is a separate film.",
  },
  "full-metal-panic": {
    label: "Full Metal Panic!",
    intro: "Watch Full Metal Panic! (24 episodes, January–June 2002), Fumoffu (12 episodes, August–November 2003), The Second Raid (13 episodes, July–October 2005) and Invisible Victory (12 episodes, April–July 2018). Fumoffu is a comedy set between the first season and The Second Raid and is optional; Invisible Victory continues from The Second Raid. The three 2017–2018 films are director's cuts of the first season.",
    promote: ["full-metal-panic-invisible-victory"],
  },
  shirobako: {
    label: "Shirobako",
    intro: "Shirobako is one 24-episode series (October 2014–March 2015), followed by Shirobako: The Movie (February 2020), an all-new story. The two OVA episodes on the third and seventh disc volumes show the fictional anime that the characters work on and are optional, as are the other specials.",
  },
  "grisaia-no-kajitsu": {
    label: "The Fruit of Grisaia",
    intro: "Watch The Fruit of Grisaia (13 episodes, October–December 2014), the TV film The Labyrinth of Grisaia (April 12, 2015), then The Eden of Grisaia (10 episodes, April–June 2015). The shorts released with the disc volumes are optional. Grisaia: Phantom Trigger (films from 2019 and 2020 and a TV series from January 2025) is based on a separate game series.",
  },
  "shinmai-maou-no-testament": {
    label: "The Testament of Sister New Devil",
    intro: "Watch The Testament of Sister New Devil (12 episodes, January–March 2015) and its OVA (June 2015), then Burst (10 episodes, October–December 2015) and its OVA (January 2016), then the OVA Departures (2018). The specials released with the disc volumes are optional.",
  },
  "seitokai-yakuindomo": {
    label: "Seitokai Yakuindomo",
    intro: "Watch Seitokai Yakuindomo (13 episodes, July–September 2010) and its OVAs, then Seitokai Yakuindomo* (13 episodes, January–March 2014) and its OVAs, then the films from July 2017 and January 2021. The OVAs were released with limited editions of the manga.",
    promote: ["seitokai-yakuindomo-movie", "seitokai-yakuindomo-movie-2"],
    mainOrder: ["seitokai-yakuindomo", "seitokai-yakuindomo-ova", "seitokai-yakuindomo-2nd-season", "seitokai-yakuindomo-2nd-season-ova", "seitokai-yakuindomo-movie", "seitokai-yakuindomo-movie-2"],
  },
  "death-note": {
    label: "Death Note",
    intro: "Death Note is one 37-episode series (October 2006–June 2007), so there is only one thing to watch. The two Relight TV films, Visions of a God (August 31, 2007) and L's Successors (August 2008), are compilations of the series, listed under safe to skip. Watch the series instead; there are no OVAs, sequels or canon films.",
  },
  toradora: {
    label: "Toradora!",
    intro: "Toradora! is one 25-episode series (October 2008–March 2009). The OVA Bento Battle, released on December 21, 2011, is an optional extra episode. The Toradora! SOS! shorts, which came with the DVD volumes in 2009, are optional, and the April 2009 recap can be skipped.",
  },
  "angel-beats": {
    label: "Angel Beats!",
    intro: "Angel Beats! is a 13-episode original series (April–June 2010). Its OVA episodes, one on the seventh Blu-ray and DVD volume in December 2010 and a second in June 2015, are grouped as Specials. The same December 2010 volume added Another Epilogue, a short bonus scene that serves as a second epilogue; watch it after the finale.",
  },
  "death-parade": {
    label: "Death Parade",
    intro: "Death Parade is one 12-episode series (January–March 2015). It grew out of Death Billiards, a short film Madhouse made for the Anime Mirai 2013 young-animator project (March 2013). The short is an optional pilot with the same setting and a different story; watch it before or after the series.",
    optional: ["death-billiards"],
  },
  "ouran-koukou-host-club": {
    label: "Ouran High School Host Club",
    intro: "Ouran High School Host Club is a single 26-episode series (April–September 2006) and there is nothing else to watch: no second season, films or OVAs. The Japanese TV drama (2011) and the live-action film (2012) are separate adaptations.",
  },
  "akame-ga-kill": {
    label: "Akame ga Kill!",
    intro: "Akame ga Kill! is one 24-episode series (July–December 2014). It follows the first eight manga volumes, then the last episodes tell an original story with a different ending from the manga. The AkaKill! Theater shorts are optional, and the August 2014 recap can be skipped.",
  },
  hyouka: {
    label: "Hyouka",
    intro: "Hyouka is one 22-episode series (April–September 2012). The bonus episode What Should Be Had, first streamed online on July 8, 2012 while the series was airing, is an optional side episode. There is no second season, film or other anime, so the TV series is the whole watch.",
  },
  "elfen-lied": {
    label: "Elfen Lied",
    intro: "Elfen Lied is one 13-episode series (July–October 2004). The single OVA, In the Passing Rain (April 21, 2005), is often called episode 10.5 because its events take place within episode 11, so watch it between episodes 10 and 11 or after the series. The anime ended before the manga was finished, so its story and ending differ from the manga.",
  },
  "kaichou-wa-maid-sama": {
    label: "Maid Sama!",
    intro: "Maid Sama! is one 26-episode series (April–September 2010). The two specials, the LaLa special from July 2010 and Omake dayo! from May 2011, are short optional extras; watch them after the series. There is no second season, film or OVA, so the TV series is the whole watch.",
  },
  "high-school-of-the-dead": {
    label: "Highschool of the Dead",
    intro: "Highschool of the Dead is one 12-episode series (July–September 2010), followed by the OVA Drifters of the Dead (April 26, 2011), an extra episode that goes after the series. Both were made by Madhouse. No second season was made, so the OVA is the last Highschool of the Dead anime.",
  },
  charlotte: {
    label: "Charlotte",
    intro: "Charlotte is a 13-episode original series (July–September 2015). The OVA The Strong Ones came on the seventh Blu-ray and DVD volume on March 30, 2016; it is an optional extra episode to watch after the finale. There are no other seasons or films. The story was written by Jun Maeda, who also created Angel Beats!.",
  },
  "darling-in-the-franxx": {
    label: "Darling in the Franxx",
    intro: "Darling in the Franxx is a single 24-episode original series (January–July 2018) with no sequels, films or OVAs, so the TV series is the whole watch. It was co-produced by Trigger and A-1 Pictures, with animation by Trigger and CloverWorks, and is not based on a manga.",
  },
  "deadman-wonderland": {
    label: "Deadman Wonderland",
    intro: "Deadman Wonderland is one 12-episode series (April–July 2011), followed by the OVA The Red Knife Wielder, released on October 8, 2011 alongside the eleventh manga volume. The OVA is an extra episode; watch it after the series. No second season was made, so the anime only covers the early part of the manga.",
  },
  "my-little-monster": {
    label: "My Little Monster",
    intro: "My Little Monster is one 13-episode series (October–December 2012). The OVA, bundled on DVD with the limited edition of manga volume 12 (the last volume of the main story) in August 2013, is an optional extra episode to watch after the series. There is no second season.",
    optional: ["my-little-monster-ova"],
  },
  dororo: {
    label: "Dororo (2019)",
    intro: "The 2019 Dororo (24 episodes, January–June 2019, by MAPPA and Tezuka Productions) is the second anime adaptation of Osamu Tezuka's manga, after the 1969 series Dororo to Hyakkimaru. They are separate versions of the same story, so watch either one; the 1969 series and its 1968 pilot are listed under alternative versions.",
  },
  monster: {
    label: "Monster",
    intro: "Monster is one 74-episode series (April 2004–September 2005) by Madhouse, with no second season, films or OVAs, so there is only one thing to watch. The two TV specials, Monster Extra (September 2004) and Monster Special Edition (December 2005), are recaps listed under safe to skip.",
  },
  "banana-fish": {
    label: "Banana Fish",
    intro: "Banana Fish is one 24-episode series (July–December 2018) by MAPPA, and there are no OVAs, films or second season to fit in. Prayer X, listed below, is a music video, not an episode. The whole story is in the TV series, so start at episode 1 and watch straight through to episode 24.",
  },
  "grand-blue": {
    label: "Grand Blue Dreaming",
    intro: "Watch the seasons in order: Grand Blue Dreaming (12 episodes, July–September 2018), Season 2 (July–September 2025) and Season 3 (July–September 2026). A fourth season has been announced with no date yet. There are no anime films or OVAs to fit in, so release order is the whole guide.",
  },
  "hataraku-saibou-tv": {
    label: "Cells at Work!",
    intro: "Watch Cells at Work! (13 episodes, July–September 2018) and the special episode from December 27, 2018, then Cells at Work!! (8 episodes, January–February 2021), the second season. The September 2020 theatrical release was an early screening of Season 2's episodes 4 to 8, so it is listed under safe to skip. Cells at Work! Code Black (January–March 2021) is a spin-off series, and the December 2024 film is live action.",
    skip: ["hataraku-saibou-saikyou-no-teki-futatabi-karada-no-naka-wa-chou-oosawagi"],
  },
  "mekaku-city-actors": {
    label: "Mekakucity Actors",
    intro: "Mekakucity Actors is one 12-episode series by Shaft (April–June 2014), the anime of the Kagerou Project songs and novels. The short film Kagerou Daze: In a Day's (November 2016) is an optional side story, and the other entries are music videos. Mekakucity Reload, an anime announced in 2016, has never been released (the name was later used for a 2018 album), so it was removed from the list.",
    exclude: ["mekakucity-reload"],
  },
  beastars: {
    label: "Beastars",
    intro: "Watch the three seasons in order: Beastars (12 episodes, October–December 2019), Season 2 (January–March 2021) and the Final Season, which Netflix released in two parts, in December 2024 and March 2026. There are no films, OVAs or recaps; the Yasashii Suisei entry is a music video, not an episode.",
  },
  "kara-no-kyoukai-1-fukan-fuukei": {
    label: "The Garden of Sinners (Kara no Kyoukai)",
    intro: "The Garden of Sinners is seven ufotable films (December 2007–August 2009) that tell the story out of chronological order; watch them in release order, as listed below. Then watch the Chapter 8 epilogue (February 2011) and the film Future Gospel (September 2013). Remix: Gate of Seventh Heaven (March 2009) is a compilation of the first six films, and the manner movies are pre-show clips.",
    skip: ["kara-no-kyoukai-cinema-intros", "kara-no-kyoukai-manner-movie"],
  },
  "tower-of-god": {
    label: "Tower of God",
    intro: "Watch Season 1 (13 episodes, April–June 2020, by Telecom Animation Film), then Season 2 (July–December 2024, by The Answer Studio), which aired in two cours: Return of the Prince (July–September) and Workshop Battle (October–December). Kitsu lists the two cours separately. There are no films, OVAs or recaps to fit in.",
  },
  "heaven-s-lost-property": {
    label: "Heaven's Lost Property",
    intro: "Watch Heaven's Lost Property (13 episodes, October–December 2009), the OVA Project Pink (September 2010), Forte (12 episodes, October–December 2010), the film The Angeloid of Clockwork (June 2011), then the final film, Eternally My Master (April 26, 2014). Release order is the watch order, and there are no recaps to skip.",
  },
  "drifters-tv": {
    label: "Drifters",
    intro: "Watch the 12-episode TV series (October–December 2016), then the three OVA episodes that continue it: episodes 13 and 14 (December 2017), billed as the start of a second season, and The Outlandish Knight (November 2018). Special Edition (June 2016), listed as an alternative version, is a 36-minute edit of the first two episodes that came with a manga volume, so skip it if you watch the series. No further episodes have been released since 2018.",
  },
  "5-toubun-no-hanayome": {
    label: "The Quintessential Quintuplets",
    intro: "Watch Season 1 (12 episodes, January–March 2019), Season 2 (January–March 2021), then The Quintessential Quintuplets Movie (May 2022), the sequel to Season 2. Then the two TV specials: ∽ (two episodes, September 2023, by Shaft), side stories set between Season 2 and the film, and * (December 24, 2024). An anime of the sequel novels, The Four Seasons, and a new OVA have been announced.",
    promote: ["5-toubun-no-hanayome-tv"],
    mainOrder: ["5-toubun-no-hanayome", "5-toubun-no-hanayome-2", "5-toubun-no-hanayome-movie", "5-toubun-no-hanayome-tv", "5-toubun-no-hanayome-special"],
  },
  "isekai-maou-to-shoukan-shoujo-no-dorei-majutsu": {
    label: "How Not to Summon a Demon Lord",
    intro: "Watch Season 1 (12 episodes, July–September 2018), then Season 2, How Not to Summon a Demon Lord Ω (10 episodes, April–June 2021). A third season, produced by Tezuka Productions, has been announced with no date yet. The Ω mini anime shorts that streamed online alongside Season 2 are optional.",
  },
  "hibike-euphonium": {
    label: "Sound! Euphonium",
    intro: "Watch Season 1 (April–July 2015), Season 2 (October–December 2016), the film Our Promise: A Brand New Day (April 2019) on Kumiko's second year, the theatrical OVA Ensemble Contest (August 2023), then Season 3 (April–June 2024), her third year. Liz and the Blue Bird (2018) is an optional film set in the same second year. The 2016 and 2017 films recap the two seasons, and the two-part Final Movie (2026) is a film version of Season 3.",
    promote: ["hibike-euphonium-ensemble-contest-hen", "hibike-euphonium-kumiko-3-nensei-hen"],
    optional: ["saishuu-gakushou-hibike-euphonium-zenpen", "saishuu-gakushou-hibike-euphonium-kouhen"],
    mainOrder: ["hibike-euphonium", "hibike-euphonium-2", "hibike-euphonium-movie-2-nensei-ni-natta-kumiko-tachi", "hibike-euphonium-ensemble-contest-hen", "hibike-euphonium-kumiko-3-nensei-hen"],
  },
  "working-1": {
    label: "Working!!",
    intro: "Watch the three seasons in order: Working!! (13 episodes, April–June 2010), Working'!! (October–December 2011) and Working!!! (July–September 2015), then Lord of the Takanashi, the one-hour finale broadcast on December 26, 2015. WWW.Working!! (October–December 2016) is a spin-off that adapts the separate web manga of the same name.",
  },
  "detective-conan": {
    label: "Detective Conan (Case Closed)",
    intro: "Detective Conan is one TV series that has aired since January 8, 1996, with more than 1,200 episodes, so watch it in broadcast order. A new film has opened in April almost every year since 1997 (none in 2020); each has an original story rather than one adapted from the manga, so they are optional. It is easiest to watch each film after the episodes from around its release. The OVAs are optional too.",
    optional: ["detective-conan-movie-13-the-raven-chaser", "detective-conan-movie-14-the-lost-ship-in-the-sky", "detective-conan-movie-15-quarter-of-silence", "detective-conan-movie-16-the-eleventh-striker", "detective-conan-movie-17-private-eye-in-the-distant-sea", "detective-conan-movie-18-the-sniper-from-another-dimension", "detective-conan-movie-19", "detective-conan-movie-20", "detective-conan-movie-21-deep-red-love-letter", "detective-conan-movie-22", "detective-conan-movie-23", "detective-conan-movie-24-hiiro-no-dangan", "detective-conan-movie-24-halloween-no-hanayome", "meitantei-conan-kurogane-no-submarine", "meitantei-conan-100-man-dol-no-michishirube", "meitantei-conan-sekigan-no-flashback", "meitantei-conan-movie-29-highway-no-datenshi"],
  },
  "non-non-biyori": {
    label: "Non Non Biyori",
    intro: "Watch the three seasons in order: Non Non Biyori (12 episodes, October–December 2013), Repeat (July–September 2015) and Nonstop (January–March 2021), with the film Vacation (August 2018) between Repeat and Nonstop. The first two OVAs came with manga volumes in July 2014 and September 2016, and the third, from March 2022, serves as Nonstop's 13th episode.",
  },
  "cardcaptor-sakura": {
    label: "Cardcaptor Sakura",
    intro: "Watch the 70-episode series (April 1998–March 2000), then the second film, The Sealed Card (July 2000), which gives the original anime its ending. The first film (August 1999) is an optional side story, and Leave It to Kero-chan is a short shown with the second film. Then watch Clear Card (22 episodes, January–June 2018), the sequel set in junior high, with the original cast and staff back. The prologue OVA Sakura and the Two Bears (2017) is optional. A continuation of Clear Card was announced in April 2023.",
    optional: ["cardcaptor-sakura-clear-card-hen-prologue-sakura-to-futatsu-no-kuma"],
  },
  "love-live-school-idol-project": {
    label: "Love Live! School Idol Project",
    intro: "Watch Season 1 (13 episodes, January–March 2013), Season 2 (April–June 2014), then Love Live! The School Idol Movie (June 13, 2015), which concludes the μ's story. The November 2013 OVA and the short specials are optional, and the recap specials and the theatre-manners clips shown before the film can be skipped. Love Live! Sunshine!! (2016), Nijigasaki (2020) and Superstar!! (2021) are separate series about other school idol groups and can be started on their own.",
    skip: ["love-live-manor-movie"],
  },
  "shingeki-no-bahamut-genesis": {
    label: "Rage of Bahamut",
    intro: "Watch Rage of Bahamut: Genesis (12 episodes, October–December 2014), then Virgin Soul (24 episodes, April–September 2017), the second season. The two Short Story episodes (December 2016–February 2017) are optional side stories set between the two seasons. The November 2014 roundup is a recap, and Manaria Friends (January–March 2019) is a spin-off.",
    demote: ["shingeki-no-bahamut-genesis-short-story"],
  },
  "yuru-camp": {
    label: "Laid-Back Camp",
    intro: "Watch the seasons in order: Laid-Back Camp (12 episodes, January–March 2018), Season 2 (January–April 2021) and Season 3 (April–June 2024). The film (July 1, 2022) is set years later, when the girls are working adults, so it can be watched after Season 2 or at the end. Room Camp (January–March 2020) is a short spin-off, and each season's specials are optional. Season 4 is set for April 2027.",
  },
  "fumetsu-no-anata-e": {
    label: "To Your Eternity",
    intro: "Watch the three seasons in order: To Your Eternity (20 episodes, April–August 2021, by Brain's Base), Season 2 (October 2022–March 2023) and Season 3 (October 2025–March 2026), made by Drive, the third with Studio Massket. The July 2021 special Fushi no Tabiji is a recap of the first twelve episodes and can be skipped. There are no films or OVAs.",
  },
  "kanojo-okarishimasu": {
    label: "Rent-a-Girlfriend",
    intro: "Watch the five seasons in order: Season 1 (12 episodes, July–September 2020), Season 2 (July–September 2022), Season 3 (July–September 2023), Season 4 (July–September 2025) and Season 5 (April–June 2026). A sixth season has been announced. The Petit shorts, the Date Movie clips and the Kanokari Call specials are short extras, not episodes, and can be skipped.",
  },
  "kino-no-tabi-the-beautiful-world": {
    label: "Kino's Journey",
    intro: "Start with the 2003 series (13 episodes, April–July 2003), then the two 30-minute films, Life Goes On (February 2005), which shows Kino's past, and Country of Illness: For You (April 2007). Kitsu puts Life Goes On first because it is a prequel, but it was made after the series. The 2017 series (12 episodes, October–December 2017) is a new adaptation with a new cast, not a sequel, so it can be watched on its own.",
    demote: ["kino-no-tabi-nanika-wo-suru-tame-ni-life-goes-on"],
  },
  "karakai-jouzu-no-takagi-san": {
    label: "Teasing Master Takagi-san",
    intro: "Watch the three seasons in order: Season 1 (12 episodes, January–March 2018), Season 2 (July–September 2019) and Season 3 (January–March 2022), then the anime film (June 10, 2022), released three months after Season 3 ended. The Water Slide OVA (July 2018) is an optional extra episode that came out between the first two seasons.",
  },
  "sayonara-zetsubou-sensei": {
    label: "Sayonara, Zetsubou-Sensei",
    intro: "Watch the three Shaft TV seasons in order, Sayonara Zetsubou Sensei (12 episodes, July–September 2007), Zoku (13 episodes, January–March 2008) and Zan (July–September 2009), with the Goku OVAs (October 2008–February 2009) between Zoku and Zan and the Zan Bangaichi OVAs (November 2009–February 2010) at the end. The two Jo DVD specials from 2008 are summary episodes and can be skipped.",
  },
  "yuru-yuri": {
    label: "YuruYuri",
    intro: "Watch YuruYuri (July–September 2011) and YuruYuri♪♪ (July–September 2012), both by Doga Kobo, then the OVA Nachuyachumi! (February 2015) and its follow-up Nachuyachumi!+ (August–September 2015), then San☆Hai! (October–December 2015, by TYO Animations) and the tenth-anniversary OVA from 2019. The 2011 special is an optional extra. The two Ōmuro-ke films (2024) are a spin-off about the Ōmuro sisters.",
  },
  "haiyore-nyaruko-san": {
    label: "Nyaruko: Crawling with Love",
    intro: "Watch Nyaruko: Crawling with Love (12 episodes, April–June 2012) and Season 2, W (April–July 2013), both by Xebec, then the OVA F (June 2015). The OVA episodes from November 2012 and April 2014 are optional extras. The earlier Haiyoru! Nyaruani shorts (2010–2011), made by DLE, are a separate short adaptation, so they are listed as alternative versions.",
  },
  "world-trigger": {
    label: "World Trigger",
    intro: "Watch Season 1 (73 episodes, October 2014–April 2016), then Season 2 (January–April 2021) and Season 3 (October 2021–January 2022), all by Toei Animation. The Fugitive Arc (episodes 49–63) is an anime-original story not in the manga and can be skipped. A remake that re-adapts the first season's story was announced in December 2025; it is listed as an alternative version.",
  },
  "nodame-cantabile": {
    label: "Nodame Cantabile",
    intro: "Watch the three seasons in order: Nodame Cantabile (23 episodes, January–June 2007), Paris Chapter (11 episodes, October–December 2008) and Finale (11 episodes, January–March 2010). The OVA from August 2009 fits between Paris Chapter and Finale, and the Finale special and OVA from April 2010 come last. Kitsu lists the Finale special before Finale itself; the order below is fixed to match release dates.",
    mainOrder: ["nodame-cantabile", "nodame-cantabile-paris-chapter", "nodame-cantabile-finale", "nodame-cantabile-finale-special", "nodame-cantabile-ova-2"],
  },
  "arifureta-shokugyou-de-sekai-saikyou": {
    label: "Arifureta",
    intro: "Watch the three seasons in order: Arifureta (13 episodes, July–October 2019), Season 2 (January–March 2022) and Season 3 (October 2024–February 2025). The Episode 0 prologue, first screened at an event in January 2020 after Season 1 had ended, is optional; Kitsu put it first. The picture dramas, specials and the September 2022 OVA are extras, and the August 2019 recap can be skipped.",
    demote: ["arifureta-shokugyou-de-sekai-saikyou-prologue"],
  },
  "maou-gakuin-no-futekigousha-shijou-saikyou-no-maou-no-shiso-tensei-shite-shison-tachi-no-gakkou-e-kayou": {
    label: "The Misfit of Demon King Academy",
    intro: "Watch Season 1 (13 episodes, July–September 2020), then Season 2, which aired as two cours: the first from January to September 2023, after a COVID-19 pause from its seventh episode, and the second from April to July 2024. Kitsu lists the two cours as separate entries. There are no films, OVAs or recaps to fit in.",
  },
  "bishoujo-senshi-sailor-moon": {
    label: "Sailor Moon",
    intro: "The original anime is five seasons, aired from March 1992 to February 1997: Sailor Moon, R, S, SuperS and Sailor Stars. Watch them in order; the three films, R (December 1993), S (December 1994) and SuperS (December 1995), are optional side stories that fit after their seasons. Sailor Moon Crystal (2014–2016) and its film sequels Eternal (2021) and Cosmos (2023) are a reboot that follows the manga more faithfully; watch it as a separate version.",
  },
  "amagami-ss": {
    label: "Amagami SS",
    intro: "Watch Amagami SS (25 episodes, July–December 2010), which tells each heroine's story in a separate arc, then the sequel Amagami SS+ plus (January–March 2012). The Miya special and the 2011 OVA episodes are optional extras. Seiren (January–March 2017) is listed as the next entry, but it is set in the same high school nine years later, with a new lead and the same one-arc-per-heroine structure.",
  },
  "zombieland-saga": {
    label: "Zombie Land Saga",
    intro: "Watch Zombie Land Saga (12 episodes, October–December 2018), then Revenge (April–June 2021), the second season, then the film Yumeginga Paradise (October 24, 2025). It is an original anime by MAPPA, Avex Pictures and Cygames, so there is no source manga to read ahead; the manga came later and loosely follows the anime. The specials and music videos listed below are optional.",
  },
  "jigoku-shoujo": {
    label: "Hell Girl",
    intro: "Watch the four seasons in order: Hell Girl (26 episodes, October 2005–April 2006), Two Mirrors (October 2006–April 2007), Three Vessels (October 2008–April 2009) and The Fourth Twilight (July–September 2017). The Fourth Twilight ran 12 weeks, but only the first six episodes were new; the rest were rebroadcasts of older episodes. The January 2006 recap can be skipped.",
  },
  "little-busters": {
    label: "Little Busters!",
    intro: "Watch Little Busters! (26 episodes, October 2012–April 2013), then the second season, Little Busters! Refrain (13 episodes, October–December 2013), then the eight Little Busters! EX episodes (January–July 2014). All three are by J.C.Staff. The November 2013 OVA is an optional extra. Kud Wafter, a spin-off about Kudryavka, and Kaginado are separate.",
    promote: ["little-busters-ex"],
  },
  "digimon-adventure": {
    label: "Digimon Adventure",
    intro: "Start with the short film Digimon Adventure (March 6, 1999), released the day before the 54-episode series (March 1999–March 2000). Then watch the film Our War Game! (March 2000), Digimon Adventure 02 (April 2000–March 2001) with its two films, Hurricane Touchdown (July 2000) and Revenge of Diaboromon (March 2001), then the six tri. films (2015–2018), Last Evolution Kizuna (February 2020) and Digimon Adventure 02: The Beginning (October 2023), which is set after Kizuna. The 20th Memorial Story shorts and the 2025 Beyond video are optional extras. Digimon: The Movie is an English edit of the early films, and the 2020 Digimon Adventure: is a reboot.",
    optional: ["digimon-adventure-20-shuunen-memorial-story"],
  },
  mononoke: {
    label: "Mononoke",
    intro: "Mononoke (12 episodes, July–September 2007) is a spin-off of the 2006 anthology Ayakashi: Samurai Horror Tales, following the Medicine Seller from its Bakeneko story; that story is an optional prequel, and the other Ayakashi stories are separate tales. After the series, watch the film trilogy: The Phantom in the Rain (July 2024), Hinezumi (March 2025) and Hebigami (May 2026). Kitsu only links the first film, so the other two were added. A new Mononoke project, led by a new Medicine Seller, was announced in July 2026 with no format or date yet.",
    demote: ["ayakashi-japanese-classic-horror"],
    promote: ["Mononoke-Karakasa", "Mononoke-Hinezumi", "Mononoke-Hebigami"],
    mainOrder: ["mononoke", "Mononoke-Karakasa", "Mononoke-Hinezumi", "Mononoke-Hebigami"],
  },
  "school-rumble": {
    label: "School Rumble",
    intro: "Watch School Rumble (26 episodes, October 2004–March 2005), the two-part OVA Extra Class (December 2005), the second season, 2nd Semester (26 episodes, April–September 2006), then 3rd Semester, two OVA episodes released from July to September 2008. 3rd Semester is the last School Rumble anime, so the story continues only in the manga.",
    promote: ["school-rumble-ichi-gakki-hoshuu"],
  },
  "ginga-eiyuu-densetsu": {
    label: "Legend of the Galactic Heroes",
    intro: "Start with the film My Conquest Is the Sea of Stars (February 1988), which shows the first clash between Reinhard and Yang, then the 110-episode OVA series (1988–1997), which picks up where the film ends. Overture to a New War (1993) expands the first two OVA episodes and Golden Wings (1992) adapts a side story; both are optional. The Gaiden OVAs (1998–2000) are prequel side stories. Die Neue These (2018 onward, Production I.G) is a remake.",
    demote: ["ginga-eiyuu-densetsu-gaiden-ougon-no-tsubasa", "ginga-eiyuu-densetsu-arata-naru-tatakai-no-overture"],
    mainOrder: ["ginga-eiyuu-densetsu-waga-yuku-wa-hoshi-no-taikai", "ginga-eiyuu-densetsu"],
  },
  gantz: {
    label: "Gantz",
    intro: "The Gonzo anime is 26 episodes split into two seasons in 2004: Gantz (April–June) and Gantz 2nd Stage (August–November). Watch them in that order. Gantz:O (October 2016) is a full-CG film by Digital Frontier that starts the story over with Katou and moves the mission to Osaka; it is not a sequel and can be watched on its own.",
  },
  "tales-of-zestiria-the-x": {
    label: "Tales of Zestiria the X",
    intro: "Watch the prologue, The Age of Chaos (July 3, 2016), then the first season (July–September 2016) and the second season (13 episodes, January–April 2017), all by ufotable. The series adapts the game Tales of Zestiria and includes events tied to Tales of Berseria. Dawn of the Shepherd (December 2014) is an earlier one-off special and is listed as an alternative version.",
  },
  "ef-a-tale-of-memories": {
    label: "ef: A Tale of Memories",
    intro: "Watch ef: A Tale of Memories (12 episodes, October–December 2007), then the second season, ef: A Tale of Melodies (12 episodes, October–December 2008), both by Shaft. The short Memories prologue special (August 2007), which Kitsu lists first, is optional. Recollections (September 2008) is a recap of the first season and can be skipped before Melodies.",
    demote: ["ef-a-tale-of-memories-prologue"],
  },
  "girls-und-panzer": {
    label: "Girls und Panzer",
    intro: "Watch the 12-episode TV series (October 2012–March 2013; the last two episodes aired in March), the OVA This Is the Real Anzio Battle! (July 2014), then Girls und Panzer der Film (November 2015). Then the das Finale films, planned as six parts: Part 1 (December 2017), Part 2 (June 2019), Part 3 (March 2021), Part 4 (October 2023) and Part 5 (October 9, 2026). The disc specials and Yukari's tank lectures are optional.",
    promote: ["girls-und-panzer-kore-ga-hontou-no-anzio-sen-desu"],
    optional: ["girls-und-panzer-der-film-arisu-war"],
  },
  xxxholic: {
    label: "xxxHolic",
    intro: "Watch xxxHolic (24 episodes, April–September 2006), then the second season, xxxHolic Kei (13 episodes, April–June 2008), then the OVAs Shunmuki (2009), bundled with manga volumes 14 and 15, and Rou (April 2010–March 2011). The film A Midsummer Night's Dream (August 2005), made by Production I.G before the series, is an optional standalone story. The story crosses over with Clamp's Tsubasa: Reservoir Chronicle.",
  },
  "initial-d-first-stage": {
    label: "Initial D",
    intro: "Watch the Stages in order: First Stage (26 episodes, 1998), Second Stage (1999–2000), the film Third Stage (January 2001), Fourth Stage (2004–2006), Fifth Stage (2012–2013) and Final Stage (May–June 2014). The Extra Stage OVAs are optional side stories; the Battle Stage videos, the 2007 Project D recap special and New Initial D the Movie (2014–2016), a film trilogy that retells the start, can be skipped. MF Ghost, a sequel series set years later, follows: Season 1 (October–December 2023), Season 2 (October–December 2024) and Season 3 (January–March 2026), with a final season announced in March 2026.",
  },
  dorohedoro: {
    label: "Dorohedoro",
    intro: "Watch Season 1 (12 episodes, January–March 2020, by MAPPA), then Season 2 (April–May 2026). A third season has been announced with no date yet. Bonus Curse (Ma no Omake), six mini-episodes bundled with the second Blu-ray box in June 2020, is an optional extra. There are no films or recaps to fit in.",
  },
  "gatchaman-crowds": {
    label: "Gatchaman Crowds",
    intro: "Watch Gatchaman Crowds (12 episodes, July–September 2013), then the prologue episode Insight: Inbound, first streamed on Hulu on June 20, 2015, then the second season, Gatchaman Crowds Insight (July–September 2015). Embrace (January 2014), listed as an alternative version, is the Japan-only director's cut of the first season's final episode, with an extended ending; watch it in place of episode 12 if you can.",
  },
  "tiger-bunny": {
    label: "Tiger & Bunny",
    intro: "Watch Tiger & Bunny (25 episodes, April–September 2011), then the film The Rising (February 2014), which continues the story, then Tiger & Bunny 2, released on Netflix in two parts (April and October 2022). The first film, The Beginning (September 2012), is based on the first two episodes with new scenes, so it is optional. The pilot, which Kitsu lists first, was a bonus on the first disc volume.",
    demote: ["tiger-bunny-pilot"],
  },
  "mairimashita-iruma-kun": {
    label: "Welcome to Demon School! Iruma-kun",
    intro: "Watch the four seasons in order: Season 1 (23 episodes, October 2019–March 2020), Season 2 (April–September 2021), Season 3 (October 2022–March 2023) and Season 4 (April–September 2026), all by BN Pictures. A new film has been announced. IruMafia Edition (from January 2027) is an anime of the mafia spin-off manga, separate from the main story.",
  },
  "uchuu-kyoudai": {
    label: "Space Brothers",
    intro: "Watch the 99-episode series by A-1 Pictures (April 2012–March 2014), then the prequel film Space Brothers #0 (August 9, 2014), which was made after the series ended; Kitsu lists it first because it is set earlier. The planetarium special One Point of Light (summer 2012), the OVA Apo's Dream and the 2017 Space Dreamers film are optional extras. There are no further seasons.",
    demote: ["uchuu-kyoudai-number-zero"],
  },
  "golden-kamuy": {
    label: "Golden Kamuy",
    intro: "Watch Seasons 1 and 2 (April–December 2018, by Geno Studio) and Season 3 (October–December 2020), then Season 4 (October 2022–June 2023, by Brain's Base), the two-part prologue film Sapporo Beer Brewery Arc (October 2025), and the final season (January–March 2026). A sequel adapting the rest of the final arc, the Runaway Train arc, has been announced. The OVAs and the Golden Douga Gekijou shorts are optional.",
  },
  "sidonia-no-kishi": {
    label: "Knights of Sidonia",
    intro: "Watch Knights of Sidonia (12 episodes, April–June 2014), then Battle for Planet Nine (April–June 2015), then the sequel film Love Woven in the Stars (June 2021). The two TV seasons are full-CG series by Polygon Pictures. The March 2015 film, listed under safe to skip, is a compilation of the first season.",
  },
  "maken-ki": {
    label: "Maken-ki!",
    intro: "Watch Maken-ki! (12 episodes, October–December 2011), the two OVA episodes (February 2012 and September 2013), then the second season, Maken-ki! Two (10 episodes, January–March 2014). The Secret Training specials released with each season's disc volumes are optional extras.",
  },
  "slam-dunk": {
    label: "Slam Dunk",
    intro: "Watch the 101-episode series by Toei Animation (October 1993–March 1996), then The First Slam Dunk (December 2022), written and directed by creator Takehiko Inoue. The TV series stops before the National Tournament, and the film adapts part of that later arc, so watch it after the series. The four short films from 1994 and 1995 are optional side stories.",
  },
  "gochuumon-wa-usagi-desu-ka": {
    label: "Is the Order a Rabbit?",
    intro: "Watch Season 1 (12 episodes, April–June 2014), Season 2 (October–December 2015), the OVA films Dear My Sister (November 2017) and Sing for You (September 2019), then Season 3, BLOOM (October–December 2020). The two OVA films were animated by production doA and fit between Seasons 2 and 3. A new film, by Bibury Animation Studios, has been announced.",
  },
  "kantai-collection": {
    label: "KanColle",
    intro: "Watch KanColle (12 episodes, January–March 2015), then KanColle: The Movie (November 26, 2016), released after it. KanColle: Let's Meet at Sea (November 2022–March 2023), made by ENGI, is a second anime with the destroyer Shigure as the lead; Kitsu lists it as the next season. All of it is based on the browser game by Kadokawa Games and DMM.com.",
  },
  "yowamushi-pedal": {
    label: "Yowamushi Pedal",
    intro: "Watch the five seasons in order: Yowamushi Pedal (38 episodes, October 2013–July 2014), Grande Road (October 2014–March 2015), New Generation (January–June 2017), Glory Line (January–June 2018) and Limit Break (October 2022–March 2023). The August 2015 film is an optional side story set after Grande Road, so watch it any time after that season. Re:Ride, Re:Road and Re:Generation are compilation films and can be skipped, and Spare Bike is a spin-off.",
    demote: ["yowamushi-pedal-movie"],
  },
  "otome-game-no-hametsu-flag-shika-nai-akuyaku-reijou-ni-tensei-shiteshimatta": {
    label: "My Next Life as a Villainess",
    intro: "Watch Season 1 (12 episodes, April–June 2020) and Season 2 (July–September 2021), both by Silver Link, then the film (December 8, 2023). The OVA bundled with the special edition of manga volume 7 (September 30, 2021) is an extra episode that fits after Season 2. Katarina's Brain Conference and the other web shorts are optional.",
  },
  "squid-girl": {
    label: "Squid Girl",
    intro: "Watch Squid Girl (12 episodes, October–December 2010), then the second season (12 episodes, September–December 2011), both by Diomedéa, then the three OVA episodes released between 2012 and 2014. The two specials from May 2011 are optional extras. There are no films or recaps, and no third TV season was made.",
  },
  "mobile-suit-gundam-00": {
    label: "Mobile Suit Gundam 00",
    intro: "Watch Season 1 (25 episodes, October 2007–March 2008), Season 2 (25 episodes, October 2008–March 2009), then the sequel film A Wakening of the Trailblazer (September 18, 2010), where the story continues. Gundam 00 is set in its own Anno Domini timeline, so no other Gundam series is needed first. The Special Edition films are compilations with new scenes and can be skipped.",
  },
  "gunslinger-girl": {
    label: "Gunslinger Girl",
    intro: "Watch Gunslinger Girl (13 episodes, October 2003–February 2004, by Madhouse), then the sequel Il Teatrino (13 episodes, January–April 2008, by Artland), then the two Il Teatrino OVA episodes released on DVD in October 2008. Each season adapts the manga, and Il Teatrino continues the story with a new studio.",
  },
  "hayate-no-gotoku-1": {
    label: "Hayate the Combat Butler",
    intro: "Watch Season 1 (52 episodes, April 2007–March 2008, by SynergySP), the OVA from March 2009, Season 2 (25 episodes, April–September 2009, by J.C.Staff), the film Heaven Is a Place on Earth (August 2011), then Can't Take My Eyes Off You (October–December 2012), which follows the film, and Cuties (April–July 2013). The 2014 OVAs are optional.",
  },
  "hetalia-axis-powers": {
    label: "Hetalia",
    intro: "Watch the seasons in release order: Axis Powers (January 2009–March 2010), World Series (March 2010–March 2011), The Beautiful World (January–June 2013), The World Twinkle (July–October 2015) and World★Stars (April–June 2021). The film Paint It, White! (June 2010), the fan disc and the extra episodes are optional. Kitsu files World★Stars as a side entry, so it was moved into the main order; the 2026 World★Stars ONA is listed as an extra.",
    promote: ["hetalia-world-stars"],
    mainOrder: ["hetalia-axis-powers", "hetalia-world-series", "hetalia-the-beautiful-world", "hetalia-the-world-twinkle", "hetalia-world-stars"],
    optional: ["hetalia-world-stars-2026"],
  },
  "ousama-ranking": {
    label: "Ranking of Kings",
    intro: "Watch Ranking of Kings (23 episodes, October 2021–March 2022, by Wit Studio), then The Treasure Chest of Courage (10 episodes, April–June 2023), a spin-off series set in the same world. An anime film has been announced with no release date yet. There are no recaps or OVAs to fit in.",
  },
  "diamond-no-ace": {
    label: "Ace of Diamond",
    intro: "Watch Ace of Diamond (75 episodes, October 2013–March 2015) and Second Season (51 episodes, April 2015–March 2016), then Act II (52 episodes, April 2019–March 2020), which adapts the sequel manga. Act II's second season, made by OLM, is split in two cours: the first aired from April to June 2026 and the second began on October 11, 2026. The OVAs are optional extras.",
  },
  "kiniro-mosaic": {
    label: "Kiniro Mosaic (Kinmoza!)",
    intro: "Watch Kiniro Mosaic (12 episodes, July–September 2013) and Hello!! Kiniro Mosaic (April–June 2015), both by Studio Gokumi, then the OVA film Pretty Days (November 2016) and the film Thank You!! (August 20, 2021), which continues the story after it. There are no recaps or alternative versions to skip.",
  },
  "tsubasa-chronicle": {
    label: "Tsubasa: Reservoir Chronicle",
    intro: "Watch Tsubasa Chronicle (26 episodes, April–October 2005), the film The Princess in the Birdcage Kingdom (August 2005), released between the two seasons, and Season 2 (April–November 2006). Then watch the OVAs Tokyo Revelations (November 2007–March 2008) and Spring Thunder Chronicle (March–May 2009), which continue the story. Kitsu files the OVAs as alternatives, so they were added to the core order.",
    promote: ["tsubasa-tokyo-revelations", "tsubasa-shunraiki"],
  },
  genshiken: {
    label: "Genshiken",
    intro: "Watch Genshiken (12 episodes, October–December 2004), the three-episode OVA (December 2006–April 2007), Genshiken 2 (October–December 2007), then Genshiken Second Generation (July–September 2013), which adapts the sequel manga, Genshiken: Second Season, and its OVA (December 2013). The OVA is set just before Second Generation but came out after it, so this guide keeps release order. Kujibiki Unbalance is the club's in-universe anime, released as a spin-off.",
    mainOrder: ["genshiken", "genshiken-ova", "genshiken-2", "genshiken-nidaime", "genshiken-nidaime-ova"],
  },
  "ranma-nettou-hen": {
    label: "Ranma ½",
    intro: "Watch the Studio Deen TV anime (April 1989–September 1992), broadcast first as Ranma ½ and then as Ranma ½ Nettōhen; Kitsu counts both as one entry. Then the OVAs (1993–1996), the 1994 film Team Ranma vs. the Legendary Phoenix and the 2008 OVA; the 1991 and 1992 films are optional side stories. The 2024 MAPPA series is a new adaptation: Season 1 (October–December 2024), Season 2 (October–December 2025) and Season 3, which began in October 2026.",
    optional: ["Ranma-12-2024-2", "Ranma-12-2024-3", "Ranma-12-2024"],
  },
  "aria-the-animation": {
    label: "Aria",
    intro: "Watch Aria the Animation (13 episodes, October–December 2005), Aria the Natural (26 episodes, April–September 2006), the OVA Arietta (September 2007) and Aria the Origination (January–April 2008), then the later entries: Aria the Avvenire (2015) and the films Aria the Crepuscolo (March 5, 2021) and Aria the Benedizione (December 3, 2021). Kitsu doesn't link Benedizione, so it was added.",
    promote: ["aria-the-crepuscolo", "aria-the-benedizione"],
    mainOrder: ["aria-the-animation", "aria-the-natural", "aria-the-ova-arietta", "aria-the-origination", "aria-the-avvenire", "aria-the-crepuscolo", "aria-the-benedizione"],
  },
  "kage-no-jitsuryokusha-ni-naritakute": {
    label: "The Eminence in Shadow",
    intro: "Watch Season 1 (20 episodes, October 2022–February 2023), then Season 2 (12 episodes, October–December 2023), both by Nexus. The anime film Lost Echoes is set to open in 2027. The Kage-Jitsu! chibi shorts that streamed alongside each season are optional.",
  },
  gokushufudou: {
    label: "The Way of the Househusband",
    intro: "The Way of the Househusband is a Netflix series by J.C.Staff with three batches of five episodes: Part 1 (April 2021), Part 2 (October 2021) and Season 2 (January 2023). Watch them in that order; there are no anime films, OVAs or recaps (the 2020 TV drama and 2022 film are live-action). Part 1 and Part 2 together make up the first season.",
  },
  "selector-infected-wixoss": {
    label: "WIXOSS",
    intro: "Watch selector infected WIXOSS (12 episodes, April–June 2014), then selector spread WIXOSS (October–December 2014), then the sequel Lostorage incited WIXOSS (October–December 2016), the special -missing link- (December 2017) and the second season, Lostorage conflated WIXOSS (April–June 2018), all by J.C.Staff. The film selector destructed WIXOSS (February 2016) is a compilation and can be skipped. WIXOSS Diva(A)Live (2021) is a separate series.",
    promote: ["lostorage-conflated-wixoss-missing-link"],
    mainOrder: ["selector-infected-wixoss", "selector-spread-wixoss", "lostorage-incited-wixoss", "lostorage-conflated-wixoss-missing-link", "lostorage-conflated-wixoss"],
  },
  "shugo-chara": {
    label: "Shugo Chara!",
    intro: "Watch the three Satelight series in order: Shugo Chara! (51 episodes, October 2007–September 2008), Shugo Chara!! Doki (51 episodes, October 2008–September 2009) and Shugo Chara! Party! (October 2009–March 2010), the final part. There are no films, OVAs or recaps to fit in, so broadcast order is the whole guide.",
  },
  "junjou-romantica": {
    label: "Junjo Romantica",
    intro: "Watch the three seasons in order: Junjo Romantica (12 episodes, April–June 2008), Junjo Romantica 2 (October–December 2008) and Junjo Romantica 3 (July–September 2015). The January 2008 special and the OVA episodes from 2012 and 2015 are optional extras. Sekaiichi Hatsukoi (2011) is a spin-off by the same author, Shungiku Nakamura, with its own couples.",
  },
  "sekaiichi-hatsukoi": {
    label: "Sekaiichi Hatsukoi",
    intro: "Watch Sekaiichi Hatsukoi (12 episodes, April–June 2011) and its second season (October–December 2011), both by Studio Deen, then the Proposal Arc (February 2020). The OVAs from 2011 are optional, as is the March 2014 film The Case of Takafumi Yokozawa. Junjo Romantica is an earlier, separate series by the same author.",
  },
  "hyakka-ryouran-samurai-girls": {
    label: "Samurai Girls",
    intro: "Watch Samurai Girls (12 episodes, 2010, by Arms), then the second season, Samurai Bride (April–June 2013), then the two-episode OVA Samurai After (January–July 2015). Each season's specials, released on its disc volumes, are optional extras. There are no films or recaps.",
  },
  "aggressive-retsuko-ona": {
    label: "Aggretsuko",
    intro: "Watch the five Netflix seasons in order: Season 1 (April 2018), Season 2 (June 2019), Season 3 (August 2020), Season 4 (December 2021) and Season 5 (February 2023), the final season. The Christmas special We Wish You a Metal Christmas (December 2018) fits between Seasons 1 and 2. The 100 one-minute TBS shorts (2016–2018) came first; they are separate gags and are optional.",
    optional: ["aggressive-retsuko"],
  },
  kingdom: {
    label: "Kingdom",
    intro: "Watch the six seasons in order: Season 1 (38 episodes, June 2012–February 2013), Season 2 (39 episodes, June 2013–March 2014), Season 3 (April 2020–October 2021), Season 4 (April–October 2022), Season 5 (January–March 2024) and Season 6 (October–December 2025), produced by studio Pierrot. A continuation of Season 6 has been announced. The five-minute recap videos can be skipped.",
  },
  "yuuki-yuuna-wa-yuusha-de-aru": {
    label: "Yuki Yuna Is a Hero",
    intro: "Start with Yuki Yuna Is a Hero (12 episodes, October–December 2014). The second season has two parts: Washio Sumi Chapter (October–November 2017), a prequel set two years earlier, and Hero Chapter (November 2017–January 2018), the sequel. Then watch the third season, Great Mankai Chapter (October–December 2021). Kitsu puts the prequel first; this guide follows release order. Churutto! (2021) is a short spin-off series.",
    demote: ["yuuki-yuuna-wa-yuusha-de-aru-hidamari"],
    promote: ["yuuki-yuuna-wa-yuusha-de-aru-dai-mankai-no-shou"],
    mainOrder: ["yuuki-yuuna-wa-yuusha-de-aru", "yuuki-yuuna-wa-yuusha-de-aru-washio-sumi-no-shou", "yuuki-yuuna-wa-yuusha-de-aru-yuusha-no-shou-tv", "yuuki-yuuna-wa-yuusha-de-aru-dai-mankai-no-shou"],
  },
  "honzuki-no-gekujou-shisho-ni-naru-tame-niwa-shudan-o-erandeiramasen": {
    label: "Ascendance of a Bookworm",
    intro: "Watch Season 1 (14 episodes, October–December 2019), Season 2 (April–June 2020) and Season 3 (April–June 2022), all by Ajiado, then Season 4 (April–October 2026, by Wit Studio). The two-part OVA from March 2020 is optional and fits between Seasons 1 and 2. The March 2022 special is a recap. A fifth season has been announced.",
  },
  "osomatsu-san": {
    label: "Mr. Osomatsu (Osomatsu-san)",
    intro: "Mr. Osomatsu (Osomatsu-san) follows the sextuplets of the 1962 manga Osomatsu-kun as adults, so you can start with it. Watch Season 1 (October 2015–March 2016), Season 2 (October 2017–March 2018), the film (March 2019), Season 3 (October 2020–March 2021) and Season 4 (July–October 2025; its delayed final episode came out in June 2026). The two later films, The Hipipo Tribe and the Glistening Fruit (July 2022) and The Soul's Takoyaki Party and the Legendary Sleepover Party (July 2023), are optional, as are the 1966 and 1988 Osomatsu-kun series; the many shorts are extras.",
    demote: ["osomatsu-kun-1988"],
    promote: ["osomatsu-san-3", "osomatsu-san-4"],
    mainOrder: ["osomatsu-san", "osomatsu-san-2", "osomatsu-san-the-movie", "osomatsu-san-3", "osomatsu-san-4"],
    optional: ["osomatsu-kun"],
  },
  "bocchi-the-rock": {
    label: "Bocchi the Rock!",
    intro: "Bocchi the Rock! has one 12-episode season by CloverWorks (October–December 2022) as of November 2026. The two compilation films from June and August 2024 retell the series and can be skipped. A second season has been announced, and a prequel film, Starry Footprints, is set for 2027; Kitsu lists the film first, but start with the series.",
    demote: ["Bocchi-the-Rock-Hoshi-no-Ashiato"],
  },
  "high-score-girl": {
    label: "Hi Score Girl",
    intro: "Watch Hi Score Girl (12 episodes, July–September 2018), the three-episode OVA Extra Stage (March 20, 2019), then High Score Girl II (9 episodes, October–December 2019), all by J.C.Staff and SMDE. Extra Stage came out between the two seasons, so watch it before the second. There are no films or recaps.",
  },
  utawarerumono: {
    label: "Utawarerumono",
    intro: "Watch Utawarerumono (26 episodes, April–September 2006), then The False Faces (October 2015–March 2016) and Mask of Truth (July–December 2022), which adapt the sequel games Mask of Deception and Mask of Truth. The three OVAs (2009–2010) tell side stories from the original game and are optional, as are the 2006 specials; the recaps can be skipped.",
  },
  "prince-of-tennis": {
    label: "The Prince of Tennis",
    intro: "Watch the 178-episode TV series (October 2001–March 2005), then the OVA sequel in three parts, The National Tournament, Semifinals and Finals (26 episodes, March 2006–January 2009). The films and the Another Story OVAs (2009 and 2011), which are side stories, are optional. The New Prince of Tennis (2012) and its U-17 World Cup seasons (2022, 2024, and a third that began in October 2026) adapt the sequel manga; Kitsu doesn't link them, so they were added as extras.",
    demote: ["prince-of-tennis-another-story-messages-from-past-and-future", "prince-of-tennis-another-story-ii-ano-toki-no-bokura"],
    optional: ["new-prince-of-tennis", "new-prince-of-tennis-ova-vs-genius10", "shin-tennis-no-oujisama-u17-world-cup", "shin-tennis-no-ouji-sama-u-17-world-cup-semifinal", "shin-tennis-no-ouji-sama-u-17-world-cup-kesshou-member-ketteisen"],
  },
  "uta-no-prince-sama-maji-love-1000": {
    label: "Uta no Prince-sama",
    intro: "Watch the four seasons by A-1 Pictures in order: Maji Love 1000% (July–September 2011), Maji Love 2000% (April–June 2013), Maji Love Revolutions (April–June 2015) and Maji Love Legend Star (October–December 2016). Then the films Maji Love Kingdom (June 2019) and Maji Love ST☆RISH Tours (September 2022). The 2013 Christmas special and the July 2022 Tours special are optional extras. A further film, Taboo Night XXXX (May 2025), isn't on Kitsu yet, so it isn't listed here.",
    demote: ["uta-no-prince-sama-maji-love-2000-special", "uta-no-prince-sama-maji-love-st-rish-tours-tabi-no-hajimari"],
  },
  macross: {
    label: "Macross",
    intro: "Watch in release order: Super Dimension Fortress Macross (October 1982–June 1983), Macross Plus (OVA, 1994–1995), Macross 7 (1994–1995), the Dynamite 7 OVA (1997–1998), Macross Zero (OVA, 2002–2004), Macross Frontier (2008), Macross Delta (2016), then the Delta films Passionate Walküre (February 2018), which retells the series with changes, and its sequel Absolute Live!!!!!! (October 2021). Zero is a prequel, which is why Kitsu lists it first. Do You Remember Love? (1984) and the two Frontier films retell their series and are optional, as is the 1995 Macross 7 short film. A new Macross anime from Sunrise was announced in 2023 and has no release date yet.",
    mainOrder: ["macross", "macross-plus", "macross-7", "macross-dynamite-7", "macross-zero", "macross-frontier", "macross-delta", "macross-delta-gekijou-no-walkure", "macross-zettai-live"],
    promote: ["macross-delta-gekijou-no-walkure"],
    exclude: ["macross-2018"],
  },
  "top-wo-nerae": {
    label: "Gunbuster (Aim for the Top!)",
    intro: "Watch Gunbuster, Gainax's six-episode OVA (October 1988–July 1989), then its sequel Diebuster (Gunbuster 2, October 2004–August 2006), which has new characters and mecha but keeps the original's format. The Gattai!! film (2006) is a compilation of both, and the Science Lesson shorts are extras. Kitsu lists an Aim for the Top! 3 entry that neither Wikipedia nor MyAnimeList records as an anime, so it was removed.",
    exclude: ["top-wo-nerae-3"],
  },
  "mobile-suit-gundam-seed": {
    label: "Mobile Suit Gundam SEED",
    intro: "Watch Gundam SEED (50 episodes, October 2002–September 2003), the special After-Phase: Between the Stars (2004), Gundam SEED Destiny (50 episodes, October 2004–October 2005) and Final Plus (December 2005), then the follow-up film SEED Freedom (January 2024). A prequel film set before SEED Freedom, SEED Freedom Zero, opens in Japan on January 15, 2027. SEED is set in its own Cosmic Era timeline, so the 1979 Mobile Suit Gundam was removed from the list. The Special Editions are compilations; Astray and Stargazer are side stories.",
    promote: ["mobile-suit-gundam-seed-freedom"],
    exclude: ["mobile-suit-gundam-0079"],
  },
  "fate-grand-order-zettai-majuu-sensen-babylonia": {
    label: "Fate/Grand Order",
    intro: "Story order: the TV special First Order (December 31, 2016), the two Camelot films (December 2020 and May 2021), which adapt the game's sixth chapter, then Babylonia (21 episodes, October 2019–March 2020), the seventh, with its Episode 0, Initium Iter, and the film Solomon (July 30, 2021), the final chapter of Part 1. Babylonia came out before Camelot, so release order also works. Moonlight/Lostroom and the short specials are optional.",
    promote: ["fate-grand-order-first-order", "fate-grand-order-shinsei-entaku-ryouiki-camelot-wandering-agateram", "fate-grand-order-shinsei-entaku-ryouiki-camelot-paladin-agateram"],
    mainOrder: ["fate-grand-order-first-order", "fate-grand-order-shinsei-entaku-ryouiki-camelot-wandering-agateram", "fate-grand-order-shinsei-entaku-ryouiki-camelot-paladin-agateram", "fate-grand-order-zettai-majuu-sensen-babylonia-initium-iter", "fate-grand-order-zettai-majuu-sensen-babylonia", "fate-grand-order-shuukyoku-tokuiten-kani-jikan-shinden-solomon"],
  },
  "tsuki-ga-michibiku-isekai-douchuu": {
    label: "Tsukimichi: Moonlit Fantasy",
    intro: "Watch Season 1 (12 episodes, July–September 2021, by C2C), then Season 2 (25 episodes, January–June 2024, by J.C.Staff), a two-cour season. A third season has been announced with no release date yet. There are no films, OVAs or recaps to fit in.",
  },
  "sengoku-basara": {
    label: "Sengoku Basara: Samurai Kings",
    intro: "Watch Sengoku Basara (12 episodes, April–June 2009), Sengoku Basara II (July–September 2010), then the film The Last Party (June 4, 2011), the finale of that story. The specials and the Mini Sengoku Basara shorts are optional. Judge End (July–September 2014) is a separate adaptation of the third game, listed as an alternative version, and Gakuen Basara (2018) is based on a separate spin-off manga.",
  },
  cencoroll: {
    label: "Cencoroll",
    intro: "Cencoroll is a short film written, designed, directed and animated by Atsuya Uki, which premiered in July 2009. Its sequel, Cencoroll 2, was released on June 29, 2019, shown together with the first film as Cencoroll Connect. A third film, Cencoroll 3, has been announced with no date yet. Watch them in order.",
  },
  "garo-honoo-no-kokuin": {
    label: "Garo: The Animation",
    intro: "Watch Garo: The Carved Seal of Flames (24 episodes, October 2014–March 2015), its 25th episode Home (September 2015), then the film Divine Flame (May 21, 2016), set four years after the series. Crimson Moon (October 2015–April 2016), set in the Heian period, and Vanishing Line (October 2017–March 2018) are separate series in different settings, so they are listed as spin-offs. The YuruGaro shorts are optional.",
  },
  "uchuu-senkan-yamato-2199": {
    label: "Space Battleship Yamato 2199",
    intro: "Space Battleship Yamato 2199 (26 episodes) is a remake of the 1974 series. It was shown in theatres in seven chapters (2012–2013), then aired on TV from April to September 2013, so watch the episodes, not the chapter films. Odyssey of the Celestial Ark (December 2014) is an original film; A Voyage to Remember is a compilation. Then watch the sequels 2202 (2017–2019), 2205: The New Voyage (2021–2022) and Rebel 3199 (from July 2024).",
    optional: ["space-battleship-yamato-2205-a-new-journey", "uchuu-senkan-yamato-2205-aratanaru-tabidachi-koushou-stasha", "yamato-yo-towa-ni-rebel3199"],
  },
  "uq-holder": {
    label: "UQ Holder! (and Negima!)",
    intro: "UQ Holder! (12 episodes, October–December 2017) is set decades after Ken Akamatsu's Negima!, and its OVAs are extras. Kitsu builds this list from the Negima! OVAs that come before it: Ala Alba (2008–2009), Another World (2009–2010) and the film Anime Final (August 2011). The 2006 retelling Negima!? has a plot different from the manga, so it is listed as an alternative; the 2005 Negima! TV series also departs from the manga and isn't linked here.",
  },
  ikkitousen: {
    label: "Ikki Tousen",
    intro: "Watch the four TV seasons in order: Ikki Tousen (13 episodes, July–October 2003), Dragon Destiny (February–May 2007), Great Guardians (June–August 2008) and Xtreme Xecutor (March–June 2010). Then the OVAs Shūgaku Tōshi Keppu-roku (November 2011), Extravaganza Epoch (December 2014) and Western Wolves (January–February 2019), and Shin Ikki Tousen (May 2022).",
  },
  "aa-megami-sama-tv": {
    label: "Ah! My Goddess",
    intro: "Watch the TV series Ah! My Goddess (24 episodes, January–July 2005), its sequel Flights of Fancy (April–September 2006) and the two-episode special Fighting Wings (December 2007), then the Together Forever OVAs (2011–2013). The 1993 OVA is an earlier, separate adaptation by the same studio, AIC, listed as an alternative, and Ah! My Goddess: The Movie (2000) is an optional standalone film. The Adventures of Mini-Goddess (1998–1999) is a spin-off.",
    optional: ["aa-megami-sama-movie"],
  },
  hakuouki: {
    label: "Hakuoki",
    intro: "Watch Hakuoki (12 episodes, April–June 2010) and Hekketsuroku (October–December 2010), then Reimeiroku (July–September 2012), which adapts the prequel game; Kitsu lists Reimeiroku first. The OVA series A Memory of Snow Flowers (August 2011–July 2012) is optional. The two films (August 2013 and March 2014) retell the first two seasons. Otogisōshi (2016) is a short spin-off, and the 2021–2022 OVA is a new series.",
    mainOrder: ["hakuouki", "hakuouki-hekketsuroku", "hakuouki-reimeiroku"],
    skip: ["hakuouki-movie-1-kyoto-ranbu", "hakuouki-movie-2"],
  },
  "senki-zesshou-symphogear-meteoroid-falling-burning-and-disappear-then": {
    label: "Symphogear",
    intro: "Watch the five Satelight seasons in order: Symphogear (13 episodes, January–March 2012), G (July–September 2013), GX (July–September 2015), AXZ (July–September 2017) and XV (July–September 2019), the final season. Each season after the first has a set of short specials released on its disc volumes; they are optional extras. There are no films or recaps.",
  },
  "hoozuki-no-reitetsu": {
    label: "Hozuki's Coolheadedness",
    intro: "Watch Season 1 (13 episodes, January–April 2014, by Wit Studio), then Season 2, which Studio Deen made in two cours: October–December 2017 and April–July 2018. The OVAs are optional: three by Wit Studio (2015) and one by Studio Deen (2017), grouped together, and three more by Pine Jam (2019–2020).",
  },
  noblesse: {
    label: "Noblesse",
    intro: "Start with Noblesse: Awakening (February 2016), a 31-minute ONA by Production I.G that adapts the first volume of the Korean webtoon, then the 13-episode TV series by Production I.G (October–December 2020), which picks up directly after it. The 2015 Korean animation Noblesse: The Beginning of Destruction, by Studio Animal, is an optional one-shot listed after the series.",
    demote: ["noblesse-pamyeol-ui-sijak"],
    promote: ["noblesse-awakening"],
    mainOrder: ["noblesse-awakening", "noblesse"],
  },
  "dies-irae": {
    label: "Dies irae",
    intro: "Watch Episode 0, The Dawning Days (October 7, 2017), then the 11 TV episodes by A.C.G.T (October–December 2017), then To the Ring Reincarnation (July 2018), the six final episodes, numbered 12 to 17, which were released only online. Together they adapt the visual novel. The Irasshai Sonnenji shorts are optional extras.",
  },
  slayers: {
    label: "Slayers",
    intro: "Watch the five TV seasons in order: Slayers (26 episodes, April–September 1995), Next (1996), Try (1997), Revolution (July–September 2008) and Evolution-R (January–April 2009), 104 episodes in all. The OVAs The Book of Spells (1996–1997) and Excellent (1998–1999) are side stories that Kitsu lists first because they are set earlier; they are optional, as are the theatrical films.",
    demote: ["slayers-excellent", "slayers-special"],
    mainOrder: ["slayers", "slayers-next", "slayers-try", "slayers-revolution", "slayers-evolution-r"],
    optional: ["slayers-the-motion-picture", "slayers-return", "slayers-great", "slayers-gorgeous", "slayers-premium"],
  },
  "nogizaka-haruka-no-himitsu": {
    label: "Haruka Nogizaka's Secret",
    intro: "Watch Haruka Nogizaka's Secret (12 episodes, July–September 2008, by Studio Barcelona), the second season Purezza (October–December 2009), then the four-episode OVA Finale (August–November 2012), the last part. Release order is the watch order, and there are no films or recaps to skip.",
  },
  "baki-the-grappler": {
    label: "Baki",
    intro: "Watch Grappler Baki (24 episodes, January–June 2001) and Maximum Tournament (24 episodes, July–December 2001), then the Netflix series Baki (June–December 2018) and its Great Raitai Tournament arc (June 2020), Baki Hanma (2021 and 2023) and Baki-Dou (February and June 2026). Kitsu stops at the 2016 special, so the Netflix seasons were added. The 1994 OVA is a separate adaptation, and Hanma Baki vs. Kengan Ashura (2024) is a crossover.",
    demote: ["baki"],
    promote: ["baki-ona", "baki-2nd-season", "hanma-baki-son-of-ogre", "hanma-baki-son-of-ogre-2", "baki-dou", "baki-dou-part-2"],
    mainOrder: ["baki-the-grappler", "baki-the-grappler-ii", "baki-ona", "baki-2nd-season", "hanma-baki-son-of-ogre", "hanma-baki-son-of-ogre-2", "baki-dou", "baki-dou-part-2"],
    optional: ["baki-hanma-vs-kengan-ashura"],
  },
  "persona-5-the-animation": {
    label: "Persona 5: The Animation",
    intro: "Watch the 26-episode series by CloverWorks (April–September 2018), then the two TV specials that continue it, Dark Sun (December 31, 2018) and Stars and Ours (March 2019). The two specials bundled with the Blu-ray volumes in May and June 2019 are optional extras. The Day Breakers (September 2016), made by A-1 Pictures before the game came out, is a separate one-off special.",
    optional: ["persona-5"],
  },
  "the-idolm-ster": {
    label: "The Idolmaster",
    intro: "Watch The Idolmaster (25 episodes, July–December 2011, by A-1 Pictures), then the film Beyond the Brilliant Future! (January 25, 2014). The June 2012 special and the Shiny Festa OVA from October 2012 are optional extras. Xenoglossia (2007, by Sunrise) is a separate mecha series that re-imagines the idols as robot pilots, and Cinderella Girls, SideM and Million Live follow other idol groups.",
    demote: ["the-idolm-ster-765-pro-to-iu-monogatari", "the-idolm-ster-shiny-festa"],
    optional: ["the-idolm-ster-live-for-you"],
  },
  "papa-no-iukoto-wo-kikinasai": {
    label: "Listen to Me, Girls. I Am Your Father!",
    intro: "Listen to Me, Girls. I Am Your Father! is one 12-episode series by Feel (January–March 2012). The special Pokkapoka (July 2012) and the two OVA episodes released in 2013 and 2015 are extra episodes that go after the series. There is no second season or film.",
  },
  "horizon-in-the-middle-of-nowhere": {
    label: "Horizon in the Middle of Nowhere",
    intro: "Watch Horizon in the Middle of Nowhere (13 episodes, October–December 2011), then Season 2 (13 episodes, July–September 2012), both by Sunrise. The short specials released online in 2011 and the new special made for the December 2018 Blu-ray box set are optional extras. There are no films or recaps.",
    demote: ["owari-no-chronicle"],
    exclude: ["owari-no-chronicle"],
  },
  "strike-witches": {
    label: "Strike Witches",
    intro: "Watch Strike Witches (12 episodes, July–September 2008), Strike Witches 2 (July–September 2010), the film (March 2012), which continues the story, the three-part OVA Operation Victory Arrow (2014–2015), then Road to Berlin (October–December 2020), the third season. The 2007 OVA was a preview episode, listed as an alternative. Brave Witches (2016) and Luminous Witches (2022) are spin-offs with new casts.",
    mainOrder: ["strike-witches", "strike-witches-2", "strike-witches-the-movie", "strike-witches-operation-victory-arrow", "dai-501-sougou-sentou-kuukoudan-strike-witches-road-to-berlin"],
  },
  "princess-principal": {
    label: "Princess Principal",
    intro: "Watch the 12-episode TV series by Studio 3Hz and Actas (July–September 2017), then the Crown Handler sequel films, planned as six parts: Chapter 1 (February 2021), Chapter 2 (September 2021), Chapter 3 (April 2023) and Chapter 4 (May 2025). Chapters 5 and 6 have no release date yet. The Ange Report recap can be skipped, and the picture dramas and short OVAs released with the films are optional.",
  },
  "minami-ke": {
    label: "Minami-ke",
    intro: "Watch the four seasons in order: Minami-ke (October–December 2007, by Daume), Okawari (January–March 2008) and Okaeri (January–March 2009), both by Asread, and Tadaima (January–March 2013, by Feel). The OVAs Betsubara (2009), Omatase (2012) and Natsuyasumi (2013) are extra episodes. A fifth series, Minami-ke: Korekara, by Liden Films, is set for April 2027.",
  },
  "terra-formars": {
    label: "Terra Formars",
    intro: "Watch the two-episode OVA Bugs 2 Arc (August–November 2014), which tells the earlier expedition, then the TV series (13 episodes, September–December 2014), which covers the Annex 1 arc, then Terra Formars: Revenge (April–June 2016). Then watch the two Earth Arc OVA episodes, released after Revenge. There is no third season.",
  },
  "dog-days": {
    label: "Dog Days",
    intro: "Watch the three seasons in order: Dog Days (13 episodes, April–June 2011), Dog Days' (13 episodes, July–September 2012) and Dog Days'' (12 episodes, January–March 2015), then the special Limone Resort Tenbou Onsen! (August 2015). It is an original series created by Masaki Tsuzuki and produced by Seven Arcs. The January 2015 recap and the disc specials can be skipped.",
  },
  "hack-sign": {
    label: ".hack//Sign",
    intro: "Watch .hack//Sign (26 episodes, April–September 2002, by Bee Train), then .hack//Legend of the Twilight (12 episodes, January–March 2003). The four Liminality OVAs came one with each of the .hack PS2 games (June 2002–April 2003) and are optional, as is the Gift OVA (November 2003). .hack//Roots (2006), the G.U. Returner OVA (2007), Quantum (2010–2011) and the 2012 film .hack//The Movie are separate .hack stories.",
    optional: ["hack-g-u-returner"],
  },
};
