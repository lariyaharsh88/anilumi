import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import data from "@/data/crunchyroll-plans.json";

export const revalidate = 86400;

/**
 * Crunchyroll's plans and prices outside India (India has /crunchyroll-price-india), whether it's free, the free trial,
 * Crunchyroll Manga, Game Vault and any running deal. Keyword Planner, US, Nov 2026, a month: "crunchyroll free trial"
 * 60.5K, "is crunchyroll free" 18.1K, "crunchyroll price" 12.1K, "crunchyroll cost" 12.1K, "crunchyroll subscription
 * price" 8.1K, "crunchyroll manga" 27.1K, "crunchyroll black friday" 18.1K last November. Facts in
 * data/crunchyroll-plans.json, two sources each except prices marked as App Store listings.
 */
type Plan = { name: string; monthly: number; annual: number | null; single?: "monthly" | "annual" | "both" };
type Region = { label: string; symbol: string; plans: Plan[] };
type Deal = { name: string; from: string; to: string; offer: string; prices: { plan: string; price: number }[]; pricesWhere: string; who: string; where: string; lastYear: string; sources: string[] };
const D = data as unknown as {
  checked: string; lastChange: string; regions: Record<"US" | "CA" | "GB" | "AU", Region>;
  includes: Record<string, { streams: number; offline: string; gameVault: boolean; manga: string; store: string }>;
  free: string; trial: string; manga: string; gameVault: string; deal: Deal | null; sources: string[];
};
const REGIONS = ["US", "CA", "GB", "AU"] as const;
const PLANS = ["Fan", "Mega Fan", "Ultimate Fan"];
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const money = (symbol: string, n: number) => `${symbol}${n.toFixed(2)}`;
const us = (plan: string) => D.regions.US.plans.find((p) => p.name === plan)!;
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
/** The deal while it runs (until the end of its last day, US Pacific time), else null. */
function liveDeal(now = new Date()): Deal | null {
  const d = D.deal;
  return d && now >= new Date(`${d.from}T00:00:00-08:00`) && now <= new Date(`${d.to}T23:59:59-08:00`) ? d : null;
}

