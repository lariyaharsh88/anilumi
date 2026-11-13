import Link from "@/components/Link";
import { characterDeep } from "@/lib/chardeep";

/** Qualities and lessons up front; backstory and the full journey behind spoiler toggles. */
export default function CharacterDeepProfile({ slug, name }: { slug: string; name: string }) {
  const d = characterDeep(slug);
  if (!d) return null;
  return (
    <section className="reveal mt-10 space-y-5" aria-labelledby="deep-h">
      <h2 id="deep-h" className="h-section">{name}: qualities, backstory and journey</h2>
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">What defines {name}</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {d.qualities.map((q) => (
            <li key={q.trait} className="card p-3">
              <p className="font-semibold text-ink">{q.trait}</p>
              <p className="mt-1 text-sm text-ink/85">{q.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-ink">{name}&apos;s backstory <span className="text-sm font-normal text-muted">(spoilers, tap to read)</span></summary>
        <p className="prose-anime mt-3">{d.backstory}</p>
      </details>
      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-ink">{name}&apos;s journey, arc by arc <span className="text-sm font-normal text-muted">(full spoilers, tap to read)</span></summary>
        <ol className="mt-3 space-y-3 border-l border-line pl-4">
          {d.journey.map((j) => (
            <li key={j.stage}>
              <p className="text-sm font-semibold text-ink">{j.stage}</p>
              <p className="text-sm text-ink/85">{j.summary}</p>
            </li>
          ))}
        </ol>
      </details>
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">What you can learn from {name}</h3>
        <ul className="space-y-2">
          {d.lessons.map((l) => (
            <li key={l.lesson} className="card p-3">
              <p className="font-semibold text-ink">{l.lesson}</p>
              <p className="mt-1 text-sm text-ink/85">{l.why}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">AniLumi&apos;s take, drawn from what {name} does in the story; facts checked against {d.sources.length} sources. <Link href="/how-we-check" className="underline">How we check</Link></p>
      </div>
    </section>
  );
}
