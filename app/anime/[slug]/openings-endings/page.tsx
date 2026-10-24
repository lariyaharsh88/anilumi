import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnimeBySlug, animePath, posterUrl } from "@/lib/kitsu";
import { getThemes, themeLabel } from "@/lib/themes";
import PageHero from "@/components/PageHero";
import ThemeList from "@/components/ThemeList";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  return { a, t: await getThemes(a.id) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { a, t } = await load(slug);
  const ops = t?.themes.filter((x) => x.type === "OP") || [];
  const eds = t?.themes.filter((x) => x.type === "ED") || [];
  return {
    title: `${a.title} Openings & Endings – All ${ops.length + eds.length || ""} Theme Songs & Artists`.replace("All  ", "All "),
    description: t?.themes.length
      ? `Every ${a.title} opening and ending: ${t.themes.slice(0, 3).map((x) => `${x.type}${x.sequence} “${x.song}” by ${x.artists[0] || "unknown"}`).join(", ")}, with the episodes each one plays on.`
      : `Opening and ending songs for ${a.title}.`,
    alternates: { canonical: `${animePath(a)}/openings-endings` },
    robots: t?.themes.length ? undefined : { index: false },
  };
}

export default async function ThemesPage({ params }: Props) {
  const { slug } = await params;
  const { a, t } = await load(slug);
  const themes = t?.themes || [];
  const ops = themes.filter((x) => x.type === "OP");
  const eds = themes.filter((x) => x.type === "ED");
  const artists = new Set(themes.flatMap((x) => x.artists));
  const faq: FaqItem[] = themes.length ? [
    ...(ops[0] ? [{ q: `What is the ${a.title} opening song?`, a: `The first opening is “${ops[0].song}” by ${ops[0].artists.join(", ") || "an uncredited artist"}.${ops.length > 1 ? ` There are ${ops.length} openings in total; the latest is “${ops[ops.length - 1].song}”.` : ""}` }] : []),
    ...(eds[0] ? [{ q: `What is the ${a.title} ending song?`, a: `The first ending is “${eds[0].song}” by ${eds[0].artists.join(", ") || "an uncredited artist"}.${eds.length > 1 ? ` ${a.title} has ${eds.length} endings.` : ""}` }] : []),
    { q: `How many openings does ${a.title} have?`, a: `${a.title} has ${ops.length} opening${ops.length === 1 ? "" : "s"} and ${eds.length} ending${eds.length === 1 ? "" : "s"}.` },
    ...ops.slice(1, 4).map((x) => ({ q: `What is ${a.title} ${themeLabel(x).toLowerCase()}?`, a: `${themeLabel(x)} is “${x.song}” by ${x.artists.join(", ") || "an uncredited artist"}${x.entries[0]?.episodes ? `, used on episodes ${x.entries[0].episodes}` : ""}.` })),
  ] : [];
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/openings-endings`, label: "Openings & endings" }]}
        eyebrow="🎵 Theme songs"
        title={<><span className="text-gradient">{a.title}</span> openings &amp; endings</>}
        subtitle={themes.length ? `Every opening and ending, who sings it and which episodes it plays on. Tap through to listen.` : `No opening or ending songs are listed for ${a.title} yet.`}
        facts={themes.length ? [{ value: String(ops.length), label: ops.length === 1 ? "opening" : "openings" }, { value: String(eds.length), label: eds.length === 1 ? "ending" : "endings" }, { value: String(artists.size), label: artists.size === 1 ? "artist" : "artists" }] : undefined}
        hue={330}
        backdrop={a.cover?.large || null}
        posters={[posterUrl(a, "medium")]}
      />
      {ops.length > 0 && <section className="reveal mt-10"><h2 className="h-section mb-3">Openings</h2><ThemeList title={a.title} themes={ops} atSlug={t!.atSlug} /></section>}
      {eds.length > 0 && <section className="reveal mt-10"><h2 className="h-section mb-3">Endings</h2><ThemeList title={a.title} themes={eds} atSlug={t!.atSlug} /></section>}
      <AdSlot slot="themes-mid" />
      <p className="mt-8 text-sm text-muted">
        <Link href={animePath(a)} className="text-violet hover:underline">{a.title} overview</Link> ·{" "}
        <Link href={`${animePath(a)}/cast`} className="text-violet hover:underline">Voice cast</Link> ·{" "}
        <Link href="/anime-openings" className="text-violet hover:underline">Popular anime openings</Link>
      </p>
      <Faq items={faq} />
      <p className="mt-6 text-xs text-muted">Song data from <a href="https://animethemes.moe" rel="noopener" className="underline">AnimeThemes</a>.</p>
    </div>
  );
}
