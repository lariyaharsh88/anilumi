import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { KIND_CLASS } from "@/components/HindiDub";
import { getAnimeBySlug, posterUrl } from "@/lib/kitsu";
import { itemList } from "@/lib/ld";
import { fitTitle } from "@/lib/titles";
import { HINDI_PLATFORMS, dubDate, dubHref, dubsOn, hindiDubbed, hindiPlatform, platformKind } from "@/lib/hindidub";

export const revalidate = 86400;
// Rendered on first request like the rest of the site: build-time pages with dynamicParams = false 404 on the
// Cloudflare build (OpenNext). Unknown values still 404 through load().
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ platform: string }> };

function load(slug: string) {
  const p = hindiPlatform(slug);
  if (!p) notFound();
  const list = dubsOn(p);
  if (!list.length) notFound();
  return { p, list };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { p, list } = load((await params).platform);
  const y = new Date().getFullYear();
  const name = p.label.replace(/ \(.*\)$/, "");
  return {
    title: fitTitle([`${name} Hindi Dubbed Anime List (${y}): ${list.length} Anime`, `${name} Hindi Dubbed Anime (${y}): ${list.length} Anime`, `${name} Hindi Dubbed Anime`]),
    description: `All ${list.length} anime with an official Hindi dub on ${p.label}, most-watched first: ${list.slice(0, 6).map((x) => x.d.t).join(", ")} and more, with which seasons have Hindi audio. Checked ${dubDate()}.`,
    alternates: { canonical: `/hindi-dub/${p.slug}` },
  };
}

/** Every anime a platform carries with Hindi audio, and how to switch the audio on. */
export default async function HindiPlatformPage({ params }: Props) {
  const { p, list } = load((await params).platform);
  const posters = (await Promise.all(list.slice(0, 3).map((x) => getAnimeBySlug(x.d.s).catch(() => null)))).map((a) => (a ? posterUrl(a, "medium") : null));
  const others = HINDI_PLATFORMS.filter((x) => x.slug !== p.slug).map((x) => ({ x, n: dubsOn(x).length })).filter((o) => o.n);
  const kind = platformKind(list[0].rows[0].name);
  const faq = [
    { q: `Which anime are in Hindi on ${p.label}?`, a: `${list.length} on our list: ${list.map((x) => x.d.t).join(", ")}.` },
    { q: `How do I watch anime in Hindi on ${p.label}?`, a: p.how },
    { q: `Is ${p.label} free?`, a: kind === "free" ? "Yes. These are official uploads by the licensors, free with ads." : kind === "tv" ? "It is a TV channel, included in cable and DTH packs that carry it." : "No, it needs a subscription. For free and legal Hindi dubs, see the YouTube channels and MX Player on the main Hindi dub list." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList(`Hindi dubbed anime on ${p.label}`, list.map((x) => ({ url: dubHref(x.d), name: `${x.d.t} (Hindi dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: `/hindi-dub/${p.slug}`, label: p.label }]}
        eyebrow="🇮🇳 Hindi dub"
        title={<>Hindi dubbed anime on <span className="text-gradient">{p.label}</span></>}
        subtitle={`Every anime ${p.label} streams with an official Hindi audio track, most-watched first, with the seasons that have Hindi.`}
        facts={[
          { value: String(list.length), label: "anime in Hindi" },
          { value: String(hindiDubbed().length), label: "on all platforms" },
        ]}
        hue={25}
        posters={posters}
      />

      <section className="card reveal mt-8 p-4" aria-labelledby="how-h">
        <h2 id="how-h" className="font-semibold text-ink">How to switch to Hindi</h2>
        <p className="mt-1 text-sm text-ink/85">{p.how}</p>
      </section>

      <section className="reveal mt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">{list.length} anime in Hindi on {p.label}</h2>
        <p className="mb-4 text-sm text-muted">Checked {dubDate()} against {p.label}&apos;s own pages and Indian anime news.</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map(({ d, rows }) => (
            <li key={d.s} className="card p-4">
              <Link href={dubHref(d)} className="font-semibold text-ink hover:text-violet-2">{d.t}</Link>
              <ul className="mt-2 space-y-1.5">
                {rows.map((r) => (
                  <li key={r.name + r.scope} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-medium text-ink/90">{r.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_CLASS[platformKind(r.name)]}`}>{platformKind(r.name) === "free" ? "Free" : platformKind(r.name) === "tv" ? "TV channel" : "Subscription"}</span>
                    {r.scope && <span className="text-muted">· {r.scope}</span>}
                    {/^https:\/\//.test(r.url) && <a href={r.url} target="_blank" rel="noopener nofollow" className="text-xs text-violet hover:underline">source ↗</a>}
                  </li>
                ))}
              </ul>
              {d.platforms.length > rows.length && <p className="mt-2 text-xs text-muted">Also on {d.platforms.filter((x) => !rows.includes(x)).map((x) => x.name).join(", ")}</p>}
            </li>
          ))}
        </ul>
      </section>

      <nav className="mt-10 text-sm" aria-label="Other platforms">
        <p className="mb-2 text-muted">Hindi dubs on other platforms</p>
        <ul className="flex flex-wrap gap-2">
          {others.map(({ x, n }) => <li key={x.slug}><Link href={`/hindi-dub/${x.slug}`} className="chip">{x.label} ({n})</Link></li>)}
          <li><Link href="/hindi-dub" className="chip">All Hindi dubbed anime</Link></li>
        </ul>
      </nav>

      <Faq title={`${p.label}: Hindi dub FAQ`} items={faq} />
    </div>
  );
}
