import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { dubHref, dubsOn, hindiDubbed, hindiPlatform, type HindiPlatform } from "@/lib/hindidub";
import { dubbedIn } from "@/lib/regionaldub";
import { PERIOD, PRICES_CHECKED, pricesFor, type PricePlan } from "@/lib/platformprices";

export const revalidate = 86400;

/**
 * "crunchyroll subscription price india" and its variants: about 9K searches a month in India (Keyword Planner, Nov
 * 2026). Prices, plan notes and the end of the free tier come from data/hindi-platform-prices.json; the Hindi, Tamil
 * and Telugu counts from the dub lists.
 */
const checkedOn = () => new Date(`${PRICES_CHECKED}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const perMonth = (x: PricePlan) => Math.round(x.price / (x.period === "year" ? 12 : x.period === "quarter" ? 3 : 1));
/** A plan's first note sentence ("Ad-free, up to 4 streams, offline downloads"); an annual plan's notes cite sources, so it borrows its monthly twin's. */
const perks = (x: PricePlan, all: PricePlan[]) => {
  const first = (n?: string) => (n ?? "").split(". ")[0].replace(/\.$/, "");
  const twin = x.period !== "month" ? all.find((m) => m.period === "month" && x.name.startsWith(m.name)) : null;
  return twin ? `${first(twin.notes)}, billed ${x.period === "year" ? "yearly" : "quarterly"}` : first(x.notes);
};
const onCrunchyroll = (names: string[]) => names.some((n) => /^crunchyroll/i.test(n) && !/sony liv/i.test(n));

function load() {
  const price = pricesFor("crunchyroll")!;
  const p = hindiPlatform("crunchyroll") as HindiPlatform;
  const hindi = dubsOn(p);
  const tamil = dubbedIn("ta").filter((d) => onCrunchyroll(d.platforms.map((x) => x.name)));
  const telugu = dubbedIn("te").filter((d) => onCrunchyroll(d.platforms.map((x) => x.name)));
  const plans = [...price.plans].sort((a, b) => perMonth(a) - perMonth(b));
  // "From ₹99": the lowest monthly plan, which is how people compare (the annual plan is cheaper per month but paid upfront).
  const cheapest = [...price.plans].filter((x) => x.period === "month").sort((a, b) => a.price - b.price)[0] ?? plans[0];
  return { price, p, hindi, tamil, telugu, plans, cheapest };
}

export function generateMetadata(): Metadata {
  const { cheapest, hindi, tamil } = load();
  const y = new Date().getFullYear();
  return {
    title: fitTitle([`Crunchyroll Price in India (${y}): Plans from ₹${cheapest.price}, Hindi Dubs & What You Get`, `Crunchyroll Price in India (${y}): Plans from ₹${cheapest.price} & Hindi Dubs`, `Crunchyroll Price in India (${y})`]),
    description: fitDescription(`Every Crunchyroll plan in India with its price in rupees, what each includes (streams, offline downloads, manga), and what you get in Indian languages: ${hindi.length} anime in Hindi and ${tamil.length} in Tamil. Checked ${checkedOn()}.`),
    alternates: { canonical: "/crunchyroll-price-india" },
  };
}

export default function CrunchyrollPriceIndia() {
  const { price, p, hindi, tamil, telugu, plans, cheapest } = load();
  const monthly = plans.filter((x) => x.period === "month");
  const faq: FaqItem[] = [
    { q: "How much is Crunchyroll in India?", a: `${monthly.map((x) => `${x.name}: ₹${x.price} a month`).join("; ")}${plans.some((x) => x.period === "year") ? `; ${plans.filter((x) => x.period === "year").map((x) => `${x.name}: ₹${x.price.toLocaleString("en-IN")} a year`).join("; ")}` : ""}. Checked ${checkedOn()}; prices in the app store and on the web can differ.` },
    { q: "Is Crunchyroll free in India?", a: "No. Crunchyroll's free, ad-supported tier ended on 31 December 2025, so a paid plan is needed. For free and legal anime in Hindi, the licensors' YouTube channels and MX Player (Prime Video's free tier) carry some shows." },
    { q: "Which Crunchyroll plan do I need for Hindi dubs?", a: price.hindiNote ?? "Any paid plan includes the Hindi audio where a show has it." },
    { q: "Which Crunchyroll plan lets me download episodes?", a: `${plans.filter((x) => /offline|download/i.test(x.notes ?? "")).map((x) => `${x.name} (₹${x.price} a ${PERIOD[x.period]})`).join(", ") || "Mega Fan and higher"}: offline downloads in the app. The cheapest plan, ${cheapest.name}, streams only.` },
    { q: "How many anime are in Hindi on Crunchyroll?", a: `${hindi.length} on our checked list, including ${hindi.slice(0, 6).map((x) => x.d.t).join(", ")}. Also ${tamil.length} in Tamil and ${telugu.length} in Telugu.` },
    { q: "How do I switch Crunchyroll to Hindi?", a: p.how },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", "/crunchyroll-price-india", "Crunchyroll price in India")} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/anime-streaming-sites", label: "Streaming sites in India" }, { href: "/crunchyroll-price-india", label: "Crunchyroll price" }]}
        eyebrow="💳 Crunchyroll India"
        title={<>Crunchyroll price <span className="text-gradient">in India</span></>}
        subtitle="Every plan with its price in rupees, what each one includes, and what Crunchyroll has in Hindi, Tamil and Telugu."
        facts={[{ value: `₹${cheapest.price}`, label: `${cheapest.name}, a ${PERIOD[cheapest.period]}` }, { value: String(hindi.length), label: "anime in Hindi" }, { value: String(tamil.length), label: "in Tamil" }]}
        hue={25}
      />

      <section className="reveal mt-10" aria-labelledby="plans-h">
        <h2 id="plans-h" className="h-section mb-1">Crunchyroll plans and prices</h2>
        <p className="mb-4 text-sm text-muted">The free tier ended on 31 December 2025, so every plan below is paid. Checked {checkedOn()}.</p>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line"><th className="py-2 pr-3 font-semibold">Plan</th><th className="py-2 pr-3 font-semibold">Price</th><th className="py-2 pr-3 text-right font-semibold">Per month</th><th className="py-2 font-semibold">What you get</th></tr>
            </thead>
            <tbody>
              {plans.map((x) => (
                <tr key={`${x.name}-${x.period}`} className="border-b border-line/50 align-top">
                  <td className="py-2.5 pr-3 font-medium text-ink">{x.name}</td>
                  <td className="py-2.5 pr-3 tabular-nums">₹{x.price.toLocaleString("en-IN")} a {PERIOD[x.period]}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">₹{perMonth(x)}</td>
                  <td className="py-2.5 text-ink/85">{perks(x, plans)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-xs text-muted">Annual prices vary by source and offer (Crunchyroll&rsquo;s own announcements, the App Store and sale prices disagree), so check the app before you pay. App-store and web prices can differ.</p>
      </section>

      <section className="reveal mt-10" aria-labelledby="lang-h">
        <h2 id="lang-h" className="h-section mb-1">What Crunchyroll has in Indian languages</h2>
        <p className="mb-4 text-sm text-muted">Hindi audio is included on every paid plan where a show has it. {p.how}</p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="card p-4 text-sm"><p className="font-semibold text-ink"><Link href="/hindi-dub/crunchyroll" className="hover:text-violet-2">{hindi.length} in Hindi</Link></p><p className="mt-2 flex flex-wrap gap-1.5">{hindi.slice(0, 8).map((x) => <Link key={x.d.s} href={dubHref(x.d)} className="chip text-xs">{x.d.t}</Link>)}</p></div>
          <div className="card p-4 text-sm"><p className="font-semibold text-ink"><Link href="/tamil-dub" className="hover:text-violet-2">{tamil.length} in Tamil</Link></p><p className="mt-1 text-xs text-muted">{tamil.slice(0, 8).map((d) => d.t).join(", ")}</p></div>
          <div className="card p-4 text-sm"><p className="font-semibold text-ink"><Link href="/telugu-dub" className="hover:text-violet-2">{telugu.length} in Telugu</Link></p><p className="mt-1 text-xs text-muted">{telugu.slice(0, 8).map((d) => d.t).join(", ")}</p></div>
        </div>
        <JoinChannels source="crunchyroll-price" className="mt-5" />
      </section>

      <section className="reveal mt-10" aria-labelledby="alt-h">
        <h2 id="alt-h" className="h-section mb-3">Is Crunchyroll worth it in India?</h2>
        <div className="card max-w-3xl space-y-2 p-4 text-sm leading-6 text-ink/85">
          <p>If you watch new anime each season, yes: it has the biggest catalogue of the popular shows in India and the most Hindi dubs of any service. If you only want a few classics in Hindi, compare first: some are free on YouTube and MX Player, and Netflix has its own Hindi dubs.</p>
          <p><Link href="/anime-streaming-sites" className="text-violet hover:underline">Every streaming site in India compared →</Link> · <Link href="/download-anime-in-hindi" className="text-violet hover:underline">Downloading Hindi anime offline →</Link></p>
        </div>
      </section>

      <Faq title="Crunchyroll India: FAQ" items={faq} />
    </div>
  );
}
