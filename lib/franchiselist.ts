import franchiseData from "@/data/franchises.json";

export type FranchisePick = { s: string; t: string; n: number };

/** Franchises with more than one part (data/franchises.json), most followed first. */
export const bingeFranchises = (): FranchisePick[] =>
  (franchiseData as { franchises: FranchisePick[] }).franchises.filter((f) => f.n > 1).map(({ s, t, n }) => ({ s, t, n }));
