/**
 * The data behind /season/[year]/[season]/india (app/season/[year]/[season]/india/page.tsx): each show of a researched
 * season with its announced India streaming (data/season-india.json), where its earlier seasons stream in India
 * (data/where-to-watch.json) and its Hindi, Tamil and Telugu dubs, plus whether the guide is substantial enough to
 * index. Shared with the sitemap so both make the same call.
 */
import type { Season } from "@/lib/kitsu";
import { getSeasonPreview, type PreviewItem } from "@/lib/preview";
import { streamsFor, servicesIn, audioLine } from "@/lib/streams";
import { dubFor, dubHref } from "@/lib/hindidub";
import { regionalFor } from "@/lib/regionaldub";
import { seasonIndia, announcedIn, indiaFacts, sourceUrl, INDIA_GUIDE_MIN, type IndiaShow } from "@/lib/seasonindia";

export type Row = {
  i: PreviewItem;
  /** The English title people search: the research's, else Kitsu's English title, else AniList's. */
  title: string;
  x: IndiaShow | undefined;
  announced: ReturnType<typeof announcedIn>;
  earlier: { service: string; audio: string }[];
  earlierSource: string | null;
  hindi: { platform: string; href: string } | null;
  regional: { lang: "Tamil" | "Telugu"; platform: string }[];
};

export async function indiaGuide(y: number, s: Season) {
  const research = seasonIndia(y, s);
  if (!research) return null;
  const items = (await getSeasonPreview(y, s)).filter((i) => i.format !== "Movie" || i.popularity >= 3000);
  const rows: Row[] = items.map((i) => {
    const x = research.byId.get(i.id);
    // Earlier seasons only for sequels: the franchise entry of a new show would describe something else.
    const base = i.kind === "sequel" ? (i.prequelAnime ?? i.anime) : null;
    const st = base ? streamsFor(base) : null;
    const earlier = st ? servicesIn(st, "IN").filter((v) => v.kind !== "buy").map((v) => ({ service: v.service, audio: audioLine(v) })) : [];
    const d = base ? dubFor(base) : null;
    const regional = base ? (["ta", "te"] as const).flatMap((l) => { const r = regionalFor(base, l); return r?.platforms[0] ? [{ lang: l === "ta" ? "Tamil" as const : "Telugu" as const, platform: r.platforms[0].name }] : []; }) : [];
    return {
      i, x, title: x?.title || i.anime?.titleEn || i.title || i.anime?.title || "", announced: announcedIn(x), earlier,
      earlierSource: x?.previousSeasonIndia?.sources.map(sourceUrl).find(Boolean) ?? null,
      hindi: d?.status === "available" && d.platforms[0] ? { platform: d.platforms[0].name, href: dubHref(d) } : null,
      regional,
    };
  });
  const withFacts = rows.filter((r) => indiaFacts(r.x, { stream: r.earlier.length > 0, dub: Boolean(r.hindi) || r.regional.length > 0 }));
  return { research, rows, withFacts, indexed: withFacts.length >= INDIA_GUIDE_MIN };
}

