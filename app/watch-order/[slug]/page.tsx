import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAnimeBySlug, buildWatchOrder, animePath, posterUrl, fmtMinutes, runtimeMinutes, subtypeLabel, WatchEntry } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import { amazonSearch, affiliateRel } from "@/lib/affiliate";
import BarChart from "@/components/viz/BarChart";
import LineChart from "@/components/viz/LineChart";

export const revalidate = 86400;
type Props = { params: Promise<{ slug: string }> };

const KIND_LABEL: Record<WatchEntry["kind"], string> = { main: "Main", movie: "Movie", side: "Side story", recap: "Recap", spinoff: "Spin-off", alt: "Alt. version" };
const KIND_CLASS: Record<WatchEntry["kind"], string> = { main: "bg-accent-strong text-white", movie: "bg-violet-strong text-white", side: "bg-bg-2 text-ink", recap: "bg-line text-muted line-through", spinoff: "bg-bg-2 text-ink", alt: "bg-line text-muted" };

/** Drop the shared franchise prefix so sibling entries stay distinguishable in narrow labels. */
function shortTitle(title: string, franchise: string) {
  if (title === franchise || !title.toLowerCase().startsWith(franchise.toLowerCase())) return title;
  const rest = title.slice(franchise.length).replace(/^[\s:：\-–—]+/, "").trim();
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : title;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const year = new Date().getFullYear();
  return {
    title: `${a.title} Watch Order (${year}) – Complete Guide + Total Time`,
    description: `How to watch ${a.title} in order: every season, movie, OVA and spin-off, which recaps to skip, and how long the whole franchise takes to binge.`,
    alternates: { canonical: `/watch-order/${a.slug}` },
  };
}

