import Link from "@/components/Link";
import JsonLd from "./JsonLd";
import { abs } from "@/lib/site";

export default function Breadcrumbs({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.label, item: abs(it.href) })),
        }}
      />
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={it.href} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>›</span>}
            {i === items.length - 1 ? <span className="text-ink/80">{it.label}</span> : <Link href={it.href} className="hover:text-ink">{it.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
