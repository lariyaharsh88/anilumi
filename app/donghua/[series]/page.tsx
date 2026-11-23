import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { ORDERS_CHECKED, donghuaByTitle, donghuaOrder, donghuaOrders, inHindi, orderPath, servicesIn, type DonghuaRegion, type OrderPart } from "@/lib/donghua";

export const revalidate = 86400;
// Rendered on first request (OpenNext 404s build-time pages with dynamicParams = false).
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ series: string }> };

const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const KIND: Record<OrderPart["kind"], string> = { season: "Season", annual: "Annual series", special: "Special", film: "Film" };
const REGION: Record<DonghuaRegion, string> = { IN: "India", US: "the US", GB: "the UK" };
// Part names carry the pinyin in brackets: "Battle Through the Heavens Season 2 (Doupo Cangqiong Di Er Ji)".
const english = (p: OrderPart) => p.name.replace(/\s*\([^)]*\)/g, "").trim();
const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** A part without the series name in front ("Season 2", "Movie: Battle of the Two Emperors"), else its episodes. */
const step = (p: OrderPart, series: string) => {
  const rest = english(p).replace(new RegExp(`^${escape(series)}\\s*:?\\s*`, "i"), "").replace(/^,\s*/, "");
  const range = typeof p.episodes === "string" ? p.episodes.replace(/\s*\(airing\)/, "") : null;
  // "opening run", "continued": episode numbers say more.
  return rest && /^[A-Z0-9]/.test(rest) ? rest : range ?? (rest || english(p));
};
const eps = (p: OrderPart) => (typeof p.episodes === "number" ? `${p.episodes} ep${p.episodes === 1 ? "" : "s"}` : p.episodes);
const finished = (status: string) => /^finished/i.test(status);
const onBreak = (status: string) => /^on break/i.test(status);

