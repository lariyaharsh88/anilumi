/** Paths pre-built at deploy time (kept out of page.tsx: pages may only export what Next allows). */
export function generateStaticParamsList() {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2, y - 3, y - 4].map((year) => ({ year: String(year) }));
}
