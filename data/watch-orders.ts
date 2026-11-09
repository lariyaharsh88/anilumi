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
  },
  "one-piece": {
    label: "One Piece",
    intro: "There is one sequence: the TV series in order. Roughly a hundred of its 1,100-plus episodes are filler, but they come in short blocks, so use a filler guide rather than skipping whole arcs. The films are not canon; Strong World, Film Z, Stampede and Film Red are the ones with story ties, and none are required. Episode of East Blue and similar specials are recaps.",
    checked: "2026-11-03",
  },
  "boku-no-hero-academia": {
    label: "My Hero Academia",
    intro: "Release order is the right order: seasons 1 through 7, then the final season that began airing in October 2025. The four films (Two Heroes, Heroes Rising, World Heroes' Mission and You're Next) slot after seasons 2, 4, 5 and 6 and are optional. The OVAs are light side stories.",
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
    optional: ["sword-art-online-progressive-movie-hoshi-naki-yoru-no-aria", "sword-art-online-progressive-movie-kuraki-yuuyami-no-scherzo"],
    exclude: ["sword-art-online-movie-movie"],
  },
  "re-zero-kara-hajimeru-isekai-seikatsu": {
    label: "Re:Zero",
    demote: ["re-zero-kara-hajimeru-isekai-seikatsu-hyouketsu-no-kizuna"],
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
    intro: "Seasons 1 to 4 in order (Season 4 is split in two), then the 2024 film Decisive Battle at the Garbage Dump, which continues the story; a final film is planned. The OVAs are side matches and the recap films can be skipped.",
    promote: ["Haikyuu-Gomi-Suteba-no-Kessen"],
    mainOrder: ["haikyuu", "haikyuu-2", "haikyuu-karasuno-koukou-vs-shiratorizawa-gakuen-koukou", "haikyuu-to-the-top", "haikyuu-to-the-top-2", "Haikyuu-Gomi-Suteba-no-Kessen"],
  },
  "tokyo-ghoul": {
    label: "Tokyo Ghoul",
    intro: "Tokyo Ghoul, then Tokyo Ghoul √A (an anime-original route), then the two seasons of Tokyo Ghoul:re. The adaptation is heavily compressed from √A onward, which is why many fans switch to the manga. The OVAs Jack and Pinto are prequel side stories.",
  },
  bleach: {
    label: "Bleach",
    intro: "Watch episodes 1 to 366 of the original series, then Thousand-Year Blood War (50 episodes in four parts, 2022–2026), which adapts the final arc to the end. The filler episodes (33, 50, 64–108, 128–137, 147–149, 168–189, 204–205, 213–214, 228–266, 287, 298–299, 303–305, 311–341 and 355) can be skipped without losing anything; 109 and 342 mix canon and filler.",
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
    intro: "Season 1 (28 episodes), then Season 2 (January–March 2026). Season 3 is announced for October 2027. There are no films or recaps to worry about.",
  },
  "fate-zero": {
    label: "Fate series",
    intro: "Fate/Zero is the prequel, but it spoils parts of Fate/stay night. The usual advice is Fate/stay night: Unlimited Blade Works first, then Fate/Zero, then the Heaven's Feel film trilogy. Start with Zero only if you insist on chronological order. The 2006 Fate/stay night series is skippable.",
    promote: ["fate-stay-night-unlimited-blade-works-2014", "fate-stay-night-unlimited-blade-works-tv-2", "fate-stay-night-movie-heaven-s-feel", "fate-stay-night-movie-heaven-s-feel-2", "fate-stay-night-movie-heaven-s-feel-3"],
    mainOrder: ["fate-stay-night-unlimited-blade-works-2014", "fate-stay-night-unlimited-blade-works-tv-2", "fate-zero", "fate-zero-2nd-season", "fate-stay-night-movie-heaven-s-feel", "fate-stay-night-movie-heaven-s-feel-2", "fate-stay-night-movie-heaven-s-feel-3"],
    skip: ["fate-stay-night", "fate-stay-night-unlimited-blade-works", "fate-stay-night-tv-reproduction", "fate-zero-remix"],
  },
  bakemonogatari: {
    label: "Monogatari series",
    intro: "Release order is the intended order: Bakemonogatari, Nisemonogatari, Nekomonogatari (Black), Second Season, Hanamonogatari, Tsukimonogatari, Owarimonogatari, Koyomimonogatari, the Kizumonogatari films, Owarimonogatari II, Zoku Owarimonogatari, then Off & Monster Season (2024). Kizumonogatari is a prequel but lands best after Second Season.",
    promote: ["monogatari-series-off-monster-season"],
    exclude: ["mahou-shoujo-madoka-magica-movie-3-hangyaku-no-monogatari-magica-quartet-x-nisioisin", "nisekoimonogatari", "okitegami-kyouko-no-bibouroku-x-monogatari", "minna-to-manner-wo-manabou", "naisho-no-hanashi"],
  },
  "spy-x-family": {
    label: "Spy x Family",
    intro: "Season 1 (two halves), then the standalone film Code: White if you want it, then Season 2 and Season 3 (October 2025).",
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
  },
  "jojo-s-bizarre-adventure-2012": {
    label: "JoJo's Bizarre Adventure",
    intro: "Watch the parts in order: the 2012 series (Parts 1 and 2, Phantom Blood and Battle Tendency), Stardust Crusaders (two cours), Diamond Is Unbreakable, Golden Wind, then Stone Ocean (released in three batches). Each part has a new lead but builds on the previous ones, so don't skip ahead. The Thus Spoke Kishibe Rohan OVAs are optional side stories best watched after Diamond Is Unbreakable. The 1993–2002 Stardust Crusaders OVA and the 2007 Phantom Blood film are older, partial adaptations you can ignore. Part 7, Steel Ball Run, follows Stone Ocean; it began streaming on Netflix in March 2026.",
  },
  "neon-genesis-evangelion": {
    label: "Evangelion",
    intro: "Watch the 26-episode TV series, then The End of Evangelion. The film shows the outside events that episodes 25 and 26 depict as an inner monologue; the TV ending and the film are two views of the same conclusion, so watch both. Death & Rebirth is mostly a recap plus an early cut of End of Evangelion's first half, so skip it. The Rebuild films (1.0, 2.0, 3.0, 3.0+1.0) are a separate retelling with their own continuity; watch them afterwards, in order.",
    skip: ["neon-genesis-evangelion-death-rebirth"],
  },
  gintama: {
    label: "Gintama",
    intro: "Gintama (2006), Gintama' (2011), Enchousen, then the film Be Forever Yorozuya (2013), Gintama° (2015), Gintama. (2017), Porori-hen, the two Silver Soul cours (2018) and finally the film Gintama: The Final (2021), which is the real ending. Be Forever Yorozuya is an alternate-future story released before the manga ended; it is well loved but optional. The first film (Benizakura) and Yoshiwara in Flames (2026) retell arcs from the TV series and can be skipped, and the 2025 spin-off series Mr. Ginpachi's Zany Class is optional.",
  },
  "fairy-tail": {
    label: "Fairy Tail",
    intro: "Fairy Tail (2009, 175 episodes), Fairy Tail (2014, 102 episodes), Final Series (2018, 51 episodes), then the sequel 100 Years Quest (2024). The Key of the Starry Sky arc (episodes 125–150 of the first series) is anime-original filler. The two films, Phoenix Priestess and Dragon Cry, are standalone and optional; Dragon Cry fits best after the 2014 series.",
  },
  "mushoku-tensei-isekai-ittara-honki-dasu": {
    label: "Mushoku Tensei",
    intro: "Season 1 in two cours (2021), then Season 2 in two cours (2023–2024). Season 2 opens with an episode 0 (Guardian Fitz) that is a required prologue, not a recap. The OVA episodes are optional side stories. Season 3 Part 1 aired July–September 2026, with Part 2 due in 2027.",
  },
  "tensei-shitara-slime-datta-ken": {
    label: "That Time I Got Reincarnated as a Slime",
    intro: "Season 1 (2018), Season 2 in two parts (2021), the film Scarlet Bond (2022), Season 3 (2024), the film Tears of the Azure Sea (February 2026), then Season 4 (from April 2026, planned as five cours). The Slime Diaries (2021) is a comedy spin-off you can watch any time after Season 1, and the Visions of Coleus OVAs are optional.",
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
    intro: "Season 1, Season 2, Season 3 (Ultra Romantic), then the film The First Kiss That Never Ends, which adapts the next arc and continues straight on from Season 3. The 2025 special Stairway to Adulthood comes after the film, and a concluding film, The Final Chapter, was announced in early 2026.",
  },
  "oshi-no-ko": {
    label: "Oshi no Ko",
    intro: "Season 1, Season 2, then Season 3 (January–March 2026); a fourth and final season was announced in March 2026. The first episode is a 90-minute prologue that the whole story depends on, so don't skip it. There are no films or OVAs to slot in.",
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
    intro: "Index and Railgun share a world and overlap in time. Release order works well: Index (2008), Railgun (2009), Index II (2010), the film Miracle of Endymion (February 2013), Railgun S (April 2013), Index III (2018), Accelerator (2019) and Railgun T (2020). Railgun also stands on its own if you only want Misaka's story.",
  },
  "natsume-yuujinchou": {
    label: "Natsume's Book of Friends",
    intro: "Watch the seasons in order, from the first through Zoku, San, Shi, Go, Roku and Shichi, with the film Ephemeral Bond after the sixth season and the 2021 film The Waking Rock and the Strange Visitor as an optional extra after it. Most episodes are self-contained, but character relationships build across seasons. Kitsu's sequel links stop after Shi, so the later seasons are not in the list below.",
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
  },
  "nanatsu-no-taizai": {
    label: "The Seven Deadly Sins",
    intro: "TV seasons in order: The Seven Deadly Sins (2014–2015), Signs of Holy War (2016), Revival of the Commandments (2018), Imperial Wrath of the Gods (2019–2020) and Dragon's Judgement (2021). The film Prisoners of the Sky came out between the third and fourth seasons, and Cursed by Light followed the final season in July 2021. Grudge of Edinburgh (2022–2023) is a spin-off, and the sequel series Four Knights of the Apocalypse began in October 2023.",
    skip: ["nanatsu-no-taizai-ensa-no-edinburgh", "nanatsu-no-taizai-ensa-no-edinburgh-kouhen"],
    optional: ["Nanatsu-no-Taizai-Mokushiroku-no-Yonkishi", "Nanatsu-no-Taizai-Mokushiroku-no-Yonkishi-2nd-season"],
  },
  "ansatsu-kyoushitsu-tv": {
    label: "Assassination Classroom",
    intro: "Season 1 (22 episodes, 2015) and Season 2 (25 episodes, 2016) tell the whole story; watch them in order. The 2014 special Meeting Time is an optional extra. The films 365 Days' Time (2016) and Our Time (March 2026), which adds manga chapters the TV series left out, both belong after Season 2. Koro-sensei Q! (2016) is a separate spin-off.",
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
    intro: "These are two separate series by the same creator, Atsushi Ohkubo; Kitsu links them, so both appear below. Fire Force: Season 1 (2019), Season 2 (2020) and the final Season 3, which aired in two parts (April 2025 and January 2026). Soul Eater: one 51-episode series (April 2008–March 2009). The Late Night Show version is the same episodes with extra footage, and Soul Eater Not! (2014) is a spin-off.",
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
  },
  "saiki-kusuo-no-psi-nan-tv": {
    label: "The Disastrous Life of Saiki K.",
    intro: "Season 1 (2016), Season 2 (2018), the Final Arc special (December 28, 2018), then Reawakened, six episodes released on Netflix on December 30, 2019. Season 1 aired as 120 short daily episodes that were also put together into 24 half-hour episodes, so pick one version, not both. The 2013 web shorts are optional.",
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
  },
  "magi-the-kingdom-of-magic": {
    label: "Magi",
    intro: "Start with Magi: The Labyrinth of Magic (2012–2013), then The Kingdom of Magic (2013–2014). Magi: Adventure of Sinbad (TV, 2016) is a prequel spin-off about Sinbad's youth; it was made after the main series and is optional, so watch it afterwards. A five-episode Adventure of Sinbad OVA (2014–2015) also exists and is optional.",
    demote: ["magi-sinbad-no-bouken-tv"],
  },
  nichijou: {
    label: "Nichijou",
    intro: "Nichijou is one 26-episode series (April–September 2011). The Episode 0 OVA, released with manga volume 6 shortly before the TV series, is optional. There are no other seasons or films. It was released in English as Nichijou: My Ordinary Life.",
    demote: ["nichijou-episode-0"],
  },
  "high-school-dxd": {
    label: "High School DxD",
    intro: "Watch the four seasons in order: High School DxD (2012), New (2013), BorN (2015) and Hero (2018), each followed by the OVA episodes listed after it. The first season's two OVAs were released as episodes 13 and 14, after the TV run ended. The short specials that came with the Blu-ray volumes are optional extras.",
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
    intro: "Kakegurui (12 episodes, July–September 2017), then Kakegurui×× (12 episodes, January–March 2019). Kakegurui Twin (Netflix, August 2022) is a spin-off centred on Mary Saotome; it is optional and can be watched after the two seasons.",
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
    intro: "Danganronpa: The Animation (13 episodes, 2013) adapts the first game. Then watch Danganronpa 3: Future Arc and Despair Arc, which aired in parallel, alternating episodes, from July to September 2016, and finish with Hope Arc (September 29, 2016), the single-episode ending to both. Despair Arc is set in the past, during the characters' school days. Danganronpa 3 is an original story written for the anime as a sequel to the games.",
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
    intro: "Arise is a reboot with its own continuity, separate from Stand Alone Complex and the 1995 film. Watch either the four OVA Borders (June 2013–September 2014) or Alternative Architecture (TV, April–June 2015), which re-edits them as a TV series and adds two new episodes, Pyrophoric Cult. Then watch Ghost in the Shell: The New Movie (June 2015), which follows on from Arise.",
  },
  "ghost-in-the-shell-stand-alone-complex": {
    label: "Ghost in the Shell: Stand Alone Complex",
    intro: "Watch Stand Alone Complex (26 episodes, 2002–2003), 2nd GIG (26 episodes, 2004–2005) and the TV film Solid State Society (2006), then SAC_2045 Season 1 (Netflix, April 2020) and Season 2 (May 2022). The Laughing Man and Individual Eleven are compilation films of the first two seasons, and Sustainable War and The Last Human recut SAC_2045; skip all four if you watch the series. The Tachikomatic Days shorts are optional.",
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
    intro: "Watch Higurashi (26 episodes, April–September 2006), Kai (24 episodes, July–December 2007) and the Rei OVA (2009), then Gou (24 episodes, October 2020–March 2021) and its sequel Sotsu (July–September 2021). Gou was first promoted as a remake, but it continues from the earlier anime, so do not start with it. Kira (2011), Outbreak (2013) and the Nekogoroshi-hen special are optional extras.",
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
  },
  given: {
    label: "Given",
    intro: "Watch the TV series (July–September 2019), then Given the Movie (August 2020), which continues it directly, then the two-part film project Hiiragi Mix (January 2024) and To the Sea (September 2024). The OVAs from December 2021 and October 2025 were bundled with manga volumes and are optional, as are the Hiiragi Mix specials.",
  },
  "yu-yu-hakusho": {
    label: "Yu Yu Hakusho",
    intro: "Yu Yu Hakusho is one 112-episode TV series (October 1992–January 1995), so start there. The films The Golden Seal (July 1993) and Poltergeist Report (April 1994) have original stories and are optional. Two Shots / All or Nothing (October 2018) adapts a bonus chapter about how Hiei and Kurama met and a chapter from the end of the manga; watch it after the series. The Eizou Hakusho videos and the 2009 picture drama are short extras.",
  },
  "youkoso-jitsuryoku-shijou-shugi-no-kyoushitsu-e-tv": {
    label: "Classroom of the Elite",
    intro: "Watch the four seasons in order: Classroom of the Elite (July–September 2017), II (July–September 2022), III (January–March 2024) and the 4th Season (16 episodes, April–June 2026), subtitled Second Year, First Semester, which starts the second-year story. A fifth season was announced after the fourth season's final episode and has no release date yet.",
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
    intro: "Watch the 24-episode series (April–September 2012), then the film Accel World: Infinite Burst (July 2016). The two-episode EX OVA (September 2012 and January 2013) is a pair of side episodes, one about a thief in the school network and one about Haruyuki's diet. The Accel World specials are optional too.",
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
    intro: "Watch the 12-episode series (October–December 2014), then the films Eternity Library & Alchemic Girl (February 2017) and Heavens Library & Crimson Lord (March 2019). The OVA (March 2015) is a side episode that fits after the series. The second film is not linked on Kitsu, so it is missing from the list below.",
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
    intro: "Watch the 12-episode series (April–June 2016), then the film The Battle of Unato (May 2019), which is set six months after the series. The two compilation films (December 2016 and January 2017) recap the first and second halves of the series and can be skipped. The Ran and Mumei Ranman specials and the Sakaseyasakase music video are optional extras.",
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
    intro: "Watch Is This a Zombie? (12 episodes, January–March 2011) and its OVA episodes, then Is This a Zombie? of the Dead (10 episodes, April–June 2012) and its OVA from October 2012. The OVAs were released with light novel and manga volumes as extra episodes.",
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
    intro: "Watch the TV series (January 1996–September 1998), then the OVA Trust & Betrayal (1999), a prequel about Kenshin's past made after the series, then the OVA Reflection (2001–2002), set after the series. The 1997 film is optional. New Kyoto Arc (2011–2012) retells the Kyoto arc and can be skipped. The 2023 series and its second season, Kyoto Disturbance (2024–2025), are a separate new adaptation.",
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
    intro: "Watch Eureka Seven (50 episodes, April 2005–April 2006), then the sequel Eureka Seven AO (24 episodes, 2012), whose last two episodes aired together in November 2012, and its OVA. The 2009 film and the Hi-Evolution trilogy (2017–2021) are alternative versions of the original series and are listed under safe to skip. The AO Aratanari Fukaki Ao shorts are optional.",
  },
  "himouto-umaru-chan": {
    label: "Himouto! Umaru-chan",
    intro: "Watch Himouto! Umaru-chan (12 episodes, July–September 2015), then Umaru-chan R (October–December 2017), the second season. The two OVAs were bundled with manga volumes 7 (October 2015) and 10 (April 2017) and are extra episodes. The Umaru-chanS shorts (2015–2016) are optional too.",
  },
  "to-love-ru": {
    label: "To Love Ru",
    intro: "Watch To Love Ru (26 episodes, April–September 2008), Motto To Love Ru (12 episodes, October–December 2010), To Love Ru Darkness (12 episodes, October–December 2012) and Darkness 2nd (July–October 2015). The OVA episodes, most of them bundled with manga volumes, are extra stories. The 2017 OVA came with To Love Ru Chronicles, a book for the franchise's 10th anniversary.",
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
    intro: "Watch The Fruit of Grisaia (13 episodes, October–December 2014), the TV film The Labyrinth of Grisaia (April 12, 2015), then The Eden of Grisaia (10 episodes, April–June 2015). The shorts released with the disc volumes are optional. Grisaia: Phantom Trigger (films from 2019 and a TV series from January 2025) is based on a separate game series.",
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
};
