/**
 * Family trees for character pages: the researched family (data/character-family.json, with spoiler flags) or,
 * failing that, the relatives in the character notes. Each relative is placed in a generation from how they're
 * related ("paternal grandfather" two up, "younger half-brother" level, "son" one down) and linked to their page
 * when they have one. Pure given the data.
 */
import data from "@/data/character-family.json";
import { characterNote } from "./charnotes";
import { snapByPage, snapFor, snapImage, characterPathFor, type SnapChar } from "./charsnap";

export type FamilyMember = { name: string; slug: string | null; relation: string; spoiler: boolean; note?: string };
export type FamilyNode = FamilyMember & { gen: number; href: string | null; image: string | null };
const D = data as unknown as { checked: string | null; characters: Record<string, { members: FamilyMember[]; sources: string[] }> };
export const FAMILY_CHECKED = D.checked;

/** Generations relative to the character: -2 grandparents, -1 parents/uncles, 0 siblings/spouse/cousins, +1 children. */
export function generationOf(relation: string): number {
  const r = relation.toLowerCase();
  if (/great[- ]?grand(father|mother|parent)|ancestor/.test(r)) return -3;
  if (/great[- ]?grand(son|daughter|child)|descendant/.test(r)) return 3;
  if (/grand(father|mother|parent)|great[- ]?(uncle|aunt)/.test(r)) return -2;
  if (/grand(son|daughter|child)|great[- ]?(nephew|niece)/.test(r)) return 2;
  if (/genetic source/.test(r)) return -1;
  if (/\b(son|daughter|child|children|nephew|niece|ward)\b/.test(r)) return 1;
  if (/\b(father|mother|parent|dad|mom|uncle|aunt|guardian|godfather|godmother)\b/.test(r)) return -1;
  return 0;
}
/** Order within a generation: parents before uncles, spouses next to the character, siblings, then cousins. */
const rank = (r: string) => (/\b(father|mother|parent|husband|wife|spouse|partner|fianc)/i.test(r) ? 0 : /\b(brother|sister|sibling|twin|son|daughter)\b/i.test(r) ? 1 : 2);

export function familyOf(slug: string): { nodes: FamilyNode[]; sources: string[] } | null {
  const own = D.characters[slug];
  const note = characterNote(slug);
  const members: FamilyMember[] = own?.members ?? (note?.relatives ?? []).map((r) => ({ name: r.name, slug: null, relation: r.relation, spoiler: false }));
  if (!members.length) return null;
  const me = snapByPage(slug);
  const nodes = members.map((m): FamilyNode => {
    const snap: SnapChar | null = (m.slug ? snapByPage(m.slug) : null) ?? (me ? snapFor(m.name, [me.s]) : null);
    return { ...m, gen: generationOf(m.relation), href: m.slug ? `/character/${m.slug}` : snap ? characterPathFor(snap.id) : null, image: snap ? snapImage(snap) : null };
  });
  nodes.sort((a, b) => a.gen - b.gen || rank(a.relation) - rank(b.relation));
  return { nodes, sources: own?.sources ?? [] };
}
