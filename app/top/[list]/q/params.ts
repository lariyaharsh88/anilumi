import { LISTS } from "./lists";

/** Paths pre-built at deploy time (kept out of page.tsx: pages may only export what Next allows). */
export function generateStaticParamsList() {
  return Object.keys(LISTS).map((list) => ({ list }));
}
