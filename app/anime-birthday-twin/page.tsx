import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import MadeBy from "@/components/MadeBy";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import BirthdayTwin from "@/components/BirthdayTwin";
import { twinDays } from "@/lib/birthdaytwin";
import { todayJst, birthdayChars } from "@/lib/birthdays";
import { site } from "@/lib/site";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Anime Birthday Twin: Which Anime Character Shares Your Birthday?",
  description: fitDescription("Enter your birthday to find the anime characters and voice actors born on the same day, your zodiac sign, and a card to share with friends."),
  alternates: { canonical: "/anime-birthday-twin" },
};

export default function BirthdayTwinPage() {
  const { m, d } = todayJst();
  const today = twinDays()[`${m}-${d}`];
  const total = birthdayChars().length;
  return (
    <div className="container-x pb-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Anime birthday twin finder", applicationCategory: "EntertainmentApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/birthdays", label: "Birthdays" }, { href: "/anime-birthday-twin", label: "Birthday twin" }]}
        eyebrow="🎂 Birthday twin"
        title={<>Which anime character <span className="text-gradient">shares your birthday?</span></>}
        subtitle={`Pick your birthday to meet your anime twins: the most-loved characters and voice actors born the same day, out of ${total.toLocaleString("en-US")} characters with a known birthday. Then share the result.`}
        facts={[{ value: total.toLocaleString("en-US"), label: "characters with birthdays" }, { value: "366", label: "days covered" }]}
        hue={330}
      />
      <MadeBy className="mt-4" method="Birthdays come from AniList's character and staff profiles; the line under each character is our own, written to be spoiler-free." />
      <section className="mt-8" aria-label="Birthday twin finder">
        <BirthdayTwin origin={site.url} />
      </section>
      {today?.c[0] && <p className="mt-6 text-sm text-muted">Born today? Your twins include <Link href={today.path} className="text-violet hover:underline">{today.c.slice(0, 3).map((c) => c.n).join(", ")}</Link>.</p>}
      <p className="mt-2 text-sm text-muted">Browse the full <Link href="/birthdays" className="text-violet hover:underline">anime birthday calendar</Link>, or month by month from <Link href="/birthdays/january" className="text-violet hover:underline">January</Link>.</p>
      <Faq title="Anime birthday twin FAQ" items={[
        { q: "How do I find which anime character has my birthday?", a: "Choose your birth month and day above and press the button. You'll see the most-loved anime characters born that day, voice actors who share it, and your zodiac sign, with a link to everyone born on that date." },
        { q: "Where do the birthdays come from?", a: `AniList's character and voice actor profiles: ${total.toLocaleString("en-US")} anime characters have a birthday on record. Characters with no official birthday aren't listed.` },
        { q: "Can I share my result?", a: "Yes. The share button sends a link to your birthday's page, which shows a card with your anime twins when you post it on WhatsApp, X or Discord." },
      ]} />
    </div>
  );
}
