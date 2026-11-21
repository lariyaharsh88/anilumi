import Image from "next/image";
import Link from "@/components/Link";
import { characterDeep, bySpoiler, type EpisodeRef } from "@/lib/chardeep";
import { characterBounties, bountyFigure, type Bounty } from "@/lib/bounties";
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
    ...(d.latest ? [{ id: "latest", label: d.latest.nav }] : []),
    ...(d.strength ? [{ id: "strength", label: "Strength" }] : []),
    ...(d.fights?.length ? [{ id: "fights", label: "Best fights" }] : []),
    ...(d.keyEpisodes?.length ? [{ id: "episodes", label: "Key episodes" }] : []),
    ...(d.ages?.length ? [{ id: "ages", label: "Age" }] : []),
    { id: "spoilers", label: "Backstory & journey" },
    { id: "lessons", label: "Lessons" },
  ];
}

/**
 * The deep profile, in the order people read a character: what defines them, who they're tied to, how strong they
 * are, their best fights and key episodes, their age through the story, then a spoiler zone (backstory, journey) and lessons.
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
      {d.latest && (
        <Block id="latest" icon="🆕" title={d.latest.title}>
          {d.latest.spoiler
            ? <Spoilers label={d.latest.nav}><p className="text-sm leading-6 text-ink/85">{d.latest.answer}</p></Spoilers>
            : <div className="card p-4"><p className="text-sm leading-6 text-ink/85">{d.latest.answer}</p></div>}
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
      {(ages.open.length > 0 || ages.hidden.length > 0) && (
        // "eren yeager age": its own section, the age at the start first and later ages behind a spoiler toggle.
        <Block id="ages" icon="🎂" title={`${name}'s age through the story`}>
          {ages.open[0] && <p className="mb-3 text-sm text-ink/90">How old is {name}? <strong className="text-ink">{ages.open[0].age}</strong>, as of {ages.open[0].when}.{ages.hidden.length ? " Later ages are under the spoiler toggle." : ""}</p>}
          {ages.open.length > 0 && <ul className="card divide-y divide-line/60 px-3">{ages.open.map(ageItem)}</ul>}
          {ages.hidden.length > 0 && <Spoilers label={`${ages.hidden.length === 1 ? "Age" : "Ages"} later in the story`}><ul className="divide-y divide-line/60">{ages.hidden.map(ageItem)}</ul></Spoilers>}
        </Block>
      )}
      <Block id="spoilers" icon="🔒" title={`${name}'s backstory and journey`}>
        <div className="card p-4">
          <p className="text-sm text-muted">Everything here spoils the story. Open only what you want to read.</p>
          <Spoilers label="Backstory"><p className="prose-anime">{d.backstory}</p></Spoilers>
          <Spoilers label={`Journey, arc by arc (${d.journey.length} stages)`}>
            <ol className="space-y-3 border-l-2 border-violet/40 pl-4">{d.journey.map((j, i) => <li key={j.stage}><p className="text-sm font-semibold text-ink"><span className="mr-1.5 text-muted">{i + 1}.</span>{j.stage}</p><p className="text-sm text-ink/85">{j.summary}</p></li>)}</ol>
          </Spoilers>
        </div>
      </Block>
      <Block id="lessons" icon="💡" title={`What you can learn from ${name}`}>
        <ul className="grid gap-3 sm:grid-cols-2">{d.lessons.map((l) => <li key={l.lesson} className="card p-3"><p className="font-semibold text-ink">{l.lesson}</p><p className="mt-1 text-sm text-ink/85">{l.why}</p></li>)}</ul>
        <p className="mt-2 text-xs text-muted">AniLumi&apos;s take, drawn from what {name} does in the story; facts checked against {d.sources.length} sources. <Link href="/how-we-check" className="underline">How we check</Link></p>
      </Block>
    </>
  );
}

/** Which jump-bar entry the bounty block adds. */
export const bountySection = (slug: string) => (characterBounties(slug) ? [{ id: "bounty", label: "Bounty" }] : []);

/** One Piece bounty ("luffy bounty", "zoro wanted poster"): the current poster drawn in our own style, then every bounty in order. */
export function CharacterBounty({ slug, name: pageName }: { slug: string; name: string }) {
  const b = characterBounties(slug);
  if (!b?.entries.length) return null;
  const name = b.name ?? pageName;
  const list = bySpoiler(b.entries), current = b.entries[b.entries.length - 1], me = snapByPage(slug), face = me ? snapImage(me) : null;
  const rises = b.entries.length - 1;
  const item = (x: Bounty) => (
    <li key={x.amount} className="flex items-start gap-3 py-2 text-sm">
      <span className="w-36 shrink-0 font-bold tabular-nums text-ink">฿{bountyFigure(x.amount)}</span>
      <span className="text-ink/85"><span className="font-semibold text-ink">{x.arc}.</span> {x.why}{x.chapter || x.episode ? <span className="text-muted"> ({[x.chapter && `chapter ${x.chapter}`, x.episode && `episode ${x.episode}`].filter(Boolean).join(", ")})</span> : null}</span>
    </li>
  );
  return (
    <Block id="bounty" icon="💰" title={`${name}'s bounty and wanted poster`}>
      <div className="grid gap-5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-start">
        <figure className="mx-auto w-52 rounded-sm bg-[#efe2c0] p-3 text-center text-[#3b2a1a] shadow-lg shadow-black/30 ring-1 ring-[#c9b48a]" aria-label={`Wanted poster: ${name}, ${bountyFigure(current.amount)} berries`}>
          <p className="font-serif text-3xl font-black tracking-[0.2em]">WANTED</p>
          <div className="relative mx-auto mt-2 aspect-[4/3] w-full overflow-hidden border-2 border-[#3b2a1a] bg-[#d9c79d]">{face && <Image src={face} alt={`${name} on the wanted poster`} fill sizes="200px" className="object-cover object-top sepia-[.35]" />}</div>
          <p className="mt-2 text-[11px] font-bold tracking-[0.3em]">{current.poster ?? "DEAD OR ALIVE"}</p>
          <p className="mt-1 font-serif text-lg font-black uppercase leading-tight">{name}</p>
          <p className="mt-1 font-serif text-lg font-black tabular-nums">฿{bountyFigure(current.amount)}-</p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.4em]">MARINE</p>
        </figure>
        <div>
          <p className="text-sm text-ink/90">
            {b.final
              ? <>{name}&apos;s final bounty was <strong className="text-ink">{bountyFigure(current.amount)} berries</strong>, in force at the time of the {current.arc} arc.</>
              : <>{name}&apos;s bounty is <strong className="text-ink">{bountyFigure(current.amount)} berries</strong>, since the {current.arc} arc.</>}
            {rises > 0 && ` It has risen ${rises} ${rises === 1 ? "time" : "times"} since the first poster; the later bounties are under the spoiler toggle, because each one names a defeated enemy.`}
          </p>
          {list.open.length > 0 && <ul className="card mt-3 divide-y divide-line/60 px-3">{list.open.map(item)}</ul>}
          {list.hidden.length > 0 && <Spoilers label={`${list.hidden.length} later ${list.hidden.length === 1 ? "bounty" : "bounties"}`}><ul className="divide-y divide-line/60">{list.hidden.map(item)}</ul></Spoilers>}
          <p className="mt-2 text-xs text-muted">Each amount checked against two sources; the poster is AniLumi&apos;s own drawing of the design.</p>
        </div>
      </div>
    </Block>
  );
}
