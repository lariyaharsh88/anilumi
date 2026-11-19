/**
 * Character names as fans write them where AniList's "full name" reverses the order: One Piece names come out
 * surname-last ("Luffy Monkey", "Robin Nico", "Chopper Tony Tony"), which reads wrong as a quiz answer or a guess.
 * Keyed by AniList character id. Used by the trivia hub and the guessing game; pages that build URLs from names keep
 * the stored name. Pure.
 */
const FAN_NAME: Record<number, string> = {
  40: "Monkey D. Luffy", 62: "Roronoa Zoro", 61: "Nico Robin", 13767: "Trafalgar Law", 2072: "Portgas D. Ace",
  309: "Tony Tony Chopper", 16342: "Boa Hancock", 2754: "Donquixote Doflamingo", 2751: "Edward Newgate",
  120536: "Donquixote Rosinante", 124077: "Charlotte Katakuri",
};
export const fanName = (c: { id: number; n: string }) => FAN_NAME[c.id] ?? c.n;
