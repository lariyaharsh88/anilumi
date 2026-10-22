import JsonLd from "./JsonLd";

export type FaqItem = { q: string; a: string };

export default function Faq({ items, title = "Frequently asked questions" }: { items: FaqItem[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section className="mt-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <h2 className="h-section mb-4">{title}</h2>
      <div className="space-y-3">
        {items.map((f) => (
          <details key={f.q} className="card group p-4">
            <summary className="cursor-pointer list-none font-semibold text-ink">{f.q}</summary>
            <p className="mt-2 text-sm leading-6 text-ink/80">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
