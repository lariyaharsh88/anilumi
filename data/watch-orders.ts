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
export type WatchOrderOverride = { label?: string; intro: string; skip?: string[]; demote?: string[]; mainOrder?: string[]; /** Slugs to make core entries (fetched when Kitsu doesn't link them). */ promote?: string[]; /** Slugs to drop (unrelated crossovers). */ exclude?: string[]; /** ISO date a person checked the guide (shown as "Checked on"). */ checked?: string };

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
  },
  "re-zero-kara-hajimeru-isekai-seikatsu": {
    label: "Re:Zero",
    demote: ["re-zero-kara-hajimeru-isekai-seikatsu-hyouketsu-no-kizuna"],
    intro: "Season 1 (25 episodes), then Season 2 in two halves, then Season 3, then Season 4 (April–September 2026). The Director's Cut is Season 1 re-edited into double-length episodes, so pick one version. Of the OVAs, The Frozen Bond is a prequel and Memory Snow a light interlude set after episode 11; both are optional.",
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
    intro: "Watch the seasons in order: Date A Live (2013), Date A Live II (2014), the film Mayuri Judgment (August 2015), then III (January–March 2019), IV (April–June 2022) and V (April–June 2024). Each of the first two seasons has an OVA that fits after it. A theatrical film, Date A Live F: Last Date, is set for March 26, 2027. Date A Bullet is a spin-off. Seasons III to V are not linked on Kitsu, so they are missing from the list below.",
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
};
