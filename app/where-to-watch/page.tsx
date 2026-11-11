import type { Metadata } from "next";
import MadeBy from "@/components/MadeBy";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import RegionTabs from "@/components/RegionTabs";
import ListFilter from "@/components/ListFilter";
import { STREAM_KIND_CLASS } from "@/components/StreamServices";
import { getAnimeBySlug, posterUrl } from "@/lib/kitsu";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { STREAMS_CHECKED, REGIONS, REGION_FLAG, REGION_NAME, REGION_SHORT, KIND_LABEL, allStreams, audioLine, catalogue, freeIn, servicesIn, streamsDate, streamsPath, type Region } from "@/lib/streams";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const n = allStreams().length;
  return {
    title: fitTitle([`Where to Watch Anime (${new Date().getFullYear()}): ${n} Shows in the US, India & UK`, `Where to Watch Anime: ${n} Shows by Country`, "Where to Watch Anime by Country"]),
    description: fitDescription(`Where ${n} popular anime stream legally in the US, India and the UK: Crunchyroll, Netflix, Prime Video, Hulu, HIDIVE and free options, with sub, English dub and Hindi dub for each. Checked ${streamsDate()}.`),
    alternates: { canonical: "/where-to-watch" },
  };
}

/** Every researched franchise by country: the free legal options, then show by show, then service by service. */
export default async function WhereToWatchHub() {
  const all = allStreams();
  const posters = (await Promise.all(all.slice(0, 3).map((e) => getAnimeBySlug(e.s).catch(() => null)))).map((a) => (a ? posterUrl(a, "medium") : null));
  const freeCount = (r: Region) => all.filter((e) => freeIn(e, r).length).length;
  const services = new Set(REGIONS.flatMap((r) => catalogue(r).map((c) => c.service)));
  const topIn = (r: Region) => catalogue(r).slice(0, 3).map((c) => `${c.service} (${c.titles.length})`).join(", ");
  const faq = [
    { q: "Where can I watch anime legally?", a: `In the US: ${topIn("US")}. In India: ${topIn("IN")}. In the UK: ${topIn("GB")}. The numbers are how many of the ${all.length} shows on this page each service carries.` },
    { q: "Where can I watch anime for free, legally?", a: `Some licensors put whole series on their own YouTube channels (Muse, Ani-One) and ad-supported services such as Tubi and Pluto TV carry others. Free and legal options on this page: ${freeCount("US")} shows in the US, ${freeCount("IN")} in India and ${freeCount("GB")} in the UK. Sites that offer every anime free are unlicensed.` },
    { q: "Why is a show on Netflix in one country but not another?", a: "Streaming rights are sold country by country, so the same show can be on Crunchyroll in the US, Netflix in India and nowhere in the UK. That's why this page lists each country separately." },
    { q: "How was this checked?", a: `Against each service's own title page, JustWatch and official announcements on ${streamsDate()}, with two sources where possible; services confirmed by a single source are marked "one source". Catalogues change every month, so check the service before you subscribe.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Where to watch popular anime", all.map((e) => ({ url: streamsPath(e.s), name: `Where to watch ${e.t}` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }]}
        eyebrow="▶ Where to watch"
        title={<>Where to watch <span className="text-gradient">anime</span>, by country</>}
        subtitle="Which legal service streams each popular anime in the US, India and the UK, with sub or dub, free or paid, and which seasons it has."
        facts={[
          { value: String(all.length), label: "anime checked" },
          { value: String(services.size), label: "services" },
          { value: "3", label: "countries" },
        ]}
        hue={200}
        posters={posters}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/dub-schedule" className="chip">Dub schedule</Link>
          <Link href="/hindi-dub" className="chip">Hindi dubbed anime</Link>
        </p>
      </PageHero>
      <MadeBy className="mt-4" method="Each service is checked on JustWatch's country pages and the service's own title page (Netflix and Prime Video India read from India), with AniList links and news as a second source." date={STREAMS_CHECKED} />

      <div className="mt-8">
        <RegionTabs regions={[...REGIONS]} labels={Object.fromEntries(REGIONS.map((r) => [r, `${REGION_FLAG[r]} ${REGION_NAME[r]}`]))}>
          {REGIONS.map((r) => {
            const free = all.filter((e) => freeIn(e, r).length);
            const cat = catalogue(r);
            return (
              <div key={r} data-region={r} className="space-y-12">
                {free.length > 0 && (
                  <section id={r === "US" ? "free" : undefined} className="card scroll-mt-24 border-emerald-500/40 bg-emerald-500/[.06] p-4" aria-labelledby={`free-${r}`}>
                    <h2 id={`free-${r}`} className="font-semibold text-ink">Free and legal in {REGION_NAME[r]} ({free.length})</h2>
                    <p className="mt-1 text-sm text-ink/80">Official channels and ad-supported services. Anything else offering these free is an unlicensed upload.</p>
                    <ul className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                      {free.map((e) => (
                        <li key={e.s} className="min-w-0">
                          <Link href={streamsPath(e.s)} className="font-medium text-ink hover:text-violet-2">{e.t}</Link>
                          <span className="text-muted"> · {freeIn(e, r).map((x) => `${x.service}${x.scope ? ` (${x.scope})` : ""}`).join(", ")}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section id={r === "US" ? "shows" : undefined} className="scroll-mt-24" aria-labelledby={`shows-${r}`}>
                  <h2 id={`shows-${r}`} className="h-section mb-1">Where each anime streams in {REGION_NAME[r]}</h2>
                  <p className="mb-4 text-sm text-muted">Most-watched first. Checked {streamsDate()}.</p>
                  <ListFilter target={`shows-list-${r}`} placeholder="Find an anime" />
                  <ul id={`shows-list-${r}`} className="card divide-y divide-line text-sm">
                    {all.map((e) => {
                      const list = servicesIn(e, r).filter((x) => x.kind !== "buy");
                      return (
                        <li key={e.s} data-filter={e.t.toLowerCase()} className="flex flex-wrap gap-x-2 px-3 py-2">
                          <Link href={streamsPath(e.s)} className="font-semibold text-ink hover:text-violet-2">{e.t}</Link>
                          <span className="text-ink/75">{list.length ? list.map((x) => `${x.service}${x.kind === "free" ? " (free)" : ""}${audioLine(x) ? ` · ${audioLine(x)}` : ""}`).join("; ") : servicesIn(e, r).length ? "Buy or rent only" : "Not streaming legally here"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section id={r === "US" ? "services" : undefined} className="scroll-mt-24" aria-labelledby={`svc-${r}`}>
                  <h2 id={`svc-${r}`} className="h-section mb-4">Anime by service in {REGION_SHORT[r]}</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cat.map((c) => (
                      <div key={c.service} className="card p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-ink">{c.service}</h3>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STREAM_KIND_CLASS[c.kind]}`}>{KIND_LABEL[c.kind]}</span>
                        </div>
                        <p className="text-xs text-muted">{c.titles.length} of these anime</p>
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {c.titles.slice(0, 30).map((e) => <li key={e.s}><Link href={streamsPath(e.s)} className="chip text-xs">{e.t}</Link></li>)}
                          {c.titles.length > 30 && <li className="text-xs text-muted">+{c.titles.length - 30} more</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            );
          })}
        </RegionTabs>
      </div>

      <Faq title="Where to watch anime: FAQ" items={faq} />
    </div>
  );
}