export default async function WatchOrderPage({ params }: Props) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const wo = await buildWatchOrder(a);
  const required = wo.entries.filter((e) => !e.optional || e.kind === "movie");
  const skippable = wo.entries.filter((e) => e.kind === "recap" || e.kind === "alt");
  const ordered = wo.entries.filter((e) => e.kind !== "recap" && e.kind !== "alt").map((e, i) => ({ ...e, step: i + 1 }));
  const name = wo.root.title;

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${name} watch order`,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: ordered.length,
    itemListElement: ordered.map((e) => ({ "@type": "ListItem", position: e.step, name: e.anime.title, url: abs(animePath(e.anime)) })),
  };

  return (
    <div className="container-x py-8">
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `/watch-order/${a.slug}`, label: "Watch order" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{name} watch order</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {wo.entries.length === 1
          ? `${name} is a standalone title with no sequels, prequels or spin-offs on record. Just start with it.`
          : `${wo.mainCount} core ${wo.mainCount === 1 ? "entry" : "entries"}, ${wo.entries.length - wo.mainCount} ${wo.entries.length - wo.mainCount === 1 ? "extra" : "extras"}. Watching only the core story and movies takes about ${fmtMinutes(wo.totalMinutes)}. Generated from the franchise graph, so it updates when new seasons are announced.`}
      </p>

      {wo.intro && (
        <div className="card mt-5 border-violet/40 bg-violet/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet">How to watch</p>
          <p className="mt-1 text-sm leading-6 text-ink/90">{wo.intro}</p>
        </div>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-3"><p className="text-xl font-extrabold text-accent-2">{wo.mainCount}</p><p className="text-xs text-muted">core entries</p></div>
        <div className="card p-3"><p className="text-xl font-extrabold">{required.length - wo.mainCount}</p><p className="text-xs text-muted">movies to include</p></div>
        <div className="card p-3"><p className="text-xl font-extrabold">{skippable.length}</p><p className="text-xs text-muted">recaps / alt versions to skip</p></div>
        <div className="card p-3"><p className="text-xl font-extrabold">{fmtMinutes(wo.totalMinutes)}</p><p className="text-xs text-muted">total core runtime</p></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={amazonSearch(`${name} manga`)} target="_blank" rel={affiliateRel} className="btn-outline">📚 Read the manga</a>
        <a href={amazonSearch(`${name} blu-ray`)} target="_blank" rel={affiliateRel} className="btn-outline">💿 Blu-ray box sets</a>
      </div>
      <AdSlot slot="watch-order-top" />

      {(() => {
        const timed = ordered.filter((e) => (e.kind === "main" || e.kind === "movie") && runtimeMinutes(e.anime) > 0);
        if (timed.length < 2) return null;
        const longest = timed.reduce((x, y) => (runtimeMinutes(y.anime) > runtimeMinutes(x.anime) ? y : x));
        return (
          <div className="mt-8">
            <BarChart
              orientation="bar"
              title="Where the hours go"
              subtitle={`Core story and movies in watch order · ${fmtMinutes(wo.totalMinutes)} in total · longest: ${longest.anime.title}`}
              valueHeading="Runtime"
              data={timed.map((e) => ({ key: e.anime.id, label: shortTitle(e.anime.title, name), value: runtimeMinutes(e.anime), display: fmtMinutes(runtimeMinutes(e.anime)), href: animePath(e.anime) }))}
            />
          </div>
        );
      })()}

      {(() => {
        const rated = ordered.filter((e) => e.kind === "main" && e.anime.rating);
        if (rated.length < 3) return null;
        const score = (e: (typeof rated)[number]) => (e.anime.rating || 0) / 10;
        const best = rated.reduce((p, q) => (score(q) > score(p) ? q : p));
        const first = rated[0], last = rated[rated.length - 1];
        const delta = score(last) - score(first);
        const trend = Math.abs(delta) < 0.15 ? "held steady" : delta > 0 ? `rose ${delta.toFixed(2)}` : `fell ${Math.abs(delta).toFixed(2)}`;
        return (
          <div className="mt-8">
            <LineChart
              title="Score across seasons"
              subtitle={`Peaked with ${shortTitle(best.anime.title, name)} at ${score(best).toFixed(2)} · from first to latest, the score ${trend}`}
              valueHeading="Score / 10"
              labelKeys={[...new Set([first.anime.id, best.anime.id, last.anime.id])]}
              points={rated.map((e) => ({ key: e.anime.id, label: shortTitle(e.anime.title, name), fullLabel: e.anime.title, value: score(e), display: score(e).toFixed(2), href: animePath(e.anime) }))}
            />
          </div>
        );
      })()}

      <section className="mt-8">
        <h2 className="h-section mb-3">Recommended order</h2>
        <ol className="space-y-2">
          {ordered.map((e) => (
            <li key={e.anime.id} className={`card flex gap-3 p-3 ${e.optional ? "opacity-90" : ""} ${e.attachedTo ? "ml-4 sm:ml-8" : ""}`}>
              <span className="w-8 shrink-0 pt-1 text-center text-lg font-extrabold text-muted">{e.step}</span>
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-bg-2">
                {posterUrl(e.anime, "small") && <Image src={posterUrl(e.anime, "small")!} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${KIND_CLASS[e.kind]}`}>{KIND_LABEL[e.kind]}</span>
                  {e.optional && e.kind !== "movie" && <span className="text-[10px] font-semibold uppercase text-muted">optional</span>}
                </div>
                <Link href={animePath(e.anime)} className="mt-1 block font-semibold hover:text-violet">{e.anime.title}</Link>
                <p className="text-xs text-muted">{subtypeLabel(e.anime.subtype)}{e.anime.startDate ? ` · ${e.anime.startDate.slice(0, 4)}` : ""}{e.anime.episodeCount ? ` · ${e.anime.episodeCount} ep` : ""}{runtimeMinutes(e.anime) ? ` · ${fmtMinutes(runtimeMinutes(e.anime))}` : ""}</p>
                <p className="mt-1 text-xs text-ink/70">{e.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {skippable.length > 0 && (
        <section className="mt-10">
          <h2 className="h-section mb-1">Safe to skip</h2>
          <p className="mb-3 text-sm text-muted">Recap compilations and alternative cuts that retell episodes you will already have seen.</p>
          <ul className="flex flex-wrap gap-2">
            {skippable.map((e) => (
              <li key={e.anime.id}><Link href={animePath(e.anime)} className="chip">{e.anime.title}</Link></li>
            ))}
          </ul>
        </section>
      )}

      {wo.entries.length > 1 && (
        <section className="mt-10">
          <h2 className="h-section mb-3">Release order</h2>
          <ol className="card divide-y divide-line">
            {wo.releaseOrder.map((x, i) => (
              <li key={x.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="w-6 text-right font-bold text-muted">{i + 1}</span>
                <Link href={animePath(x)} className="flex-1 font-medium hover:text-violet">{x.title}</Link>
                <span className="text-xs text-muted">{x.startDate?.slice(0, 7) || "TBA"}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Faq
        title={`${name} watch order FAQ`}
        items={[
          { q: `What order should I watch ${name} in?`, a: wo.intro ? wo.intro : wo.entries.length === 1 ? `${name} has a single entry, so there is nothing to sequence.` : `Follow the recommended order above: ${wo.entries.filter((e) => e.kind === "main").map((e) => e.anime.title).join(" → ")}. Movies and side stories are slotted after the season they relate to.` },
          { q: `How long does it take to watch all of ${name}?`, a: wo.totalMinutes ? `The core story and movies run about ${fmtMinutes(wo.totalMinutes)}. At two hours a day that is roughly ${Math.ceil(wo.totalMinutes / 120)} days.` : "Runtime data is incomplete for this franchise." },
          { q: `Can I skip the recaps?`, a: skippable.length ? `Yes. ${skippable.map((e) => e.anime.title).join(", ")} retell events you have already seen and can be skipped.` : "There are no recap episodes or compilation movies on record for this franchise." },
          { q: "Where does this order come from?", a: "It is built automatically from the sequel, prequel, side-story and spin-off links in the Kitsu database and refreshed daily, so new seasons appear without manual edits." },
        ]}
      />
    </div>
  );
}
