import type { Metadata } from "next";
import Link from "@/components/Link";
import { site } from "@/lib/site";
import PageHero from "@/components/PageHero";
import CorrectionForm from "@/components/CorrectionForm";
import { dbEnabled } from "@/lib/db";

export const metadata: Metadata = { title: "Contact", description: `Send ${site.name} a question, an idea or a correction.`, alternates: { canonical: "/contact" } };

export default function Contact() {
  return (
    <div className="container-x pb-8">
      <PageHero eyebrow="Contact" title={<>Contact <span className="text-gradient">{site.name}</span></>} subtitle="Questions, ideas, partnerships or a mistake you spotted: every message is read." hue={262} />
      <div className="prose-anime mt-8 max-w-3xl">
        <p>Found something wrong in a watch order, filler list or episode date? Use the form below, or the <em>Spotted a mistake?</em> link at the bottom of any page, which tells us exactly which page you were on. Confirmed fixes usually go live within a few days.</p>
        <p>For advertising and partnerships, see <Link href="/advertise">Advertise</Link>. How we collect and check our data is on the <Link href="/about">About</Link> page.</p>
      </div>
      {dbEnabled() ? <CorrectionForm kind="contact" className="mt-6" /> : <p className="mt-6 text-muted">The contact form is temporarily unavailable. Please try again later.</p>}
    </div>
  );
}
