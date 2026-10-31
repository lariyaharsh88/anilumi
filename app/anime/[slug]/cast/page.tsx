import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { getAnimeBySlug, getCharacters, animePath, posterUrl } from "@/lib/kitsu";
import { getCast, getKeyStaff, vaPath, sameName } from "@/lib/anilist";
import { characterPathFor } from "@/lib/charsnap";
import KeyStaff from "@/components/KeyStaff";
import PageHero from "@/components/PageHero";
import CastGrid from "@/components/CastGrid";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

export const revalidate = 604800;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  // Kitsu's main cast (same request as the anime page, so usually cached) links characters the snapshot doesn't know.
  const [cast, staff, kitsuCast] = await Promise.all([getCast(a.id, 25, true), getKeyStaff(a.id), getCharacters(a.id, 12)]);
  const charLinks: Record<number, string> = {};
  for (const e of cast?.entries || []) {
    const k = characterPathFor(e.character.id) ?? kitsuCast.find((x) => sameName(x.name, e.character.name))?.slug;
    if (k) charLinks[e.character.id] = k.startsWith("/") ? k : `/character/${k}`;
  }
  return { a, cast, staff, charLinks };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { a, cast } = await load(slug);
  const mains = (cast?.entries || []).filter((e) => e.role === "MAIN" && e.jp).slice(0, 3);
  const dub = (cast?.entries || []).some((e) => e.en);
  // Names in the title answer "vinland saga cast" at a glance: who plays the leads.
  const lead = mains.slice(0, 2).map((e) => `${e.character.name} (${e.jp!.name})`).join(", ");
  return {
    title: lead ? `${a.title} Cast & Voice Actors: ${lead} & More` : `${a.title} Cast & Voice Actors (Japanese and English Dub)`,
    description: mains.length
      ? `${dub ? "Japanese and English dub" : "Japanese"} voice actors for the characters of ${a.title}: ${mains.map((e) => `${e.character.name} (${e.jp!.name}${e.en ? ` / ${e.en.name}` : ""})`).join(", ")} and the rest of the cast.`
      : `Characters and voice actors of ${a.title}.`,
    alternates: { canonical: `${animePath(a)}/cast` },
    ...(cast?.entries.length ? {} : { robots: { index: false } }),
  };
}

export default async function CastPage({ params }: Props) {
  const { slug } = await params;
  const { a, cast, staff, charLinks } = await load(slug);
  const entries = cast?.entries || [];
  const mains = entries.filter((e) => e.role === "MAIN");
  const hasDub = entries.some((e) => e.en);
  const jpCount = new Set(entries.map((e) => e.jp?.id).filter(Boolean)).size;
  const faq: FaqItem[] = [
    ...mains.filter((e) => e.jp).slice(0, 6).map((e) => ({
      q: `Who voices ${e.character.name} in ${a.title}?`,
      a: `${e.character.name} is voiced by ${e.jp!.name}${e.jp!.native ? ` (${e.jp!.native})` : ""} in Japanese${e.en ? ` and by ${e.en.name} in the English dub` : ""}.`,
    })),
    { q: `Does ${a.title} have an English dub?`, a: hasDub ? `Yes. The English dub cast includes ${entries.filter((e) => e.en).slice(0, 4).map((e) => `${e.en!.name} as ${e.character.name}`).join(", ")}.` : `No English dub cast is listed for ${a.title} yet.` },
  ];
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/cast`, label: "Cast" }]}
        eyebrow="🎙️ Cast & voice actors"
        title={<><span className="text-gradient">{a.title}</span> cast</>}
        subtitle={entries.length ? `Who voices who, in the original Japanese and the English dub.${entries.length >= 25 ? " Showing the 25 most important characters." : ""}` : "The voice cast for this title hasn't been listed yet."}
        facts={entries.length ? [
          { value: String(mains.length), label: "main characters" },
          { value: String(jpCount), label: "Japanese voice actors" },
          { value: hasDub ? "Yes" : "No", label: "English dub cast" },
        ] : undefined}
        hue={300}
        backdrop={a.cover?.large || null}
        posters={mains.length >= 2 ? mains.slice(0, 3).map((e) => e.character.image) : [posterUrl(a, "medium")]}
      />
      {entries.length > 0 && <section className="reveal mt-10"><CastGrid entries={entries} links={charLinks} /></section>}
      {staff.length > 0 && <section className="reveal mt-10"><h2 className="h-section mb-3">Key staff</h2><KeyStaff staff={staff} /></section>}
      <AdSlot slot="cast-mid" />
      <p className="mt-8 text-sm text-muted">
        <Link href={animePath(a)} className="text-violet hover:underline">{a.title} overview</Link> ·{" "}
        {mains[0]?.jp && <><Link href={vaPath(mains[0].jp)} className="text-violet hover:underline">More roles by {mains[0].jp.name}</Link> ·{" "}</>}
        <Link href="/voice-actors" className="text-violet hover:underline">Popular voice actors</Link>
      </p>
      {entries.length > 0 && <Faq items={faq} />}
      <p className="mt-6 text-xs text-muted">Cast data from AniList.</p>
    </div>
  );
}
