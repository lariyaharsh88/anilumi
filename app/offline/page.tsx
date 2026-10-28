import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = { title: "You're offline", robots: { index: false, follow: false } };

/** Served by the service worker (public/sw.js) when a page isn't cached and there is no network. */
export default function Offline() {
  return (
    <div className="container-x pb-8">
      <PageHero eyebrow="📴 No connection" title="You're offline" subtitle="This page hasn't been saved on this device yet. Your list and the pages you opened recently still work without a connection." hue={220} />
      <p className="mt-8 flex flex-wrap gap-3">
        <Link href="/my" className="btn-primary">Open My list</Link>
        <Link href="/" className="btn-outline">Try the home page</Link>
      </p>
    </div>
  );
}
