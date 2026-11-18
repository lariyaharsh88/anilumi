/**
 * "Which ___ character are you?" quizzes (Google India, Nov 2026: "naruto quiz" 1K a month, "which naruto character
 * are you" 390, "which one piece character are you" 260, "which aot character are you" 170; Jujutsu Kaisen and Demon Slayer added for the series most watched in India). Eight personality
 * questions score six traits; the result is the character whose trait profile is closest (cosine similarity).
 * Character profiles are an editor's reading of each character, kept free of story spoilers. Pure.
 */
import chars from "@/data/characters.json";
import { snapImage, type SnapChar } from "./charsnap";
import type { Trait, QuizCharacter } from "./charquiz-core";
export { QUESTIONS, TRAITS, bestMatch, type QuizCharacter, type QuizQuestion, type Trait, type Weights } from "./charquiz-core";
/** `titled`: how the character snapshot names the show, when it isn't the franchise's English name. */
export type CharacterQuiz = { slug: string; franchise: string; anime: string; watchOrder: string; titled?: string; characters: QuizCharacter[] };

const p = (drive: number, calm: number, brains: number, heart: number, loner: number, fun: number): Record<Trait, number> => ({ drive, calm, brains, heart, loner, fun });

export const QUIZZES: CharacterQuiz[] = [
  {
    slug: "which-naruto-character-are-you", franchise: "Naruto", anime: "naruto", watchOrder: "naruto",
    characters: [
      { key: "naruto", name: "Naruto Uzumaki", why: "You never give up, wear your heart on your sleeve and turn rivals into friends.", profile: p(3, 0, 1, 3, 0, 3) },
      { key: "sasuke", name: "Sasuke Uchiha", why: "Focused on one goal, you keep people at a distance and let results speak.", profile: p(3, 2, 2, 0, 3, 0) },
      { key: "sakura", name: "Sakura Haruno", why: "Sharp, hard-working and tougher than people expect.", profile: p(2, 1, 3, 2, 0, 1) },
      { key: "kakashi", name: "Kakashi Hatake", why: "Laid-back on the surface, brilliant underneath, and quietly loyal.", profile: p(1, 3, 3, 2, 1, 1) },
      { key: "itachi", name: "Itachi Uchiha", why: "Quiet and far-sighted, you think ten steps ahead and carry burdens alone.", profile: p(1, 3, 3, 2, 3, 0) },
      { key: "shikamaru", name: "Shikamaru Nara", why: "You call everything a drag, then out-think everyone in the room.", profile: p(0, 3, 3, 1, 1, 1) },
      { key: "hinata", name: "Hinata Hyuuga", why: "Gentle and kind, with a quiet courage that shows when it matters.", profile: p(2, 2, 1, 3, 1, 0) },
      { key: "gaara", name: "Gaara", why: "A person of few words who protects others fiercely.", profile: p(1, 3, 1, 2, 3, 0) },
      { key: "jiraiya", name: "Jiraiya", why: "A goofy free spirit with real wisdom under the jokes.", profile: p(1, 1, 2, 2, 1, 3) },
      { key: "rock-lee", name: "Rock Lee", why: "Pure effort: you believe hard work beats talent, and you prove it.", profile: p(3, 0, 0, 2, 0, 2) },
      { key: "neji", name: "Neji Hyuuga", stored: "Neji Hyuuga", why: "Proud and disciplined, you set high standards for yourself.", profile: p(2, 3, 2, 1, 2, 0) },
      { key: "minato", name: "Minato Namikaze", why: "Calm, kind and lightning-quick when it counts.", profile: p(2, 3, 3, 3, 0, 1) },
    ],
  },
  {
    slug: "which-one-piece-character-are-you", franchise: "One Piece", anime: "one-piece", watchOrder: "one-piece",
    characters: [
      { key: "luffy", name: "Monkey D. Luffy", stored: "Luffy Monkey", why: "Fearless, carefree and loyal to the end: you live for freedom and your friends.", profile: p(3, 0, 0, 3, 0, 3) },
      { key: "zoro", name: "Roronoa Zoro", stored: "Zoro Roronoa", why: "Single-minded about getting stronger, steady in a crisis, terrible with directions.", profile: p(3, 3, 0, 1, 2, 0) },
      { key: "nami", name: "Nami", why: "Clever, practical and the one who actually knows where you're going.", profile: p(2, 1, 3, 2, 0, 1) },
      { key: "sanji", name: "Sanji", why: "Big-hearted and chivalrous, you show love by looking after everyone.", profile: p(2, 1, 1, 3, 0, 2) },
      { key: "usopp", name: "Usopp", why: "A storyteller and inventor whose courage grows every time it's tested.", profile: p(1, 0, 2, 2, 0, 3) },
      { key: "chopper", name: "Tony Tony Chopper", stored: "Chopper Tony Tony", why: "Kind and curious, you want to help everyone, especially when they're hurt.", profile: p(1, 0, 2, 3, 0, 2) },
      { key: "robin", name: "Nico Robin", stored: "Robin Nico", why: "Calm, well-read and a little mysterious, with a dry sense of humour.", profile: p(1, 3, 3, 1, 2, 1) },
      { key: "franky", name: "Franky", why: "Loud, creative and proud of what you build.", profile: p(2, 0, 2, 2, 0, 3) },
      { key: "brook", name: "Brook", why: "Cheerful and musical, you find a joke in everything.", profile: p(1, 1, 1, 2, 1, 3) },
      { key: "jinbe", name: "Jinbe", stored: "Jinbe", why: "Steady, honourable and wise: the one everyone trusts.", profile: p(2, 3, 2, 3, 0, 0) },
      { key: "law", name: "Trafalgar Law", stored: "Law Trafalgar", why: "Cool-headed and strategic, you prefer working on your own terms.", profile: p(2, 3, 3, 1, 3, 0) },
      { key: "shanks", name: "Shanks", why: "Relaxed and generous, with a calm strength people look up to.", profile: p(1, 3, 2, 2, 0, 2) },
    ],
  },
  {
    slug: "which-attack-on-titan-character-are-you", franchise: "Attack on Titan", anime: "attack-on-titan", watchOrder: "attack-on-titan",
    characters: [
      { key: "eren", name: "Eren Yeager", why: "Driven by a burning sense of purpose, you push forward no matter what.", profile: p(3, 0, 1, 1, 2, 0) },
      { key: "mikasa", name: "Mikasa Ackerman", why: "Calm, capable and fiercely protective of the people you care about.", profile: p(2, 3, 1, 3, 1, 0) },
      { key: "armin", name: "Armin Arlert", why: "Thoughtful and kind, you solve problems others think are impossible.", profile: p(1, 1, 3, 3, 0, 1) },
      { key: "levi", name: "Levi", why: "Blunt, disciplined and unmatched at what you do; you'd rather work alone.", profile: p(2, 3, 2, 1, 3, 0) },
      { key: "erwin", name: "Erwin Smith", why: "A visionary leader who makes the hard calls.", profile: p(3, 3, 3, 1, 1, 0) },
      { key: "hange", name: "Hange Zoë", stored: "Hange Zoe", why: "Endlessly curious and enthusiastic, you get excited about everything.", profile: p(2, 0, 3, 2, 0, 3) },
      { key: "jean", name: "Jean Kirstein", why: "Honest, practical and a natural leader once you find your footing.", profile: p(2, 1, 2, 2, 0, 1) },
      { key: "sasha", name: "Sasha Blouse", why: "Fun-loving and food-motivated, with real courage when it counts.", profile: p(1, 0, 0, 2, 0, 3) },
      { key: "reiner", name: "Reiner Braun", why: "Dependable and protective, the big brother of the group.", profile: p(2, 2, 1, 2, 1, 1) },
      { key: "annie", name: "Annie Leonhart", why: "Reserved and self-reliant, you keep your feelings close.", profile: p(1, 3, 2, 0, 3, 0) },
    ],
  },
  {
    slug: "which-jujutsu-kaisen-character-are-you", franchise: "Jujutsu Kaisen", anime: "jujutsu-kaisen", watchOrder: "jujutsu-kaisen",
    characters: [
      { key: "yuji", name: "Yuji Itadori", stored: "Yuuji Itadori", why: "Warm, brave and endlessly loyal: you throw yourself in to protect others.", profile: p(3, 1, 0, 3, 0, 2) },
      { key: "megumi", name: "Megumi Fushiguro", why: "Serious and clever, you pick who to save on your own terms.", profile: p(2, 3, 3, 1, 2, 0) },
      { key: "nobara", name: "Nobara Kugisaki", why: "Bold, confident and unapologetically yourself.", profile: p(3, 1, 1, 2, 0, 2) },
      { key: "gojo", name: "Satoru Gojo", stored: "Satoru Gojou", why: "Playful, cocky and the strongest in any room, with a teacher's heart.", profile: p(1, 2, 3, 2, 0, 3) },
      { key: "sukuna", name: "Ryomen Sukuna", stored: "Sukuna", why: "Arrogant and ruthless, you answer to no one.", profile: p(2, 3, 2, 0, 3, 1) },
      { key: "maki", name: "Maki Zenin", why: "Disciplined and determined to prove everyone wrong.", profile: p(3, 2, 1, 1, 2, 0) },
      { key: "inumaki", name: "Toge Inumaki", why: "Quiet but kind, you say a lot with very few words.", profile: p(1, 2, 1, 3, 1, 1) },
      { key: "panda", name: "Panda", why: "Easy-going and funny, the friend who keeps the group together.", profile: p(1, 1, 1, 3, 0, 3) },
      { key: "yuta", name: "Yuta Okkotsu", stored: "Yuuta Okkotsu", why: "Gentle and humble, with far more strength than you let on.", profile: p(2, 2, 1, 3, 1, 0) },
      { key: "nanami", name: "Kento Nanami", why: "Calm, principled and reliable; you clock out on time.", profile: p(1, 3, 2, 2, 1, 0) },
      { key: "todo", name: "Aoi Todo", stored: "Aoi Toudou", why: "Loud, intense and fiercely loyal to your best friends.", profile: p(3, 0, 1, 2, 0, 3) },
    ],
  },
  {
    slug: "which-demon-slayer-character-are-you", franchise: "Demon Slayer", anime: "kimetsu-no-yaiba", watchOrder: "kimetsu-no-yaiba", titled: "Kimetsu no Yaiba",
    characters: [
      { key: "tanjiro", name: "Tanjiro Kamado", stored: "Tanjirou Kamado", why: "Kind, hard-working and determined, you never give up on family.", profile: p(3, 1, 1, 3, 0, 1) },
      { key: "nezuko", name: "Nezuko Kamado", why: "Gentle and protective, you show love through actions, not words.", profile: p(1, 2, 0, 3, 1, 1) },
      { key: "zenitsu", name: "Zenitsu Agatsuma", why: "Anxious and dramatic, until it really counts.", profile: p(1, 0, 1, 2, 0, 3) },
      { key: "inosuke", name: "Inosuke Hashibira", why: "Wild, competitive and always charging in head first.", profile: p(3, 0, 0, 1, 2, 3) },
      { key: "rengoku", name: "Kyojuro Rengoku", stored: "Kyoujurou Rengoku", why: "Warm, passionate and inspiring: you set your heart ablaze.", profile: p(3, 1, 1, 3, 0, 2) },
      { key: "giyu", name: "Giyu Tomioka", stored: "Giyuu Tomioka", why: "Quiet and reserved, with a strong sense of duty.", profile: p(2, 3, 1, 1, 3, 0) },
      { key: "shinobu", name: "Shinobu Kocho", stored: "Shinobu Kochou", why: "Smiling and clever, with a sharp edge under the politeness.", profile: p(2, 3, 3, 1, 1, 1) },
      { key: "tengen", name: "Tengen Uzui", why: "Flashy, confident and loyal to the people you love.", profile: p(2, 1, 2, 2, 0, 3) },
      { key: "kanao", name: "Kanao Tsuyuri", why: "Quiet and observant, slowly learning to follow your own heart.", profile: p(1, 3, 2, 1, 2, 0) },
      { key: "muichiro", name: "Muichiro Tokito", stored: "Muichirou Tokitou", why: "Spacey and calm on the surface, a prodigy underneath.", profile: p(1, 3, 3, 0, 3, 0) },
      { key: "mitsuri", name: "Mitsuri Kanroji", why: "Sweet, affectionate and much stronger than people expect.", profile: p(1, 0, 0, 3, 0, 3) },
    ],
  },
];

export const quizBySlug = (slug: string) => QUIZZES.find((q) => q.slug === slug) ?? null;

/** Each character's page (or the anime's when it has none) and picture, from the character snapshot. */
export function characterCards(quiz: CharacterQuiz) {
  const all = (chars as unknown as { characters: SnapChar[] }).characters;
  return quiz.characters.map((c) => {
    const s = all.find((x) => x.n === (c.stored ?? c.name) && x.t.startsWith(quiz.titled ?? quiz.franchise.split(" ")[0]));
    return { ...c, href: s?.k ? `/character/${s.k}` : `/anime/${quiz.anime}`, image: s ? snapImage(s) : null };
  });
}
