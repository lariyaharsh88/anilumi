import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { getAnimeBySlug, animePath, posterUrl } from "@/lib/kitsu";
import { continuationFor, continuationSlugs, startAt } from "@/lib/filler";
import { amazonSearch, affiliateRel } from "@/lib/affiliate";
import PageHero from "@/components/PageHero";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

export const revalidate = 604800;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  const cont = a && continuationFor(a.slug);
  if (!a || !cont) notFound();
  return { a, cont, start: startAt(cont) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { a, cont, start } = await load(slug);
  return {
    title: `Where Does the ${a.title} Anime End in the ${cont.medium === "manga" ? "Manga" : "Light Novel"}? Start at ${start.replace(/^./, (c) => c.toUpperCase())}`,
    description: `Finished ${a.title}? Pick up the ${cont.medium} from ${start}. ${cont.note || ""}`.trim().slice(0, 300),
    alternates: { canonical: `${animePath(a)}/manga` },
  };
}

export default async function MangaPage({ params }: Props) {
  const { slug } = await params;
  const { a, cont, start } = await load(slug);
  const medium = cont.medium;
  // Other seasons or films that continue the same book.
  const siblings = (await Promise.all(continuationSlugs().filter((s) => s !== a.slug && continuationFor(s)!.search === cont.search).map(getAnimeBySlug)))
    .filter((x) => x !== null);
  const draft = !cont.reviewed;

  const faq: FaqItem[] = [
    { q: `Where does the ${a.title} anime end in the ${medium}?`, a: `It covers the story up to just before ${start}, so start the ${medium} there.${cont.note ? ` ${cont.note}` : ""}` },
    { q: `What ${cont.chapter ? "chapter" : "volume"} should I read after ${a.title}?`, a: `Start at ${start}${cont.volume && cont.chapter ? ` (volume ${cont.volume})` : ""}.` },
    { q: `Should I read the ${medium} from the beginning instead?`, a: `If you have time, yes: adaptations trim inner monologue, side scenes and author notes. If you just want to know what happens next, ${start} is the place to start.` },
    { q: `Will ${a.title} get another season?`, a: `See the season 2 / next season tracker for ${a.title}: it shows any announced sequel, release date and the usual wait between seasons.` },
  ];

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/manga`, label: `Continue in the ${medium}` }]}
        eyebrow={<><span className="mr-2 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] tracking-normal text-ink normal-case">{draft ? "Draft · being verified" : "Reviewed"}</span>Anime → {medium}</>}
        title={`Where does the ${a.title} anime end in the ${medium}?`}
        subtitle={<>To keep going after the anime, start the {medium} at <strong className="text-ink">{start}</strong>.{cont.note ? ` ${cont.note}` : ""}</>}
        facts={[
          { value: start.replace(/^./, (c) => c.toUpperCase()), label: "start reading here" },
          { value: medium === "manga" ? "Manga" : "Light novel", label: "source" },
        ]}
        hue={262}
        backdrop={a.cover?.large || null}
        posters={[posterUrl(a, "medium")]}
      />

      <section className="card reveal mt-10 border-violet/40 bg-violet/10 p-5" aria-labelledby="start-h">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-2">Start reading</p>
        <h2 id="start-h" className="mt-1 text-2xl font-bold text-ink">{start.replace(/^./, (c) => c.toUpperCase())}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/90">That&apos;s the first {cont.chapter ? "chapter" : "volume"} the {a.title} anime hasn&apos;t adapted yet.{cont.note ? ` ${cont.note}` : ""}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href={amazonSearch(cont.search)} target="_blank" rel={affiliateRel} className="btn-outline">📚 Find the {medium}</a>
          <Link href={`${animePath(a)}/next-season`} className="chip">Next season status</Link>
          <Link href={`/watch-order/${a.slug}`} className="chip">Watch order</Link>
        </div>
        {draft && <p className="mt-4 text-xs text-muted">This continuation point is a draft and is still being checked against the {medium}. Flip back a chapter or two if something feels skipped.</p>}
      </section>

      {siblings.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="sib-h">
          <h2 id="sib-h" className="h-section mb-3">Other parts of the story</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {siblings.map((s) => (
              <li key={s.id}>
                <Link href={`${animePath(s)}/manga`} className="card flex items-center justify-between gap-3 p-3 transition hover:border-white/20">
                  <span className="font-semibold text-ink">{s.title}</span>
                  <span className="text-sm text-muted">→ {startAt(continuationFor(s.slug)!)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AdSlot slot="manga-mid" />

      <p className="mt-8 text-sm text-muted">
        <Link href={animePath(a)} className="text-violet hover:underline">{a.title} overview</Link> ·{" "}
        <Link href={`${animePath(a)}/next-season`} className="text-violet hover:underline">Next season</Link> ·{" "}
        <Link href="/anime-to-manga" className="text-violet hover:underline">All anime-to-manga guides</Link>
      </p>

      <Faq items={faq} />
    </div>
  );
}
