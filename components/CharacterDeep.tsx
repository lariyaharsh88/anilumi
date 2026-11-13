import Image from "next/image";
import Link from "@/components/Link";
import { characterDeep, bySpoiler, type EpisodeRef } from "@/lib/chardeep";
import { snapByPage, snapImage } from "@/lib/charsnap";
import { animePath, episodePath } from "@/lib/kitsu";

const epHref = (e: EpisodeRef) => (e.episode ? episodePath({ slug: e.animeSlug }, e.episode) : animePath({ slug: e.animeSlug }));

/** A spoiler toggle that reads as one: dashed border and a lock, the label never giving the spoiler away. */
const Spoilers = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <details className="group mt-3 rounded-xl border border-dashed border-line bg-white/[.02] p-3 open:border-solid open:bg-white/[.03]">
    <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
      <span aria-hidden className="mr-1.5">🔒</span>{label} <span className="font-normal text-muted group-open:hidden">· spoilers, tap to show</span>
    </summary>
    <div className="mt-3">{children}</div>
  </details>
);

/** One profile block: icon, heading (a jump target) and content. */
const Block = ({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) => (
  <section id={id} data-section className="reveal pt-10" aria-labelledby={`${id}-h`}>
    <h2 id={`${id}-h`} className="h-section mb-3"><span aria-hidden className="mr-2">{icon}</span>{title}</h2>
    {children}
  </section>
);

/** Which profile blocks a character has, for the page's "jump to" bar. */
export function deepSections(slug: string): { id: string; label: string }[] {
  const d = characterDeep(slug);
  if (!d) return [];
  return [
    { id: "qualities", label: "Qualities" },
    ...(d.relationships?.length ? [{ id: "relationships", label: "Relationships" }] : []),
    ...(d.strength ? [{ id: "strength", label: "Strength" }] : []),
    ...(d.fights?.length ? [{ id: "fights", label: "Best fights" }] : []),
    ...(d.keyEpisodes?.length ? [{ id: "episodes", label: "Key episodes" }] : []),
    { id: "spoilers", label: "Backstory & journey" },
    { id: "lessons", label: "Lessons" },
  ];
}

/**
 * The deep profile, in the order people read a character: what defines them, who they're tied to, how strong they
 * are, their best fights and key episodes, then a spoiler zone (backstory, journey, later ages) and lessons.
 */
export default function CharacterDeepProfile({ slug, name }: { slug: string; name: string }) {
  const d = characterDeep(slug);
  if (!d) return null;
  const rel = bySpoiler(d.relationships), fights = bySpoiler(d.fights), eps = bySpoiler(d.keyEpisodes), ages = bySpoiler(d.ages);
  const relItem = (r: NonNullable<typeof d.relationships>[number]) => {
    const snap = r.slug ? snapByPage(r.slug) : null;
    const img = snap ? snapImage(snap) : null;
    const body = (
      <>
        <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-bg-2">{img && <Image src={img} alt={r.name} fill sizes="48px" className="object-cover object-top" />}</span>
        <span className="min-w-0">
          <span className="block font-semibold text-ink group-hover:text-violet-2">{r.name}</span>
          <span className="block text-[11px] font-medium uppercase tracking-wide text-accent-2">{r.relation}</span>
          <span className="mt-1 block text-sm text-ink/85">{r.detail}</span>
        </span>
      </>
    );
    return <li key={r.name}>{r.slug ? <Link href={`/character/${r.slug}`} className="card group flex gap-3 p-3 transition hover:border-violet/60">{body}</Link> : <div className="card flex gap-3 p-3">{body}</div>}</li>;
  };
  const fightItem = (f: NonNullable<typeof d.fights>[number]) => (
    <li key={f.title} className="card flex flex-col p-3">
      <p className="font-semibold text-ink">{f.title}</p>
      <p className="mt-1 flex-1 text-sm text-ink/85">{f.summary}</p>
      <Link href={epHref(f)} className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-violet/15 px-2.5 py-0.5 text-xs font-semibold text-violet-2 hover:bg-violet/25">▶ {f.episode ? `Episode ${f.episode}` : "Watch"}</Link>
    </li>
  );
  const epItem = (e: NonNullable<typeof d.keyEpisodes>[number]) => (
    <li key={`${e.animeSlug}-${e.episode}`} className="flex items-start gap-3 py-2 text-sm">
      <Link href={epHref(e)} className="w-14 shrink-0 rounded-md bg-violet/15 px-2 py-0.5 text-center text-xs font-bold text-violet-2 hover:bg-violet/25">{e.episode ? `Ep ${e.episode}` : "Watch"}</Link>
      <span className="text-ink/85">{e.why}</span>
    </li>
  );
  const ageItem = (a: NonNullable<typeof d.ages>[number]) => <li key={a.when} className="flex justify-between gap-4 py-2 text-sm"><span className="text-muted">{a.when}</span><span className="font-semibold text-ink">{a.age}</span></li>;
  return (
    <>
      <Block id="qualities" icon="✨" title={`What defines ${name}`}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {d.qualities.map((q) => <li key={q.trait} className="card border-l-2 border-l-violet/60 p-3"><p className="font-semibold text-ink">{q.trait}</p><p className="mt-1 text-sm text-ink/85">{q.detail}</p></li>)}
        </ul>
      </Block>
      {(rel.open.length > 0 || rel.hidden.length > 0) && (
        <Block id="relationships" icon="🤝" title={`${name}'s relationships`}>
          {rel.open.length > 0 && <ul className="grid gap-3 sm:grid-cols-2">{rel.open.map(relItem)}</ul>}
          {rel.hidden.length > 0 && <Spoilers label={`${rel.hidden.length} more relationships`}><ul className="grid gap-3 sm:grid-cols-2">{rel.hidden.map(relItem)}</ul></Spoilers>}
        </Block>
      )}
      {d.strength && (
        <Block id="strength" icon="💪" title={`How strong is ${name}?`}>
          {d.strength.spoiler
            ? <Spoilers label={`${name}'s power and rank`}><p className="font-semibold text-ink">{d.strength.rank}</p><p className="mt-1 text-sm text-ink/85">{d.strength.summary}</p></Spoilers>
            : <div className="card p-4"><p className="text-lg font-bold text-ink">{d.strength.rank}</p><p className="mt-1 text-sm text-ink/85">{d.strength.summary}</p></div>}
        </Block>
      )}
      {(fights.open.length > 0 || fights.hidden.length > 0) && (
        <Block id="fights" icon="⚔️" title={`${name}'s best fights and moments`}>
          {fights.open.length > 0 && <ul className="grid gap-3 sm:grid-cols-2">{fights.open.map(fightItem)}</ul>}
          {fights.hidden.length > 0 && <Spoilers label={`${fights.hidden.length} later fights and moments`}><ul className="grid gap-3 sm:grid-cols-2">{fights.hidden.map(fightItem)}</ul></Spoilers>}
        </Block>
      )}
      {(eps.open.length > 0 || eps.hidden.length > 0) && (
        <Block id="episodes" icon="📺" title={`Key episodes for ${name}`}>
          {eps.open.length > 0 && <ul className="card divide-y divide-line/60 px-3">{eps.open.map(epItem)}</ul>}
          {eps.hidden.length > 0 && <Spoilers label={`${eps.hidden.length} later turning points`}><ul className="divide-y divide-line/60">{eps.hidden.map(epItem)}</ul></Spoilers>}
        </Block>
      )}
      <Block id="spoilers" icon="🔒" title={`${name}'s backstory and journey`}>
        <div className="card p-4">
          <p className="text-sm text-muted">Everything here spoils the story. Open only what you want to read.</p>
          <Spoilers label="Backstory"><p className="prose-anime">{d.backstory}</p></Spoilers>
          <Spoilers label={`Journey, arc by arc (${d.journey.length} stages)`}>
            <ol className="space-y-3 border-l-2 border-violet/40 pl-4">{d.journey.map((j, i) => <li key={j.stage}><p className="text-sm font-semibold text-ink"><span className="mr-1.5 text-muted">{i + 1}.</span>{j.stage}</p><p className="text-sm text-ink/85">{j.summary}</p></li>)}</ol>
          </Spoilers>
          {ages.hidden.length > 0 && <Spoilers label="Ages later in the story"><ul className="divide-y divide-line/60">{ages.hidden.map(ageItem)}</ul></Spoilers>}
        </div>
        {ages.open.length > 0 && (
          <div className="mt-4"><p className="mb-1 text-sm font-semibold text-ink">How old is {name}?</p><ul className="card divide-y divide-line/60 px-3">{ages.open.map(ageItem)}</ul></div>
        )}
      </Block>
      <Block id="lessons" icon="💡" title={`What you can learn from ${name}`}>
        <ul className="grid gap-3 sm:grid-cols-2">{d.lessons.map((l) => <li key={l.lesson} className="card p-3"><p className="font-semibold text-ink">{l.lesson}</p><p className="mt-1 text-sm text-ink/85">{l.why}</p></li>)}</ul>
        <p className="mt-2 text-xs text-muted">AniLumi&apos;s take, drawn from what {name} does in the story; facts checked against {d.sources.length} sources. <Link href="/how-we-check" className="underline">How we check</Link></p>
      </Block>
    </>
  );
}
