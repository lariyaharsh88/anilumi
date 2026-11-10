import type { Metadata } from "next";
import EditorWatched from "@/components/EditorWatched";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { getAnimeBySlug, getLastAiredBest, animePath, episodePath, posterUrl } from "@/lib/kitsu";
import { fillerFor, fillerSource, formatRanges, kindRuns, type EpisodeKind, type FillerInfo } from "@/lib/filler";
import PageHero from "@/components/PageHero";
import { pageAbout, reviewedBy } from "@/lib/ld";
import CheckedBy from "@/components/CheckedBy";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import LeadForm from "@/components/LeadForm";
import { dbEnabled } from "@/lib/db";
import { fitTitle } from "@/lib/titles";
import { arcsFor, arcOf, arcRange, type Arc } from "@/lib/arcs";

export const revalidate = 604800;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

// Canon reads as the calm default; the colours that matter (skip, mixed) stand out against it.
const KIND: Record<EpisodeKind, { label: string; color: string; verdict: string }> = {
  canon: { label: "Manga canon", color: "#8b7cf6", verdict: "Watch" },
  "anime-canon": { label: "Anime canon", color: "#22d3ee", verdict: "Watch" },
  mixed: { label: "Mixed canon/filler", color: "#fab219", verdict: "Watch" },
  filler: { label: "Filler", color: "#f43f5e", verdict: "Skip" },
  recap: { label: "Recap", color: "#64748b", verdict: "Skip" },
};
const ORDER: EpisodeKind[] = ["canon", "anime-canon", "mixed", "filler", "recap"];
const span = (from: number, to: number) => (from === to ? `Episode ${from}` : `Episodes ${from}–${to}`);
const hours = (min: number) => (min >= 120 ? `${Math.round(min / 60)} hours` : `${Math.round(min)} minutes`);

async function load(slug: string) {
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a || a.subtype === "movie") notFound();
  const airing = a.status === "current";
  const aired = airing ? (await getLastAiredBest(a.id)).lastAired : 0;
  const f = fillerFor(a.slug, airing ? aired || null : a.episodeCount);
  if (!f) notFound();
  const skip = f.count + f.recap.size;
  // The name people search ("Naruto Shippuden", "Bleach"), not Kitsu's canonical romaji ("Naruto: Shippuuden", "BLEACH").
  const name = f.entry.name ?? a.titleEn ?? a.title;
  return { a, f, skip, airing, name, saved: a.episodeLength ? skip * a.episodeLength : 0 };
}

/** Per arc: how many of its episodes are filler, mixed or canon, and what to do with it. Pure. */
function arcRows(f: FillerInfo, arcs: Arc[]) {
  return arcs.filter((x) => x.from <= f.total).map((x) => {
    const to = Math.min(x.to ?? f.total, f.total);
    let filler = 0, recap = 0, mixed = 0;
    const skips: number[] = [];
    for (let n = x.from; n <= to; n++) {
      if (f.filler.has(n)) { filler++; skips.push(n); } else if (f.recap.has(n)) { recap++; skips.push(n); } else if (f.mixed.has(n)) mixed++;
    }
    const len = to - x.from + 1;
    // "Skip the arc" only when every episode in it is filler or recap; a filler arc with a mixed episode lists what to skip.
    const verdict = filler + recap === len ? "skip" : filler + recap ? "partial" : "watch";
    return { arc: x, to, len, filler, recap, mixed, skips, verdict } as const;
  });
}

function counts(f: FillerInfo) {
  const c: Record<EpisodeKind, number> = { canon: 0, "anime-canon": 0, mixed: 0, filler: 0, recap: 0 };
  for (const r of kindRuns(f)) c[r.kind] += r.to - r.from + 1;
  return c;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { a, f, skip, saved, name } = await load(slug);
  return {
    title: fitTitle([`${name} Filler List (${new Date().getFullYear()}): ${skip} Episodes to Skip`, `${name} Filler List: ${skip} Episodes to Skip`, `${name} Filler List (${new Date().getFullYear()})`, `${name} Filler List`]),
    description: `${name} has ${f.count} filler episodes out of ${f.total} (${f.share.toFixed(0)}%)${f.recap.size ? ` plus ${f.recap.size} recaps` : ""}. Full list of filler, mixed and canon episodes${saved ? `; skipping saves about ${hours(saved)}` : ""}.`,
    alternates: { canonical: `${animePath(a)}/filler-list` },
  };
}

