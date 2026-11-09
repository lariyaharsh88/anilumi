import AmazonLink from "@/components/AmazonLink";
import AffiliateNote from "@/components/AffiliateNote";

/**
 * Compact Amazon merch row (figures, posters, apparel, manga). Every link is store-aware (AmazonLink: amazon.in for
 * India, amazon.com elsewhere) and AffiliateNote also loads OneLink, which sends other countries' amazon.com clicks
 * to their own store.
 */
export default function MerchBlock({ name, show, source, manga = true, className = "" }: { name: string; show?: string | null; source: string; manga?: boolean; className?: string }) {
  const franchise = show || name;
  return (
    <section className={`card p-4 ${className}`} aria-label={`${name} figures and merch`}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{name} figures &amp; merch</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <AmazonLink query={`${name}${show && show !== name ? ` ${show}` : ""} figure`} dept="toys" source={`${source}-figure`} className="btn-outline">🧸 {name} figures</AmazonLink>
        <AmazonLink query={`${franchise} poster`} dept="all" source={`${source}-poster`} className="btn-outline">🖼️ {franchise} posters</AmazonLink>
        <AmazonLink query={`${franchise} t-shirt`} dept="all" source={`${source}-apparel`} className="btn-outline">👕 {franchise} apparel</AmazonLink>
        {manga && <AmazonLink query={`${franchise} manga`} source={`${source}-manga`} className="btn-outline">📚 {franchise} manga</AmazonLink>}
      </div>
      <AffiliateNote className="mt-2" />
    </section>
  );
}
