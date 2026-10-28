/**
 * Anime quote of the day from Animechan (free, ~5 anonymous requests an hour), fetched once a day and
 * cached, so every visitor sees the same quote. The anime is linked to AniLumi when the alias index knows it.
 */
import { aliasLookup } from "./aliases";

export type Quote = { text: string; character: string; anime: string; slug: string | null };

type Raw = { status?: string; data?: { content?: string; anime?: { name?: string; altName?: string }; character?: { name?: string } } };

/** Validate and shape an Animechan response; drop very long quotes. Pure. */
export function toQuote(d: Raw, link: (name: string) => string | null = () => null): Quote | null {
  const text = d.data?.content?.trim();
  const anime = d.data?.anime?.name?.trim();
  const character = d.data?.character?.name?.trim();
  if (d.status !== "success" || !text || !anime || !character || text.length > 320) return null;
  return { text, anime, character, slug: link(anime) ?? (d.data?.anime?.altName ? link(d.data.anime.altName) : null) };
}

const exactSlug = (name: string) => {
  const h = aliasLookup(name, 1)[0];
  return h && h.kind !== "fuzzy" ? h.slug : null;
};

export async function getQuoteOfDay(): Promise<Quote | null> {
  try {
    const res = await fetch("https://api.animechan.io/v1/quotes/random", { headers: { Accept: "application/json" }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return toQuote((await res.json()) as Raw, exactSlug);
  } catch {
    return null;
  }
}
