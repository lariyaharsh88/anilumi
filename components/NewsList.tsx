import Link from "@/components/Link";
import type { NewsItem } from "@/lib/news";

const timeAgo = (iso: string, now = Date.now()) => {
  const m = Math.round((now - Date.parse(iso)) / 60000);
  if (!iso || Number.isNaN(m)) return "";
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 24 * 60) return `${Math.round(m / 60)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/** Headlines link to Anime News Network; anime they mention link to AniLumi pages. */
export default function NewsList({ items, compact = false }: { items: NewsItem[]; compact?: boolean }) {
  return (
    <ul className={compact ? "divide-y divide-line" : "space-y-3"}>
      {items.map((n) => (
        <li key={n.id} className={compact ? "py-3" : "card p-4 transition hover:border-white/20"}>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-semibold uppercase tracking-wide">{n.category}</span>
            <time dateTime={n.date}>{timeAgo(n.date)}</time>
          </p>
          <a href={n.url} target="_blank" rel="noopener" className={`mt-1 block font-semibold leading-snug text-ink hover:text-violet-2 ${compact ? "text-[15px]" : "text-base sm:text-lg"}`}>{n.title}</a>
          {!compact && n.summary && <p className="mt-1 text-sm text-ink/70">{n.summary}</p>}
          {n.anime.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-2">
              {n.anime.map((a) => <Link key={a.slug} href={`/anime/${a.slug}`} className="chip text-xs">On AniLumi: {a.title}</Link>)}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
