import Link from "@/components/Link";
import { characterDeep, bySpoiler, type EpisodeRef } from "@/lib/chardeep";
import { animePath, episodePath } from "@/lib/kitsu";

const epHref = (e: EpisodeRef) => (e.episode ? episodePath({ slug: e.animeSlug }, e.episode) : animePath({ slug: e.animeSlug }));
const Spoilers = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <details className="card mt-2 p-3">
    <summary className="cursor-pointer text-sm font-semibold text-ink">{label} <span className="font-normal text-muted">(spoilers, tap to read)</span></summary>
    <div className="mt-2">{children}</div>
  </details>
);
const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">{children}</h3>;

/**
 * The deep profile, in the order people read a character: what defines them, who they're tied to, how strong they
 * are, their best fights and key episodes, then backstory and journey (spoilers), ages over the story and lessons.
 */
export default function CharacterDeepProfile({ slug, name }: { slug: string; name: string }) {
  const d = characterDeep(slug);
  if (!d) return null;
  const rel = bySpoiler(d.relationships), fights = bySpoiler(d.fights), eps = bySpoiler(d.keyEpisodes), ages = bySpoiler(d.ages);
  const relItem = (r: NonNullable<typeof d.relationships>[number]) => (
    <li key={r.name} className="card p-3">
      <p className="font-semibold text-ink">{r.slug ? <Link href={`/character/${r.slug}`} className="hover:text-violet-2">{r.name}</Link> : r.name} <span className="text-xs font-normal text-muted">· {r.relation}</span></p>
      <p className="mt-1 text-sm text-ink/85">{r.detail}</p>
    </li>
  );
  const fightItem = (f: NonNullable<typeof d.fights>[number]) => (
    <li key={f.title} className="card p-3">
      <p className="font-semibold text-ink">{f.title}</p>
      <p className="mt-1 text-sm text-ink/85">{f.summary} <Link href={epHref(f)} className="text-violet hover:underline">{f.episode ? `Episode ${f.episode} →` : "Watch →"}</Link></p>
    </li>
  );
  const epItem = (e: NonNullable<typeof d.keyEpisodes>[number]) => (
    <li key={`${e.animeSlug}-${e.episode}`} className="flex gap-3 text-sm">
      <Link href={epHref(e)} className="shrink-0 font-semibold text-violet hover:underline">{e.episode ? `Ep ${e.episode}` : "Watch"}</Link>
      <span className="text-ink/85">{e.why}</span>
    </li>
  );
  const ageItem = (a: NonNullable<typeof d.ages>[number]) => <li key={a.when} className="flex justify-between gap-4 py-1.5 text-sm"><span className="text-muted">{a.when}</span><span className="font-medium text-ink">{a.age}</span></li>;
  return (
    <section className="reveal mt-10 space-y-6" aria-labelledby="deep-h">
      <h2 id="deep-h" className="h-section">{name}: qualities, relationships and journey</h2>
      <div>
        <H3>What defines {name}</H3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {d.qualities.map((q) => <li key={q.trait} className="card p-3"><p className="font-semibold text-ink">{q.trait}</p><p className="mt-1 text-sm text-ink/85">{q.detail}</p></li>)}
        </ul>
      </div>
      {(rel.open.length > 0 || rel.hidden.length > 0) && (
        <div>
          <H3>{name}&apos;s relationships</H3>
          {rel.open.length > 0 && <ul className="grid gap-3 sm:grid-cols-2">{rel.open.map(relItem)}</ul>}
          {rel.hidden.length > 0 && <Spoilers label="More relationships"><ul className="grid gap-3 sm:grid-cols-2">{rel.hidden.map(relItem)}</ul></Spoilers>}
        </div>
      )}
      {d.strength && (
        <div>
          <H3>How strong is {name}?</H3>
          {d.strength.spoiler
            ? <Spoilers label={d.strength.rank}><p className="text-sm text-ink/85">{d.strength.summary}</p></Spoilers>
            : <div className="card p-3"><p className="font-semibold text-ink">{d.strength.rank}</p><p className="mt-1 text-sm text-ink/85">{d.strength.summary}</p></div>}
        </div>
      )}
      {(fights.open.length > 0 || fights.hidden.length > 0) && (
        <div>
          <H3>{name}&apos;s best fights and moments</H3>
          {fights.open.length > 0 && <ul className="grid gap-3 sm:grid-cols-2">{fights.open.map(fightItem)}</ul>}
          {fights.hidden.length > 0 && <Spoilers label={`${fights.hidden.length} later fights and moments`}><ul className="grid gap-3 sm:grid-cols-2">{fights.hidden.map(fightItem)}</ul></Spoilers>}
        </div>
      )}
      {(eps.open.length > 0 || eps.hidden.length > 0) && (
        <div>
          <H3>Key episodes for {name}</H3>
          {eps.open.length > 0 && <ul className="card space-y-2 p-3">{eps.open.map(epItem)}</ul>}
          {eps.hidden.length > 0 && <Spoilers label="Later turning points"><ul className="space-y-2">{eps.hidden.map(epItem)}</ul></Spoilers>}
        </div>
      )}
      <Spoilers label={`${name}'s backstory`}><p className="prose-anime">{d.backstory}</p></Spoilers>
      <Spoilers label={`${name}'s journey, arc by arc`}>
        <ol className="space-y-3 border-l border-line pl-4">{d.journey.map((j) => <li key={j.stage}><p className="text-sm font-semibold text-ink">{j.stage}</p><p className="text-sm text-ink/85">{j.summary}</p></li>)}</ol>
      </Spoilers>
      {(ages.open.length > 0 || ages.hidden.length > 0) && (
        <div>
          <H3>How old is {name} across the story?</H3>
          {ages.open.length > 0 && <ul className="card divide-y divide-line/60 px-3">{ages.open.map(ageItem)}</ul>}
          {ages.hidden.length > 0 && <Spoilers label="Ages later in the story"><ul className="divide-y divide-line/60">{ages.hidden.map(ageItem)}</ul></Spoilers>}
        </div>
      )}
      <div>
        <H3>What you can learn from {name}</H3>
        <ul className="space-y-2">{d.lessons.map((l) => <li key={l.lesson} className="card p-3"><p className="font-semibold text-ink">{l.lesson}</p><p className="mt-1 text-sm text-ink/85">{l.why}</p></li>)}</ul>
        <p className="mt-2 text-xs text-muted">AniLumi&apos;s take, drawn from what {name} does in the story; facts checked against {d.sources.length} sources. <Link href="/how-we-check" className="underline">How we check</Link></p>
      </div>
    </section>
  );
}
