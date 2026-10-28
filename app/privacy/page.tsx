import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy", description: `What ${site.name} stores, why, and how to remove it.`, alternates: { canonical: "/privacy" } };

/** Plain-language privacy notice. Covers India's DPDP Act 2023 and GDPR basics; not legal advice. */
export default function Privacy() {
  return (
    <div className="container-x pb-8">
      <PageHero crumbs={[{ href: "/", label: "Home" }, { href: "/privacy", label: "Privacy" }]} eyebrow="Your data" title="Privacy" subtitle="Short version: no accounts, no selling data, and you can remove anything you gave us." hue={200} />
      <div className="prose-anime mt-8 max-w-3xl">
        <h2>What stays in your browser</h2>
        <p>My list, your watch progress, theme and spoiler settings are saved in your own browser (local storage). They never reach our servers unless you choose to import or sign up for something.</p>
        <h2>What we store</h2>
        <ul>
          <li><strong>Ratings, reactions, hype votes and poll answers</strong>, linked to a random anonymous id kept in a cookie (<code>al_vid</code>), so you can vote once and change your mind. It isn&apos;t linked to your name or email.</li>
          <li><strong>Your email address</strong>, only if you sign up for episode alerts, a digest, a cheat sheet or guide updates, together with what you signed up for, the page you signed up on and when you agreed.</li>
          <li><strong>Partner enquiries</strong>: the details you type into the form on the Advertise page.</li>
          <li><strong>Abuse protection</strong>: a one-way, daily-changing hash of your IP address, kept for a few minutes to stop spam. We never store the IP address itself.</li>
        </ul>
        <h2>Why</h2>
        <p>To show community scores, send the emails you asked for, reply to enquiries and keep spam out. Your consent is the legal basis for emails; you can withdraw it at any time.</p>
        <h2>Who processes it</h2>
        <p>Data is stored with MongoDB Atlas. Emails are sent through an email delivery provider. Visits are measured with Google Analytics. We don&apos;t sell or rent your data.</p>
        <h2>Your choices</h2>
        <ul>
          <li>Every email has a one-click unsubscribe link.</li>
          <li>To see, correct or delete what we hold about you, reply to any of our emails or use the enquiry form on the Advertise page with the subject &ldquo;Data request&rdquo;. We respond within 30 days.</li>
          <li>Clearing your browser data removes your list and your anonymous id.</li>
        </ul>
        <h2>Retention</h2>
        <p>Email addresses are kept until you unsubscribe or ask us to delete them. Enquiries are kept for up to two years.</p>
        <p className="text-sm text-muted">Last updated 29 October 2026.</p>
      </div>
    </div>
  );
}