function load(slug: string) {
  const o = donghuaOrder(slug);
  if (!o) notFound();
  return { o, d: donghuaByTitle(o.hub) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { o } = load((await params).series);
  const main = o.parts.filter((p) => !p.skippable);
  return {
    title: fitTitle([`${o.short} Watch Order (${y}): Every Season, Film & Episode in Order`, `${o.short} Watch Order: All Seasons & Films in Order (${y})`, `${o.short} Watch Order (${y})`]),
    description: fitDescription(`How to watch ${o.short} in order: ${main.length} parts${o.parts.length > main.length ? `, ${o.parts.length - main.length} skippable` : ""}, where to start, which films you need, ${finished(o.status) ? "how it ends" : onBreak(o.status) ? "when it returns" : "the latest episode"} and where to stream it legally in India, the US and the UK.`),
    alternates: { canonical: orderPath(o.slug) },
  };
}

/** One long-running donghua in watch order: every season, annual run, special and film, with where to watch it. */
export default async function DonghuaOrderPage({ params }: Props) {
  const { o, d } = load((await params).series);
  const main = o.parts.filter((p) => !p.skippable);
  const skip = o.parts.filter((p) => p.skippable);
  const films = main.filter((p) => p.kind === "film");
  const others = donghuaOrders().filter((x) => x.slug !== o.slug);
  const where = (r: DonghuaRegion) => (d ? [...new Set(servicesIn(d, r).map((s) => s.service))] : []);

  const faq: FaqItem[] = [
    { q: `What order should I watch ${o.short} in?`, a: `${main.map((p) => step(p, o.short)).join(", then ")}.${skip.length ? ` You can skip ${skip.map(english).join(" and ")}.` : ""}` },
    { q: `Where should I start ${o.short}?`, a: o.start },
    { q: `Is ${o.short} finished?`, a: o.status },
    ...(films.length ? [{ q: `Do I need to watch the ${o.short} ${films.length === 1 ? "film" : "films"}?`, a: `Yes: ${films.map((f) => `${english(f)} (${f.years})`).join(" and ")} ${films.length === 1 ? "is" : "are"} part of the main story, in the place shown in the order.` }] : []),
    ...(d ? [{ q: `Where can I watch ${o.short} legally?`, a: (["IN", "US", "GB"] as DonghuaRegion[]).map((r) => (where(r).length ? `In ${REGION[r]}: ${where(r).join(", ")}` : `In ${REGION[r]}: no legal stream found`)).join(". ") + `.${inHindi(d) ? ` Hindi audio: ${d.hindi.where}.` : " There's no official Hindi dub."}` }] : []),
    ...(o.novel ? [{ q: `What is ${o.short} based on?`, a: `The web novel ${o.novel}.` }] : []),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={{ ...itemList(`${o.short} watch order`, o.parts.map((p) => ({ url: orderPath(o.slug), name: english(p) }))), itemListOrder: "https://schema.org/ItemListOrderAscending" }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/donghua", label: "Donghua" }, { href: orderPath(o.slug), label: `${o.short} watch order` }]}
        eyebrow={`🇨🇳 Donghua watch order${o.cn ? ` · ${o.cn}` : ""}`}
        title={<>{o.short} <span className="text-gradient">watch order</span></>}
        subtitle={`Every season, annual run, special and film of ${o.short} in order, with what to skip, ${finished(o.status) ? "how it ended" : "the latest episode"} and where to watch it legally.`}
        facts={[
          { value: String(main.length), label: "parts to watch" },
          ...(skip.length ? [{ value: String(skip.length), label: "skippable" }] : []),
          ...(films.length ? [{ value: String(films.length), label: films.length === 1 ? "film" : "films" }] : []),
          { value: finished(o.status) ? "Finished" : onBreak(o.status) ? "On break" : "Airing", label: "status" },
        ]}
        hue={0}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/donghua" className="chip">All donghua and where to watch</Link>
          {d?.kitsu && <Link href={`/anime/${d.kitsu}`} className="chip">{d.t} guide</Link>}
        </p>
      </PageHero>

      <AnswerLead checked={fmt(ORDERS_CHECKED)}>
        Watch {o.short} in this order: {main.map((p) => step(p, o.short)).join(" → ")}.{skip.length ? ` Skippable: ${skip.map(english).join(", ")}.` : ""} {o.status}
      </AnswerLead>

      <section className="reveal pt-10" aria-labelledby="order-h">
        <h2 id="order-h" className="h-section mb-3">{o.short} in order</h2>
        <ol className="space-y-2">
          {o.parts.map((p, i) => (
            <li key={p.name + i} className={`card flex gap-3 p-3.5 ${p.skippable ? "opacity-75" : ""}`}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet/15 text-xs font-bold text-violet-2">{i + 1}</span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{english(p)} {p.skippable && <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted">Skippable</span>}</p>
                <p className="text-xs text-muted">{KIND[p.kind]} · {eps(p)} · {p.years}</p>
                {p.what && <p className="mt-1 text-sm text-ink/85">{p.what}</p>}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-ink/85"><strong className="text-ink">Where to start:</strong> {o.start}</p>
      </section>

      {d && (
        <section className="reveal pt-10" aria-labelledby="where-h">
          <h2 id="where-h" className="h-section mb-3">Where to watch {o.short} legally</h2>
          <ul className="grid gap-2 sm:grid-cols-3">
            {(["IN", "US", "GB"] as DonghuaRegion[]).map((r) => (
              <li key={r} className="card p-3.5 text-sm"><p className="font-semibold text-ink">{REGION[r][0].toUpperCase() + REGION[r].slice(1)}</p><p className="mt-1 text-ink/85">{where(r).join(", ") || "No legal stream found"}</p></li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink/85">{inHindi(d) ? `🇮🇳 Hindi audio: ${d.hindi.where}.` : "No official Hindi dub yet; uploads labelled “Hindi” on YouTube or Bilibili are unofficial."} <Link href="/donghua" className="text-violet hover:underline">Every donghua and where to watch it →</Link></p>
        </section>
      )}

      <section className="reveal pt-10" aria-labelledby="more-h">
        <h2 id="more-h" className="h-section mb-3">More donghua watch orders</h2>
        <p className="flex flex-wrap gap-2 text-sm">{others.map((x) => <Link key={x.slug} href={orderPath(x.slug)} className="chip">{x.short}</Link>)}</p>
      </section>

      <MadeBy className="mt-8" method="Seasons, episode numbers and films from Wikipedia, MyAnimeList, AniList, TheTVDB and the platforms' own pages; where sources disagree, the page says so." date={ORDERS_CHECKED} />
      {o.note && <p className="mt-2 text-xs text-muted">{o.note}</p>}
      <Faq title={`${o.short} watch order: FAQ`} items={faq} />
    </div>
  );
}
