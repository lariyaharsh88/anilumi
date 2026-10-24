/** Tier lists live entirely in the URL: ?s=S.1,2;A.3;B.;C.;D.;F.&title=... Pure. */
export const TIERS = ["S", "A", "B", "C", "D", "F"] as const;
export type Tier = (typeof TIERS)[number];
export type TierState = Record<Tier, string[]>;

export const emptyTiers = (): TierState => ({ S: [], A: [], B: [], C: [], D: [], F: [] });

export function encodeTiers(t: TierState): string {
  return TIERS.filter((k) => t[k].length).map((k) => `${k}.${t[k].join(",")}`).join(";");
}

export function decodeTiers(s: string | null | undefined, max = 60): TierState {
  const out = emptyTiers();
  let n = 0;
  for (const part of (s || "").split(";")) {
    const [k, ids] = part.split(".");
    if (!TIERS.includes(k as Tier)) continue;
    for (const id of (ids || "").split(",")) if (/^\d{1,7}$/.test(id) && n < max && !Object.values(out).some((l) => l.includes(id))) { out[k as Tier].push(id); n++; }
  }
  return out;
}
