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
        <p>My list, your watch progress, theme and spoiler settings are saved in your own browser (local storage). Your list reaches our servers only if you turn on sync; settings never do.</p>
        <h2>What we store</h2>
        <ul>
          <li><strong>Ratings, reactions, hype votes and poll answers</strong>, linked to a random anonymous id kept in a cookie (<code>al_vid</code>), so you can vote once and change your mind. It isn&apos;t linked to your name or email.</li>
          <li><strong>Your synced list</strong>, only if you turn on sync on My list: the shows, progress and list status, stored under a private code. We keep only a one-way hash of the code, so the code itself is never stored. Delete the synced copy from My list at any time.</li>
          <li><strong>Your email address</strong>, only if you sign up for episode alerts, a digest, a cheat sheet or guide updates, together with what you signed up for, the page you signed up on and when you agreed. Alerts for your whole list are linked to your synced list (by its hash, not the code), so we know which shows to email you about.</li>
          <li><strong>Push alerts</strong>, only if you turn on a 🔔 alert: the address your browser gives us for sending notifications (it identifies the browser&apos;s push service, not you) and the shows or characters you follow. No name, email or IP address.</li>
          <li><strong>Partner enquiries</strong>: the details you type into the form on the Advertise page.</li>
          <li><strong>Abuse protection</strong>: a one-way, daily-changing hash of your IP address, kept for a few minutes to stop spam. We never store the IP address itself.</li>
        </ul>
        <h2>Why</h2>
        <p>To show community scores, send the emails you asked for, reply to enquiries and keep spam out. Your consent is the legal basis for emails; you can withdraw it at any time.</p>
        <h2>Who processes it</h2>
        <p>Data is stored with MongoDB Atlas. Emails are sent through Resend, and you confirm your address before we send anything else. Push alerts go through your browser&apos;s own push service (Google, Mozilla, Apple or Microsoft). Visits are measured with Google Analytics, and Microsoft Clarity records anonymised clicks, scrolling and page interactions (as heatmaps and session replays) so we can see which pages are hard to use. Clarity masks text you type. We don&apos;t sell or rent your data.</p>
        <h2>Your choices</h2>
        <ul>
          <li>Every email has a one-click unsubscribe link.</li>
          <li>Turn off a push alert by tapping its button again, or block notifications for anilumi.in in your browser; alerts to a blocked or uninstalled browser are deleted automatically.</li>
          <li>To see, correct or delete what we hold about you, reply to any of our emails or use the enquiry form on the Advertise page with the subject &ldquo;Data request&rdquo;. We respond within 30 days.</li>
          <li>Analytics: visitors in the EU, EEA, UK and Switzerland are asked first, and Google Analytics and Microsoft Clarity load only after &ldquo;Accept&rdquo;. Everyone can turn them off with &ldquo;Cookie choices&rdquo; at the bottom of every page; your choice is kept in your browser for 12 months. To decide whether to ask, we check your country once with Cloudflare and keep only the country code in your browser.</li>
          <li>Clearing your browser data removes your list and your anonymous id.</li>
        </ul>
        <h2>Retention</h2>
        <p>Email addresses are kept until you unsubscribe or ask us to delete them. Push alert addresses are kept until you turn alerts off or your browser stops accepting them. Enquiries are kept for up to two years.</p>
        <p className="text-sm text-muted">Last updated 4 November 2026.</p>
      </div>
    </div>
  );
}
