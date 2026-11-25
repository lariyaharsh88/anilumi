import { fitTitle, fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { getAnimeBySlug, animePath, posterUrl } from "@/lib/kitsu";
import { continuationFor, continuationSlugs, startAt, mediumLabel } from "@/lib/filler";
import AmazonLink from "@/components/AmazonLink";
import AffiliateNote from "@/components/AffiliateNote";
import PageHero from "@/components/PageHero";
import { pageAbout, reviewedBy } from "@/lib/ld";
import CheckedBy from "@/components/CheckedBy";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import LeadForm from "@/components/LeadForm";
import { dbEnabled } from "@/lib/db";

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
    // The English name when it's short (what people search), and the longest title that fits a result.
    title: (() => {
      const t = cont.name ?? (a.titleEn && a.titleEn.length <= 40 ? a.titleEn : a.title), m = mediumLabel(cont.medium).replace(/ n/, " N"), s = start.replace(/^./, (c) => c.toUpperCase());
      return fitTitle([`Where Does the ${t} Anime End in the ${m}? Start at ${s}`, `Where Does ${t} End in the ${m}? ${s}`, `${t}: Continue the ${m} From ${s}`, `${t} ${m}: Start at ${s}`, `Where Does ${t} End in the ${m}?`]);
    })(),
    description: fitDescription(`Finished ${cont.name ?? a.title}? Pick up the ${cont.medium} from ${start}. ${cont.note ? `${cont.note} ` : ""}Where the anime stops in the ${cont.medium}, which ${cont.medium === "manga" ? "volume" : "book"} to buy first and where to get it.`.trim().slice(0, 300)),
    alternates: { canonical: `${animePath(a)}/manga` },
  };
}

export default async function MangaPage({ params }: Props) {
  const { slug } = await params;
  const { a, cont, start } = await load(slug);
  const medium = cont.medium;
  const name = cont.name ?? a.title;
  // Other seasons or films that continue the same book.
  const siblings = (await Promise.all(continuationSlugs().filter((s) => s !== a.slug && continuationFor(s)!.search === cont.search).map(getAnimeBySlug)))
    .filter((x) => x !== null);
  const draft = !cont.reviewed;

  const faq: FaqItem[] = [
    { q: `Where does the ${name} anime end in the ${medium}?`, a: `It covers the story up to just before ${start}, so start the ${medium} there.${cont.note ? ` ${cont.note}` : ""}` },
    { q: `What ${cont.chapter ? "chapter" : "volume"} should I read after ${name}?`, a: `Start at ${start}${cont.volume && cont.chapter ? ` (volume ${cont.volume})` : ""}.` },
    { q: `Should I read the ${medium} from the beginning instead?`, a: `If you have time, yes: adaptations trim inner monologue, side scenes and author notes. If you just want to know what happens next, ${start} is the place to start.` },
    ...(cont.faq ?? []),
    ...(cont.faq?.some((f) => /season 3|another season|next season/i.test(f.q)) ? [] : [{ q: `Will ${name} get another season?`, a: `See the season 2 / next season tracker for ${name}: it shows any announced sequel, release date and the usual wait between seasons.` }]),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={{ ...pageAbout(a, `${animePath(a)}/manga`, `Where the ${a.title} anime ends in the ${cont.medium}`), ...reviewedBy(cont.reviewedOn) }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/manga`, label: `Continue in the ${medium}` }]}
        eyebrow={<><span className="mr-2 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] tracking-normal text-ink normal-case">{draft ? "Draft · being verified" : "Reviewed"}</span>Anime → {medium}</>}
        title={`Where does the ${name} anime end in the ${medium}?`}
        subtitle={<>To keep going after the anime, start the {medium} at <strong className="text-ink">{start}</strong>.{cont.note ? ` ${cont.note}` : ""}</>}
        facts={[
          { value: start.replace(/^./, (c) => c.toUpperCase()), label: "start reading here" },
          { value: mediumLabel(medium), label: "source" },
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
          <AmazonLink query={cont.search} source="manga-page" className="btn-outline">📚 Find the {medium}</AmazonLink>
          <Link href={`${animePath(a)}/next-season`} className="chip">Next season status</Link>
          <Link href={`/watch-order/${a.slug}`} className="chip">Watch order</Link>
        </div>
        <AffiliateNote className="mt-3" />
        {cont.reviewedOn && <CheckedBy date={cont.reviewedOn} className="mt-4" />}
        {draft && <p className="mt-4 text-xs text-muted">This continuation point is a draft and is still being checked against the {medium}. Flip back a chapter or two if something feels skipped.</p>}
      </section>

      {cont.read && cont.read.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="read-h">
          <h2 id="read-h" className="h-section mb-1">Where to read {name} legally</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">Official English editions only{cont.checked ? `, checked ${new Date(`${cont.checked}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}` : ""}. Scan and reupload sites don&apos;t pay the creators and aren&apos;t listed.</p>
          <ul className="grid gap-3 md:grid-cols-3">
            {cont.read.map((r) => (
              <li key={r.service} className="card p-4 text-sm">
                <a href={r.url} target="_blank" rel="noopener nofollow" className="font-semibold text-ink hover:text-violet-2 hover:underline">{r.service} ↗</a>
                <p className="mt-1 leading-6 text-ink/85">{r.how}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {dbEnabled() && <LeadForm className="mt-10" kind="guide" source="manga-guide" animeId={a.id} animeTitle={a.title} title={`📬 Tell me when ${a.title} gets its next season`} blurb="One email when a sequel is announced or dated, with where it picks up in the story." button="Notify me" />}

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
