import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { site, abs } from "@/lib/site";
import { AUTHOR, AUTHOR_ID } from "@/lib/author";
import { ORG_ID } from "@/lib/ld";
import { checkedGuides } from "@/lib/checked";
import { WATCHED_COUNT, watchedList } from "@/lib/editor";

export const metadata: Metadata = {
  title: `${AUTHOR.name}, who checks AniLumi's guides`,
  description: `${AUTHOR.name} runs ${site.name} and checks its watch orders, filler lists and editor's notes by hand. Every guide checked so far, with dates.`,
  alternates: { canonical: AUTHOR.path },
};

const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Author profile: who checks the guides (ProfilePage + Person, the @id every guide's reviewedBy points to). */
export default function AuthorPage() {
  const guides = checkedGuides();
  const latest = guides[0]?.date;
  const ld = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": abs(AUTHOR.path),
    url: abs(AUTHOR.path),
    name: `${AUTHOR.name} on ${site.name}`,
    ...(latest ? { dateModified: latest } : {}),
    isPartOf: { "@id": `${site.url}/#website` },
    mainEntity: {
      "@type": "Person",
      "@id": AUTHOR_ID,
      name: AUTHOR.name,
      url: abs(AUTHOR.path),
      sameAs: [AUTHOR.home],
      description: `Anime fan from India who runs ${site.name} and checks its watch orders, filler lists and editor's notes.`,
      knowsAbout: ["Anime", "Anime watch orders", "Filler episodes", "Anime streaming in India"],
      worksFor: { "@id": ORG_ID },
    },
  };
  return (
    <div className="container-x pb-8">
      <JsonLd data={ld} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/about", label: "About" }, { href: AUTHOR.path, label: AUTHOR.name }]}
        eyebrow="Who checks the guides"
        title={<span className="text-gradient">{AUTHOR.name}</span>}
        subtitle={`Runs ${site.name} and checks its guides by hand.`}
        hue={262}
      />
      <div className="prose-anime mt-8 max-w-3xl">
        <p>I&apos;m {AUTHOR.name}, an anime fan from India who has watched {WATCHED_COUNT} series so far, short and long (the full list is below). I started {site.name} because the answers fans need most, like which order to watch a franchise in, which episodes are filler and where the manga picks up, are scattered across forums and wikis, and often out of date.</p>
        <h2>What I check</h2>
        <ul>
          <li><strong>Watch orders:</strong> that the order makes sense for a first-time viewer, which movies and OVAs belong where, and what is safe to skip.</li>
          <li><strong>Editor&apos;s notes:</strong> the short &ldquo;AniLumi&apos;s take&rdquo; on a show, where to start and what to watch next.</li>
          <li><strong>Filler lists:</strong> the episode numbers against published filler guides.</li>
        </ul>
        <p>A guide I&apos;ve checked says &ldquo;Checked by {AUTHOR.name}&rdquo; with the date. Everything else is marked as a draft. <Link href="/how-we-check">How guides are made and checked</Link> explains both.</p>
        <h2>Guides I&apos;ve checked</h2>
      </div>
      {guides.length ? (
        <ul className="mt-3 grid max-w-3xl gap-2 sm:grid-cols-2">
          {guides.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className="card flex items-baseline justify-between gap-3 px-3 py-2 text-sm transition hover:border-violet/60">
                <span className="min-w-0"><span className="block font-medium text-ink">{g.title}</span><span className="text-xs text-muted">{g.kind}</span></span>
                <time dateTime={g.date} className="shrink-0 text-xs tabular-nums text-muted">{fmt(g.date)}</time>
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-muted">None yet.</p>}
      <div className="prose-anime mt-8 max-w-3xl">
        <h2>Anime I&apos;ve watched ({WATCHED_COUNT})</h2>
        <p>One entry per series, from my own list. Pages for these shows carry a &ldquo;✓ Harsh has watched this series&rdquo; mark, so you can tell which guides come from first-hand viewing.</p>
      </div>
      <ul className="mt-3 flex max-w-3xl flex-wrap gap-1.5">
        {watchedList().map((w) => <li key={w.slug}><Link href={`/anime/${w.slug}`} className="chip text-xs">{w.title}</Link></li>)}
      </ul>
      <div className="prose-anime mt-8 max-w-3xl">
        <h2>Elsewhere</h2>
        <p>My own site: <a href={AUTHOR.home} rel="me noopener">{AUTHOR.home.replace(/^https?:\/\//, "")}</a>. Spotted a mistake in a guide? <Link href="/contact">Tell me</Link>, or use the &ldquo;Spotted a mistake?&rdquo; link on any page.</p>
      </div>
    </div>
  );
}
