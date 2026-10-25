import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnimeBySlug, listAnime, animePath, posterUrl } from "@/lib/kitsu";
import { getAniListInsight, parentsGuide, type ParentsGuide } from "@/lib/insights";
import PageHero from "@/components/PageHero";
import ParentsGuideSection from "@/components/ParentsGuide";
import AnimeRail from "@/components/AnimeRail";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

const HUE: Record<string, number> = { "All ages": 140, "Teens (13+)": 40, "Older teens and adults (17+)": 20, "Adults only": 350 };
const LEVEL_WORD = { none: "No", mild: "Mild", moderate: "Moderate", strong: "Strong" } as const;

async function load(slug: string) {
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const insight = await getAniListInsight(a.id);
  const guide: ParentsGuide | null = insight ? parentsGuide(insight.tags, insight.genres, a.ageRating) : null;
  return { a, guide };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { a, guide } = await load(slug);
  const title = `Is ${a.title} Appropriate for Kids? Parents' Guide & Age Rating`;
  const description = guide
    ? `${a.title} is best for ${guide.suitable.toLowerCase()}${a.ageRating ? `, rated ${a.ageRating}` : ""}. Violence, language, sexual content and frightening themes, rated by viewers, with spoilers hidden.`
    : `Age rating and content notes for ${a.title}.`;
  return { title, description, alternates: { canonical: `${animePath(a)}/parents-guide` }, robots: guide ? undefined : { index: false } };
}

export default async function ParentsGuidePage({ params }: Props) {
  const { slug } = await params;
  const { a, guide } = await load(slug);
  const flagged = guide ? guide.areas.filter((x) => x.level === "strong" || x.level === "moderate") : [];
  const gentle = guide && guide.suitable !== "All ages";
  const genre = a.categories[0];
  const alternatives = gentle && genre
    ? (await listAnime({ sort: "-userCount", limit: 13, filter: { categories: genre.slug, ageRating: "G,PG" }, revalidate: 86400 })).items.filter((x) => x.id !== a.id).slice(0, 12)
    : [];

  const verdict = guide
    ? `Best for ${guide.suitable.toLowerCase()}.${flagged.length ? ` Viewers flag ${flagged.map((x) => x.label.toLowerCase()).join(", ")}.` : " Viewers don't flag any strong content."}`
    : `There aren't enough viewer content tags for ${a.title} yet${a.ageRating ? `; its official rating is ${a.ageRating}${a.ageRatingGuide ? ` (${a.ageRatingGuide})` : ""}` : ""}.`;

  const faq: FaqItem[] = guide
    ? [
        { q: `Is ${a.title} appropriate for kids?`, a: `${verdict}${a.ageRating ? ` Its official age rating is ${a.ageRating}${a.ageRatingGuide ? ` (${a.ageRatingGuide})` : ""}.` : ""}` },
        { q: `What age is ${a.title} for?`, a: `${guide.suitable}.${guide.madeForKids ? ` ${a.title} was made for children.` : ""} Preview an episode if you're unsure for your child.` },
        ...guide.areas.filter((x) => x.level !== "none").map((x) => ({
          q: `Does ${a.title} have ${x.label.toLowerCase()}?`,
          a: `${LEVEL_WORD[x.level]}.${x.shown.length ? ` Viewers tag it with ${x.shown.join(", ").toLowerCase()}.` : ""}${x.hiddenSpoilers ? ` ${x.hiddenSpoilers} more detail${x.hiddenSpoilers > 1 ? "s are" : " is"} hidden to avoid spoilers.` : ""}`,
        })),
      ]
    : [];

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/parents-guide`, label: "Parents' guide" }]}
        eyebrow="👪 Parents' guide"
        title={<>Is <span className="text-gradient">{a.title}</span> appropriate for kids?</>}
        subtitle={verdict}
        facts={[
          ...(guide ? [{ value: guide.suitable.replace("Older teens and adults (17+)", "17+").replace("Teens (13+)", "13+"), label: "best for" }] : []),
          ...(a.ageRating ? [{ value: a.ageRating, label: a.ageRatingGuide || "official rating" }] : []),
          ...(guide ? [{ value: String(flagged.length), label: flagged.length === 1 ? "area flagged" : "areas flagged" }] : []),
        ]}
        hue={guide ? HUE[guide.suitable] ?? 262 : 262}
        backdrop={a.cover?.large || null}
        posters={[posterUrl(a, "medium")]}
      />

      {guide && <div className="reveal"><ParentsGuideSection title={a.title} guide={guide} ageRating={a.ageRating} ageRatingGuide={a.ageRatingGuide} /></div>}

      <AdSlot slot="parents-mid" />

      {alternatives.length > 0 && <AnimeRail title={`Gentler ${genre!.title.toLowerCase()} anime (rated G or PG)`} items={alternatives} />}

      <p className="mt-8 text-sm text-muted">
        <Link href={animePath(a)} className="text-violet hover:underline">{a.title} overview</Link> ·{" "}
        <Link href={`${animePath(a)}/how-long-to-watch`} className="text-violet hover:underline">How long to watch</Link> ·{" "}
        <Link href="/parents-guide" className="text-violet hover:underline">Best anime for kids</Link>
      </p>

      <Faq items={faq} />
    </div>
  );
}
