import { getCharacterBySlug } from "@/lib/kitsu";
import { snapByPage, snapImage } from "@/lib/charsnap";
import { heightCm, zodiac } from "@/lib/charfacts";
import { bdLabel } from "@/lib/birthdays";
import { posterCard, OG_SIZE } from "@/lib/og";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }

export const alt = "Anime character profile";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Share card: name, series, age, height, birthday and voice. Popular characters come from the snapshot (no API call). */
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeURIComponent((await params).slug);
  const s = snapByPage(slug);
  const k = s ? null : await getCharacterBySlug(slug).catch(() => null);
  const cm = s ? heightCm(s.l.find(([l]) => l.toLowerCase() === "height")?.[1]) : null;
  const facts = s
    ? [
        s.age && `Age ${s.age.replace(/-$/, "+")}`,
        cm && `${cm} cm`,
        s.m && s.d && `Born ${bdLabel(s.m, s.d)} (${zodiac(s.m, s.d)})`,
        s.jp && `Voiced by ${s.jp.n}`,
      ].filter(Boolean).join(" · ")
    : "Age, height, birthday and voice actors";
  return posterCard({
    poster: s ? snapImage(s, "large") : k?.image ?? null,
    kicker: s ? `Character · ${s.t}` : "Anime character",
    title: s?.n || k?.name || "Character",
    sub: facts,
    badge: s?.f ? `♥ ${s.f.toLocaleString("en-US")}` : null,
  });
}
