/**
 * Japanese name generator data (Google India, Nov 2026: "japanese name generator" 720 a month, +42%; "anime name
 * generator" 260): common real surnames and given names with their usual kanji and what those kanji mean, plus a
 * rule-based writer for any name in katakana, the script Japanese uses for foreign names. Pure.
 */
export type JpName = { kanji: string; romaji: string; meaning: string };
export type Gender = "boy" | "girl" | "any";

/** Among the most common Japanese surnames. */
export const SURNAMES: JpName[] = [
  { kanji: "佐藤", romaji: "Satō", meaning: "help + wisteria" }, { kanji: "鈴木", romaji: "Suzuki", meaning: "bell + tree" },
  { kanji: "高橋", romaji: "Takahashi", meaning: "high bridge" }, { kanji: "田中", romaji: "Tanaka", meaning: "in the rice field" },
  { kanji: "渡辺", romaji: "Watanabe", meaning: "ferry crossing + area" }, { kanji: "山本", romaji: "Yamamoto", meaning: "base of the mountain" },
  { kanji: "中村", romaji: "Nakamura", meaning: "middle village" }, { kanji: "小林", romaji: "Kobayashi", meaning: "small forest" },
  { kanji: "吉田", romaji: "Yoshida", meaning: "lucky rice field" }, { kanji: "山田", romaji: "Yamada", meaning: "mountain rice field" },
  { kanji: "山口", romaji: "Yamaguchi", meaning: "mountain entrance" }, { kanji: "松本", romaji: "Matsumoto", meaning: "base of the pine tree" },
  { kanji: "井上", romaji: "Inoue", meaning: "above the well" }, { kanji: "木村", romaji: "Kimura", meaning: "tree village" },
  { kanji: "林", romaji: "Hayashi", meaning: "forest" }, { kanji: "清水", romaji: "Shimizu", meaning: "pure water" },
  { kanji: "森", romaji: "Mori", meaning: "woods" }, { kanji: "池田", romaji: "Ikeda", meaning: "pond + rice field" },
  { kanji: "橋本", romaji: "Hashimoto", meaning: "base of the bridge" }, { kanji: "石川", romaji: "Ishikawa", meaning: "stone river" },
  { kanji: "前田", romaji: "Maeda", meaning: "front rice field" }, { kanji: "藤田", romaji: "Fujita", meaning: "wisteria rice field" },
  { kanji: "岡田", romaji: "Okada", meaning: "hill rice field" }, { kanji: "長谷川", romaji: "Hasegawa", meaning: "long valley river" },
  { kanji: "村上", romaji: "Murakami", meaning: "above the village" }, { kanji: "坂本", romaji: "Sakamoto", meaning: "base of the slope" },
  { kanji: "青木", romaji: "Aoki", meaning: "green tree" }, { kanji: "西村", romaji: "Nishimura", meaning: "west village" },
  { kanji: "福田", romaji: "Fukuda", meaning: "fortune rice field" }, { kanji: "三浦", romaji: "Miura", meaning: "three bays" },
  { kanji: "藤原", romaji: "Fujiwara", meaning: "wisteria plain" }, { kanji: "岡本", romaji: "Okamoto", meaning: "base of the hill" },
  { kanji: "中島", romaji: "Nakajima", meaning: "middle island" }, { kanji: "小川", romaji: "Ogawa", meaning: "small river" },
  { kanji: "竹内", romaji: "Takeuchi", meaning: "among the bamboo" }, { kanji: "金子", romaji: "Kaneko", meaning: "gold + child" },
  { kanji: "中山", romaji: "Nakayama", meaning: "middle mountain" }, { kanji: "石井", romaji: "Ishii", meaning: "stone well" },
  { kanji: "上田", romaji: "Ueda", meaning: "upper rice field" }, { kanji: "宮崎", romaji: "Miyazaki", meaning: "shrine + cape" },
  { kanji: "桜井", romaji: "Sakurai", meaning: "cherry blossom well" }, { kanji: "星野", romaji: "Hoshino", meaning: "star field" },
  { kanji: "白石", romaji: "Shiraishi", meaning: "white stone" }, { kanji: "黒田", romaji: "Kuroda", meaning: "black rice field" },
];

