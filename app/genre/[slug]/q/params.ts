import { getCategories } from "@/lib/kitsu";

/** Paths pre-built at deploy time (kept out of page.tsx: pages may only export what Next allows). */
export async function generateStaticParamsList() {
  try {
    return (await getCategories(30)).map((g) => ({ slug: g.slug }));
  } catch {
    return [];
  }
}
