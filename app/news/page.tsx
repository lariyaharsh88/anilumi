import type { Metadata } from "next";
import { getNews } from "@/lib/news";
import PageHero from "@/components/PageHero";
import NewsList from "@/components/NewsList";
import LeadForm from "@/components/LeadForm";
import { dbEnabled } from "@/lib/db";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: "Anime News Today – Latest Announcements, Trailers & Casting",
  description: "The latest anime news, updated hourly: new season announcements, trailers, casting and release dates, with links to each show's AniLumi page.",
  alternates: { canonical: "/news" },
};

export default async function NewsPage() {
  const items = await getNews();
  const categories = [...new Set(items.map((n) => n.category))];
  const linked = items.filter((n) => n.anime.length).length;
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/news", label: "Anime news" }]}
        eyebrow="📰 Updated hourly"
        title={<>Latest anime <span className="text-gradient">news</span></>}
        subtitle="Announcements, trailers, casting and release dates from across the anime world. Headlines open the full story at the original outlet; shows we track link to their AniLumi page."
        facts={items.length ? [{ value: String(items.length), label: "latest stories" }, { value: String(categories.length), label: "categories" }, { value: String(linked), label: "linked to AniLumi" }] : undefined}
        hue={20}
      />
      <div className="mt-10 max-w-3xl">
        {items.length ? <NewsList items={items} /> : <p className="card p-8 text-center text-muted">News is taking a moment to load. Check back shortly.</p>}
        {dbEnabled() && <LeadForm className="mt-8" kind="digest" source="news-digest" title="📰 The week's anime news, every Friday" blurb="The biggest stories plus new episodes and premieres, in one short email." button="Subscribe" />}
        <p className="mt-6 text-xs text-muted">News from <a href="https://www.animenewsnetwork.com" target="_blank" rel="noopener" className="underline">Anime News Network</a> and <a href="https://myanimelist.net/news" target="_blank" rel="noopener" className="underline">MyAnimeList</a>. Headlines and summaries belong to their publishers; every story links to the original article.</p>
      </div>
    </div>
  );
}