/** Popular and classic given names, each with a common kanji spelling (the same name can be written many ways). */
export const GIVEN: (JpName & { g: Exclude<Gender, "any"> | "both" })[] = [
  { g: "boy", kanji: "陽翔", romaji: "Haruto", meaning: "sun + soar" }, { g: "boy", kanji: "蓮", romaji: "Ren", meaning: "lotus" },
  { g: "boy", kanji: "湊", romaji: "Minato", meaning: "harbour" }, { g: "boy", kanji: "大和", romaji: "Yamato", meaning: "great harmony" },
  { g: "boy", kanji: "樹", romaji: "Itsuki", meaning: "tree" }, { g: "boy", kanji: "颯", romaji: "Hayate", meaning: "sound of the wind" },
  { g: "boy", kanji: "大翔", romaji: "Hiroto", meaning: "great + soar" }, { g: "boy", kanji: "陸", romaji: "Riku", meaning: "land" },
  { g: "boy", kanji: "翔", romaji: "Shō", meaning: "soar" }, { g: "boy", kanji: "健太", romaji: "Kenta", meaning: "healthy + big" },
  { g: "boy", kanji: "拓海", romaji: "Takumi", meaning: "open up + sea" }, { g: "boy", kanji: "海斗", romaji: "Kaito", meaning: "sea + the Big Dipper" },
  { g: "boy", kanji: "隼人", romaji: "Hayato", meaning: "falcon + person" }, { g: "boy", kanji: "一郎", romaji: "Ichirō", meaning: "first son" },
  { g: "boy", kanji: "誠", romaji: "Makoto", meaning: "sincerity" }, { g: "boy", kanji: "龍", romaji: "Ryū", meaning: "dragon" },
  { g: "boy", kanji: "新", romaji: "Arata", meaning: "new" }, { g: "boy", kanji: "武", romaji: "Takeshi", meaning: "warrior" },
  { g: "boy", kanji: "剛", romaji: "Tsuyoshi", meaning: "strong" }, { g: "boy", kanji: "直樹", romaji: "Naoki", meaning: "honest + tree" },
  { g: "boy", kanji: "奏太", romaji: "Sōta", meaning: "play music + big" }, { g: "boy", kanji: "雄大", romaji: "Yūdai", meaning: "heroic + great" },
  { g: "girl", kanji: "陽葵", romaji: "Himari", meaning: "sun + hollyhock" }, { g: "girl", kanji: "凛", romaji: "Rin", meaning: "dignified" },
  { g: "girl", kanji: "芽依", romaji: "Mei", meaning: "bud + rely on" }, { g: "girl", kanji: "紬", romaji: "Tsumugi", meaning: "pongee silk" },
  { g: "girl", kanji: "結衣", romaji: "Yui", meaning: "tie + garment" }, { g: "girl", kanji: "澪", romaji: "Mio", meaning: "waterway" },
  { g: "girl", kanji: "咲", romaji: "Saki", meaning: "blossom" }, { g: "girl", kanji: "桜", romaji: "Sakura", meaning: "cherry blossom" },
  { g: "girl", kanji: "美咲", romaji: "Misaki", meaning: "beautiful + blossom" }, { g: "girl", kanji: "花", romaji: "Hana", meaning: "flower" },
  { g: "girl", kanji: "愛", romaji: "Ai", meaning: "love" }, { g: "girl", kanji: "美月", romaji: "Mizuki", meaning: "beautiful + moon" },
  { g: "girl", kanji: "楓", romaji: "Kaede", meaning: "maple" }, { g: "girl", kanji: "雪", romaji: "Yuki", meaning: "snow" },
  { g: "girl", kanji: "千尋", romaji: "Chihiro", meaning: "a thousand fathoms" }, { g: "girl", kanji: "彩", romaji: "Aya", meaning: "colour" },
  { g: "girl", kanji: "舞", romaji: "Mai", meaning: "dance" }, { g: "girl", kanji: "七海", romaji: "Nanami", meaning: "seven seas" },
  { g: "girl", kanji: "琴音", romaji: "Kotone", meaning: "sound of the koto" }, { g: "girl", kanji: "静香", romaji: "Shizuka", meaning: "quiet + fragrance" },
  { g: "girl", kanji: "明日香", romaji: "Asuka", meaning: "tomorrow + fragrance" }, { g: "girl", kanji: "詩", romaji: "Uta", meaning: "poem" },
  { g: "both", kanji: "葵", romaji: "Aoi", meaning: "hollyhock" }, { g: "both", kanji: "光", romaji: "Hikaru", meaning: "light" },
  { g: "both", kanji: "遥", romaji: "Haruka", meaning: "distant" }, { g: "both", kanji: "晶", romaji: "Akira", meaning: "crystal, clear" },
  { g: "both", kanji: "翼", romaji: "Tsubasa", meaning: "wings" }, { g: "both", kanji: "薫", romaji: "Kaoru", meaning: "fragrance" },
  { g: "both", kanji: "渚", romaji: "Nagisa", meaning: "shore" }, { g: "both", kanji: "真琴", romaji: "Makoto", meaning: "true + koto (harp)" },
];

export const givenFor = (g: Gender) => GIVEN.filter((n) => g === "any" || n.g === g || n.g === "both");

