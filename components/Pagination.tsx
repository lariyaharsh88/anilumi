import Link from "next/link";

export default function Pagination({ page, total, limit, base }: { page: number; total: number; limit: number; base: string }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  const mk = (p: number) => (p === 1 ? base : `${base}${base.includes("?") ? "&" : "?"}page=${p}`);
  return (
    <nav className="mt-8 flex items-center justify-center gap-2 text-sm" aria-label="Pagination">
      {page > 1 ? <Link href={mk(page - 1)} className="btn-outline" rel="prev">← Prev</Link> : <span className="btn-outline opacity-40">← Prev</span>}
      <span className="px-3 text-muted">Page {page} of {pages}</span>
      {page < pages ? <Link href={mk(page + 1)} className="btn-outline" rel="next">Next →</Link> : <span className="btn-outline opacity-40">Next →</span>}
    </nav>
  );
}
