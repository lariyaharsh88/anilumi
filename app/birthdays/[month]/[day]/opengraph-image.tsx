import { birthdaysOn, bdLabel, parseBdParams, zodiacOf } from "@/lib/birthdays";
import { sectionCard, OG_SIZE } from "@/lib/og";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }

export const alt = "Anime characters born on this day";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Share card for a birthday ("your anime birthday twins"): the date, its sign and the three most-loved characters. */
export default async function OG({ params }: { params: Promise<{ month: string; day: string }> }) {
  const { month, day } = await params;
  const md = parseBdParams(month, day);
  if (!md) return sectionCard({ kicker: "Anime birthdays", title: "Anime birthday twins", sub: "Which anime character shares your birthday?", posters: [] });
  const { characters } = birthdaysOn(md.m, md.d);
  const top = characters.slice(0, 3);
  const z = zodiacOf(md.m, md.d);
  return sectionCard({
    kicker: `Born on ${bdLabel(md.m, md.d)} · ${z.name}`,
    title: top.length ? `Anime birthday twins: ${top.map((c) => c.n).join(", ")}` : `Anime birthdays on ${bdLabel(md.m, md.d)}`,
    sub: characters.length > 3 ? `and ${characters.length - 3} more anime characters share this birthday` : "Which anime character shares your birthday?",
    posters: top.flatMap((c) => (c.i ? [c.i.replace("/medium/", "/large/")] : [])),
  });
}
