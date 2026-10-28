import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import PartnerForm from "@/components/PartnerForm";
import Faq from "@/components/Faq";
import { dbEnabled } from "@/lib/db";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Advertise & Partner with AniLumi",
  description: "Reach anime fans while they plan what to watch: sponsorships, affiliate partnerships and product placements on AniLumi.",
  alternates: { canonical: "/advertise" },
};

const OFFERS = [
  ["📅", "Season and schedule sponsorships", "Your brand on the weekly schedule, season charts and premiere previews fans check every week."],
  ["🎯", "Title-level placements", "Appear next to the anime your audience is watching: anime pages, episode pages, watch orders."],
  ["🤝", "Affiliate partnerships", "Streaming services, manga stores, merch and figures, with clear, honest placement."],
  ["📰", "Newsletter features", "A spot in the Friday digest of new episodes and premieres."],
];

export default function Advertise() {
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/advertise", label: "Advertise" }]}
        eyebrow="🤝 Partner with us"
        title={<>Reach anime fans <span className="text-gradient">while they choose what to watch</span></>}
        subtitle={`${site.name} is where fans check release dates, watch orders, filler lists and season previews. Tell us what you'd like to promote and we'll suggest the right placement.`}
        hue={262}
      />
      <section className="mt-10 grid gap-3 sm:grid-cols-2" aria-label="What we offer">
        {OFFERS.map(([icon, t, d]) => (
          <div key={t} className="card p-4"><p className="font-semibold text-ink"><span aria-hidden className="mr-2">{icon}</span>{t}</p><p className="mt-1 text-sm text-muted">{d}</p></div>
        ))}
      </section>
      <section className="mt-10" aria-labelledby="form-h">
        <h2 id="form-h" className="h-section mb-3">Send an enquiry</h2>
        {dbEnabled() ? <PartnerForm /> : <p className="card p-4 text-sm text-muted">Enquiries are temporarily closed. Please check back soon.</p>}
      </section>
      <Faq items={[
        { q: "Who visits AniLumi?", a: "Anime fans planning what to watch: people checking when the next episode airs, what order to watch a franchise in, which episodes are filler and what's coming next season." },
        { q: "Do you label sponsored content?", a: "Yes. Paid placements and affiliate links are always marked, and we don't sell rankings or scores." },
        { q: "What do you not accept?", a: "Gambling, adult content, piracy or illegal streaming, and anything misleading." },
      ]} />
    </div>
  );
}