export function generateMetadata(): Metadata {
  const deal = liveDeal();
  const y = new Date().getFullYear();
  const mon = new Date(`${D.checked}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  return {
    title: fitTitle([
      deal && `Crunchyroll Price (${mon}): Free Trial & ${deal.name.replace(/ \d{4}$/, "")} Deal`,
      `Crunchyroll Price (${mon}): Plans From $${us("Fan").monthly}, Free Trial`,
      `Crunchyroll Price & Plans (${y}): Is There a Free Trial?`,
      `Crunchyroll Price (${y})`,
    ]),
    description: fitDescription(deal
      ? `Crunchyroll is $${us("Fan").monthly}–$${us("Ultimate Fan").monthly} a month in the US; ${deal.name.replace(/ \d{4}$/, "")}: $${deal.prices[0].price} a month for 6 months until ${fmt(deal.to).replace(/ \d{4}$/, "")}. No free plan, but a 7-day free trial.`
      : `Crunchyroll costs $${us("Fan").monthly}, $${us("Mega Fan").monthly} or $${us("Ultimate Fan").monthly} a month in the US, with prices for Canada, the UK and Australia. No free plan since January 2026, but a 7-day free trial.`),
    alternates: { canonical: "/crunchyroll-price" },
  };
}

/** Crunchyroll plans by country, what each includes, the free tier and trial, Manga, Game Vault and any running deal. */
export default function CrunchyrollPricePage() {
  const deal = liveDeal();
  const fan = us("Fan"), mega = us("Mega Fan"), ult = us("Ultimate Fan");
  const singles = REGIONS.some((r) => D.regions[r].plans.some((p) => p.single));
  const cell = (r: Region, p: Plan | undefined, k: "monthly" | "annual") => {
    const v = p?.[k];
    if (v == null) return <span className="text-muted">–</span>;
    const one = p!.single === k || p!.single === "both";
    return <>{money(r.symbol, v)}{one && <sup className="text-muted" title="App Store listing only">*</sup>}</>;
  };

  const faq: FaqItem[] = [
    { q: "How much is Crunchyroll a month?", a: `In the US, $${fan.monthly} for Fan, $${mega.monthly} for Mega Fan and $${ult.monthly} for Ultimate Fan. ${D.lastChange} In Canada it's from C$${D.regions.CA.plans[0].monthly}, in the UK from £${D.regions.GB.plans[0].monthly} and in Australia from A$${D.regions.AU.plans[0].monthly}.` },
    { q: "Is Crunchyroll free?", a: D.free },
    { q: "Does Crunchyroll have a free trial?", a: `Yes: ${D.trial}` },
    ...(deal ? [{ q: `Is there a Crunchyroll ${deal.name} deal?`, a: `Yes, from ${fmt(deal.from)} to ${fmt(deal.to)}: ${deal.offer.charAt(0).toLowerCase()}${deal.offer.slice(1)}. In the ${deal.pricesWhere}: ${deal.prices.map((x) => `${x.plan} $${x.price}`).join(", ")} a month. ${deal.who} ${deal.where}` }] : []),
    { q: "What's the difference between Fan, Mega Fan and Ultimate Fan?", a: `Fan is ad-free on 1 screen with offline viewing on 1 device. Mega Fan adds 4 screens, offline downloads and Game Vault. Ultimate Fan allows 6 screens and includes Crunchyroll Manga, with the biggest store discount (15%).` },
    { q: "Is Crunchyroll Manga included in my plan?", a: D.manga },
    { q: "What is Crunchyroll Game Vault?", a: D.gameVault },
    { q: "Did Funimation merge with Crunchyroll?", a: "Yes. Funimation closed on 2 April 2024, and its accounts and most of its anime moved to Crunchyroll." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", "/crunchyroll-price", "Crunchyroll price and plans", `Crunchyroll costs $${fan.monthly} to $${ult.monthly} a month in the US.`)} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/crunchyroll-price", label: "Crunchyroll price" }]}
        eyebrow="💳 Streaming prices"
        title={<>Crunchyroll price: <span className="text-gradient">plans, free trial &amp; deals</span></>}
        subtitle="What each Crunchyroll plan costs in the US, Canada, the UK and Australia, what you get for it, and whether there's any way to watch free."
        facts={[
          { value: `$${fan.monthly}`, label: "cheapest US plan / month" },
          { value: "7 days", label: "free trial" },
          { value: "No", label: "free plan" },
          ...(deal ? [{ value: `$${deal.prices[0].price}`, label: `${deal.name} / month` }] : []),
        ]}
        hue={25}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/crunchyroll-price-india" className="chip">🇮🇳 Crunchyroll price in India</Link>
          <Link href="/free-anime-websites" className="chip">🆓 Free anime websites</Link>
          <Link href="/funimation" className="chip">What happened to Funimation</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(D.checked)}>
        Crunchyroll costs ${fan.monthly} a month (Fan), ${mega.monthly} (Mega Fan) or ${ult.monthly} (Ultimate Fan) in the US. There&apos;s no free plan since 31 December 2025, but new members get a 7-day free trial on any plan.{deal ? ` Until ${fmt(deal.to)}, the ${deal.name} sale cuts the first 6 months to $${deal.prices[0].price}–$${deal.prices[deal.prices.length - 1].price} a month.` : ""}
      </AnswerLead>

      {deal && (
        <section className="card reveal mt-8 border-orange-400/40 bg-orange-500/[.07] p-5" aria-labelledby="deal-h">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">On now · until {fmt(deal.to)}</p>
          <h2 id="deal-h" className="mt-1 text-xl font-bold text-ink">Crunchyroll {deal.name} sale</h2>
          <p className="mt-2 text-sm leading-6 text-ink/90">{deal.offer}. In the {deal.pricesWhere}:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {deal.prices.map((x) => (
              <li key={x.plan} className="rounded-xl border border-line bg-white/[.03] p-3">
                <p className="text-sm text-muted">{x.plan}</p>
                <p className="text-lg font-bold text-ink">${x.price}<span className="text-sm font-normal text-muted"> / month</span></p>
                <p className="text-xs text-muted">then ${us(x.plan).monthly}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-muted">{deal.who} {deal.where} {deal.lastYear}</p>
        </section>
      )}

      <section className="reveal pt-10" aria-labelledby="price-h">
        <h2 id="price-h" className="h-section mb-1">Crunchyroll prices by country</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">{D.lastChange}</p>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-semibold">Plan</th>
                {REGIONS.map((r) => <th key={r} className="py-2 pr-3 font-semibold">{D.regions[r].label}</th>)}
              </tr>
            </thead>
            <tbody>
              {PLANS.map((name) => (
                <tr key={name} className="border-b border-line/50 align-top">
                  <th scope="row" className="py-2.5 pr-3 font-medium text-ink">{name}</th>
                  {REGIONS.map((r) => {
                    const p = D.regions[r].plans.find((x) => x.name === name);
                    return (
                      <td key={r} className="py-2.5 pr-3 tabular-nums text-ink/90">
                        {cell(D.regions[r], p, "monthly")}<span className="text-xs text-muted"> /mo</span>
                        {p?.annual != null && <span className="block text-xs text-muted">{cell(D.regions[r], p, "annual")} /yr</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {singles && <p className="mt-2 text-xs text-muted">* From the App Store listing only: Crunchyroll shows prices only to visitors in each country, so check in the app before you pay. Annual prices left blank weren&apos;t confirmed by two sources.</p>}
      </section>

      <section className="reveal pt-10" aria-labelledby="plans-h">
        <h2 id="plans-h" className="h-section mb-4">What each plan includes</h2>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line"><th className="py-2 pr-3 font-semibold" /><th className="py-2 pr-3 font-semibold">Fan</th><th className="py-2 pr-3 font-semibold">Mega Fan</th><th className="py-2 font-semibold">Ultimate Fan</th></tr>
            </thead>
            <tbody>
              {([
                ["No ads", () => "✓"],
                ["Screens at once", (p: string) => String(D.includes[p].streams)],
                ["Offline viewing", (p: string) => D.includes[p].offline],
                ["Game Vault", (p: string) => (D.includes[p].gameVault ? "✓" : "–")],
                ["Crunchyroll Manga", (p: string) => D.includes[p].manga],
                ["Store discount", (p: string) => D.includes[p].store],
              ] as [string, (p: string) => string][]).map(([label, v]) => (
                <tr key={label} className="border-b border-line/50">
                  <th scope="row" className="py-2.5 pr-3 font-medium text-muted">{label}</th>
                  {PLANS.map((p) => <td key={p} className="py-2.5 pr-3 text-ink/90">{v(p)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reveal grid gap-3 pt-10 md:grid-cols-2" aria-label="Free plan, trial, Manga and Game Vault">
        {[
          ["Is Crunchyroll free?", D.free],
          ["The free trial", D.trial],
          ["Crunchyroll Manga", D.manga],
          ["Game Vault", D.gameVault],
        ].map(([h, p]) => (
          <div key={h} className="card p-4">
            <h2 className="font-semibold text-ink">{h}</h2>
            <p className="mt-1 text-sm leading-6 text-ink/85">{p}</p>
          </div>
        ))}
      </section>

      <p className="mt-8 max-w-3xl text-sm text-muted">In India, Crunchyroll has its own prices and the Hindi-dubbed catalogue: see <Link href="/crunchyroll-price-india" className="text-violet hover:underline">Crunchyroll price in India</Link>. For legal anime that costs nothing, see <Link href="/free-anime-websites" className="text-violet hover:underline">free anime websites</Link>.</p>

      <MadeBy className="mt-8" method={`Prices come from Crunchyroll's help center and price announcements as reported by TheWrap, MobileSyrup and WhistleOut, cross-checked with each country's App Store listing; the free-tier and trial rules from Crunchyroll's help center. Sources: ${list(["help.crunchyroll.com", "TheWrap", "MobileSyrup", "WhistleOut", "Anime News Network"])}.`} date={D.checked} />
      <Faq title="Crunchyroll price: FAQ" items={faq} />
    </div>
  );
}