/** A full name, surname first as in Japan. `rand` is injectable for tests. */
export function makeName(g: Gender, rand: () => number = Math.random): { surname: JpName; given: JpName } {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  return { surname: pick(SURNAMES), given: pick(givenFor(g)) };
}

// Katakana for a name written in the Latin alphabet: syllables of consonant + vowel, as Japanese loanwords are spelt.
const K: Record<string, string> = {
  a: "ア", i: "イ", u: "ウ", e: "エ", o: "オ",
  ka: "カ", ki: "キ", ku: "ク", ke: "ケ", ko: "コ", ga: "ガ", gi: "ギ", gu: "グ", ge: "ゲ", go: "ゴ",
  sa: "サ", si: "シ", shi: "シ", su: "ス", se: "セ", so: "ソ", za: "ザ", zi: "ジ", ji: "ジ", zu: "ズ", ze: "ゼ", zo: "ゾ",
  ta: "タ", ti: "ティ", tu: "トゥ", te: "テ", to: "ト", da: "ダ", di: "ディ", du: "ドゥ", de: "デ", do: "ド",
  na: "ナ", ni: "ニ", nu: "ヌ", ne: "ネ", no: "ノ", ha: "ハ", hi: "ヒ", hu: "フ", he: "ヘ", ho: "ホ",
  ba: "バ", bi: "ビ", bu: "ブ", be: "ベ", bo: "ボ", pa: "パ", pi: "ピ", pu: "プ", pe: "ペ", po: "ポ",
  ma: "マ", mi: "ミ", mu: "ム", me: "メ", mo: "モ", ya: "ヤ", yu: "ユ", ye: "イェ", yo: "ヨ",
  ra: "ラ", ri: "リ", ru: "ル", re: "レ", ro: "ロ", wa: "ワ", wi: "ウィ", we: "ウェ", wo: "ウォ",
  fa: "ファ", fi: "フィ", fu: "フ", fe: "フェ", fo: "フォ", va: "ヴァ", vi: "ヴィ", vu: "ヴ", ve: "ヴェ", vo: "ヴォ",
  sha: "シャ", shu: "シュ", she: "シェ", sho: "ショ", cha: "チャ", chi: "チ", chu: "チュ", che: "チェ", cho: "チョ",
  ja: "ジャ", ju: "ジュ", je: "ジェ", jo: "ジョ", tha: "タ", thi: "ティ", thu: "トゥ", the: "テ", tho: "ト",
  bha: "バ", bhi: "ビ", bhu: "ブ", dha: "ダ", dhi: "ディ", kha: "カ", khi: "キ", gha: "ガ", ghi: "ギ", pha: "パ", phi: "ピ",
};
/** A consonant with no vowel after it: the loanword habit is u (o after t and d). */
const LONE: Record<string, string> = { k: "ク", g: "グ", s: "ス", sh: "シュ", ch: "チ", j: "ジ", z: "ズ", t: "ト", d: "ド", th: "ト", n: "ン", h: "フ", b: "ブ", p: "プ", m: "ム", r: "ル", l: "ル", f: "フ", v: "ヴ", w: "ウ", y: "イ", x: "クス", c: "ク", q: "ク", bh: "ブ", dh: "ド", kh: "ク", gh: "グ", ph: "プ" };

/** Any name in katakana, approximately (spelling, not sound, so "Harsh" → ハルシュ). Pure. */
export function toKatakana(name: string): string {
  return name.trim().toLowerCase().split(/\s+/).filter(Boolean).map((word) => {
    const w = word.normalize("NFKD").replace(/[^a-z]/g, "").replace(/([aeiou])h(?![aeiou])/g, "$1").replace(/l/g, "r").replace(/c(?=[eiy])/g, "s").replace(/c/g, "k").replace(/q/g, "k").replace(/x/g, "ks").replace(/ee/g, "ī").replace(/oo/g, "ū").replace(/aa/g, "ā");
    let out = "", i = 0;
    while (i < w.length) {
      const ch = w[i];
      if ("īūā".includes(ch)) { out += ({ ī: "イー", ū: "ウー", ā: "アー" } as Record<string, string>)[ch]; i++; continue; }
      let hit = "";
      for (const len of [3, 2, 1]) { const s = w.slice(i, i + len); if (K[s]) { hit = s; break; } }
      if (hit) { out += K[hit]; i += hit.length; continue; }
      // n before a consonant, or a doubled consonant (small tsu), else a lone consonant.
      if (ch === "n") { out += "ン"; i++; continue; }
      if (w[i + 1] === ch && !"aeiou".includes(ch)) { out += "ッ"; i++; continue; }
      const two = w.slice(i, i + 2);
      if (LONE[two]) { out += LONE[two]; i += 2; continue; }
      out += LONE[ch] ?? ""; i++;
    }
    return out;
  }).join("・");
}