export default async function FillerListPage({ params }: Props) {
  const { slug } = await params;
  const { a, f, airing, saved, name } = await load(slug);
  const arcs = arcsFor(a.slug);
  const byArc = arcs ? arcRows(f, arcs) : [];
  const skipArcs = byArc.filter((r) => r.verdict === "skip");
  const c = counts(f);
  const runs = kindRuns(f);
  const src = fillerSource(f.entry);
  const watch = Array.from({ length: f.total }, (_, i) => i + 1).filter((n) => !f.filler.has(n) && !f.recap.has(n));
  const longest = runs.filter((r) => r.kind === "filler" || r.kind === "recap").sort((x, y) => y.to - y.from - (x.to - x.from))[0];

  const faq: FaqItem[] = [
    { q: `How many filler episodes does ${name} have?`, a: `${f.count} of its ${f.total} episodes${airing ? " aired so far" : ""} are filler (${f.share.toFixed(0)}%)${f.recap.size ? `, and ${f.recap.size} more are recaps` : ""}. ${f.mixed.size ? `Another ${f.mixed.size} mix adapted story with new material, so they're worth watching.` : ""}`.trim() },
    { q: `Which ${name} episodes can I skip?`, a: `Filler: ${formatRanges(f.filler) || "none"}.${f.recap.size ? ` Recaps: ${formatRanges(f.recap)}.` : ""}` },
    ...(longest && longest.to > longest.from ? [{ q: `What is the longest filler run in ${name}?`, a: `${span(longest.from, longest.to)}: ${longest.to - longest.from + 1} episodes in a row. The story picks up again in episode ${longest.to + 1 <= f.total ? longest.to + 1 : longest.to}.` }] : []),
    ...(saved ? [{ q: `How much time does skipping ${name} filler save?`, a: `About ${hours(saved)}, at ${a.episodeLength} minutes an episode.` }] : []),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={{ ...pageAbout(a, `${animePath(a)}/filler-list`, `${name} filler list`), ...reviewedBy(f.entry.reviewedOn) }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/filler-list`, label: "Filler list" }]}
        eyebrow={<><span className="mr-2 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] tracking-normal text-ink normal-case">{src.label}</span>Filler guide</>}
        title={`${name} filler list`}
        subtitle={<>{f.count} of {f.total} episodes{airing ? " so far" : ""} are filler{f.recap.size ? ` and ${f.recap.size} are recaps` : ""}. {saved ? <>Skip them and you save about <strong className="text-ink">{hours(saved)}</strong>.</> : null}</>}
        facts={[
          { value: String(f.count), label: "filler episodes" },
          { value: `${f.share.toFixed(0)}%`, label: "of the series is filler" },
          ...(f.mixed.size ? [{ value: String(f.mixed.size), label: "mixed (watch)" }] : []),
          ...(saved ? [{ value: hours(saved), label: "saved by skipping" }] : []),
        ]}
        hue={350}
        backdrop={a.cover?.large || null}
        posters={[posterUrl(a, "medium")]}
      />
      <EditorWatched anime={a} className="mt-4" />

      <section className="card reveal mt-8 border-[#f43f5e]/40 bg-[#f43f5e]/[.05] p-4" aria-labelledby="quick-h">
        <h2 id="quick-h" className="font-semibold text-ink">Short answer: which {name} episodes to skip</h2>
        <p className="mt-2 text-sm leading-6 text-ink/90"><strong className="text-ink">Filler ({f.count}):</strong> {formatRanges(f.filler) || "none"}.</p>
        {f.recap.size > 0 && <p className="mt-1 text-sm leading-6 text-ink/90"><strong className="text-ink">Recaps ({f.recap.size}):</strong> {formatRanges(f.recap)}.</p>}
        {skipArcs.length > 0 && <p className="mt-1 text-sm leading-6 text-ink/90"><strong className="text-ink">Whole arcs you can skip:</strong> {skipArcs.map((r) => `${r.arc.name} (${arcRange({ ...r.arc, to: r.to })})`).join(", ")}.</p>}
        {longest && longest.to > longest.from && <p className="mt-1 text-sm text-muted">Longest filler stretch: {span(longest.from, longest.to)} ({longest.to - longest.from + 1} in a row); the story resumes at episode {longest.to + 1}.</p>}
        {f.mixed.size > 0 && <p className="mt-1 text-sm text-muted">Mixed episodes ({f.mixed.size}) contain story you need, so watch them.</p>}
        {f.animeCanon.size >= 10 && <p className="mt-1 text-sm leading-6 text-ink/90"><strong className="text-ink">Anime-only story ({f.animeCanon.size}):</strong> {formatRanges(f.animeCanon)}. Not in the manga but not filler either: later episodes build on it. Manga readers who only want the adapted story can skip these too.</p>}
      </section>

      {byArc.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="arcs-h">
          <h2 id="arcs-h" className="h-section mb-1">{name} filler by arc</h2>
          <p className="mb-4 text-sm text-muted">Each story arc with how much of it is filler. Arc names and ranges follow the episode numbering used on this page.</p>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="px-3 py-2">Arc</th><th className="px-3 py-2">Episodes</th><th className="px-3 py-2">Filler</th><th className="px-3 py-2">Verdict</th></tr></thead>
              <tbody className="divide-y divide-line">
                {byArc.map((r) => (
                  <tr key={r.arc.name + r.arc.from}>
                    <td className="px-3 py-2 font-medium text-ink">{r.arc.name}{r.arc.filler && <span className="ml-2 text-xs text-[#fb7185]">filler arc</span>}</td>
                    <td className="px-3 py-2 tabular-nums text-ink/85">{arcRange({ ...r.arc, to: r.to })}{r.arc.to === null ? " (airing)" : ""}</td>
                    <td className="px-3 py-2 tabular-nums text-ink/85">{r.filler + r.recap ? `${r.filler + r.recap} of ${r.len}` : "None"}</td>
                    <td className="px-3 py-2">{r.verdict === "skip" ? <span className="rounded bg-[#f43f5e]/15 px-2 py-0.5 text-xs font-semibold text-[#fb7185]">Skip the arc</span> : r.verdict === "partial" ? <span className="text-xs text-ink/85">Watch, skip {formatRanges(r.skips)}</span> : <span className="rounded bg-white/5 px-2 py-0.5 text-xs font-semibold text-ink/80">Watch</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="reveal mt-10" aria-labelledby="map-h">
        <h2 id="map-h" className="h-section mb-1">Episode map</h2>
        <p className="mb-4 text-sm text-muted">Each square is one episode, in order. Hover a square for its number.</p>
        <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Legend">
          {ORDER.filter((k) => c[k] > 0).map((k) => (
            <li key={k} className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: KIND[k].color }} />
              <span className="text-ink/90">{KIND[k].label}</span>
              <span className="text-muted">{c[k]}</span>
            </li>
          ))}
        </ul>
        <div className="card p-3">
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${f.total > 400 ? 10 : 16}px, 1fr))` }} role="img" aria-label={`${f.total} episodes: ${ORDER.filter((k) => c[k]).map((k) => `${c[k]} ${KIND[k].label.toLowerCase()}`).join(", ")}`}>
            {runs.flatMap((r) => Array.from({ length: r.to - r.from + 1 }, (_, i) => (
              <span key={r.from + i} title={`Episode ${r.from + i}: ${KIND[r.kind].label}`} className="aspect-square rounded-[2px]" style={{ background: KIND[r.kind].color, opacity: r.kind === "canon" ? 0.55 : 1 }} />
            )))}
          </div>
        </div>
      </section>

      <AdSlot slot="filler-mid" />

      <section className="reveal mt-10" aria-labelledby="runs-h">
        <h2 id="runs-h" className="h-section mb-1">Every episode, in order</h2>
        <p className="mb-4 text-sm text-muted">Watch the canon and mixed stretches; the red ones are safe to skip.</p>
        <ol className="card divide-y divide-line">
          {runs.map((r) => (
            <li key={r.from}>
              <Link href={episodePath(a, r.from)} className="flex items-center gap-3 px-3 py-2 text-sm transition hover:bg-white/[.03]">
                <span aria-hidden className="h-5 w-1.5 shrink-0 rounded-full" style={{ background: KIND[r.kind].color }} />
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-ink">{span(r.from, r.to)}</span>
                  <span className="ml-2 text-muted">{KIND[r.kind].label}{r.to > r.from ? ` · ${r.to - r.from + 1} episodes` : ""}{arcOf(arcs, r.from) ? ` · ${arcOf(arcs, r.from)!.name}` : ""}</span>
                </span>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${KIND[r.kind].verdict === "Skip" ? "bg-[#f43f5e]/15 text-[#fb7185]" : "bg-white/5 text-ink/80"}`}>{KIND[r.kind].verdict}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="card reveal mt-10 p-4" aria-labelledby="path-h">
        <h2 id="path-h" className="font-semibold">Filler-free watch order</h2>
        <p className="mt-1 text-sm text-muted">{watch.length} episodes. Copy it into your notes, or turn on &ldquo;Hide filler&rdquo; on the <Link href={`${animePath(a)}/episodes`} className="text-violet underline underline-offset-2">episode list</Link>.</p>
        <p className="mt-2 text-sm leading-6 text-ink/90">{formatRanges(watch)}</p>
      </section>

      <p className="mt-6 text-xs text-muted">
        {f.entry.source === "mal"
          ? <>Generated from MyAnimeList&apos;s episode flags (via the Jikan API) and refreshed monthly.</>
          : f.entry.checked
            ? <>Curated by AniLumi and cross-checked against {f.entry.checked}{f.entry.reviewedOn ? ", then checked again by hand" : ""}.</>
            : <>Draft list, still being verified. Double-check before skipping a long run.</>}
        {f.entry.note ? ` ${f.entry.note}` : ""} Episode numbers follow Kitsu&apos;s numbering for this series.
      </p>
      {f.entry.reviewedOn && <CheckedBy date={f.entry.reviewedOn} className="mt-2" />}

      {dbEnabled() && <LeadForm className="mt-8" kind="guide" source="filler-guide" animeId={a.id} animeTitle={a.title} title={`📬 Get ${a.title} guide updates`} blurb="An email when this filler list changes or the next season's guide is out." button="Keep me posted" />}

      <p className="mt-6 text-sm text-muted">
        <Link href={animePath(a)} className="text-violet hover:underline">{a.title} overview</Link> ·{" "}
        <Link href={`${animePath(a)}/how-long-to-watch`} className="text-violet hover:underline">How long to watch</Link> ·{" "}
        <Link href={`/watch-order/${a.slug}`} className="text-violet hover:underline">Watch order</Link> ·{" "}
        <Link href="/filler-lists" className="text-violet hover:underline">All filler lists</Link>
      </p>

      <Faq items={faq} />
    </div>
  );
}
