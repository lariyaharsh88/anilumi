import Link from "@/components/Link";
import Image from "next/image";
import { kitsuByAniListIds, animePath, type Anime } from "@/lib/kitsu";
import { vaPath, staffPath, cleanBio, type VoiceActor, type VaRole, type StaffWork } from "@/lib/anilist";
import { personFacts } from "@/lib/wikidata";
import { abs } from "@/lib/site";
import PageHero from "./PageHero";
import JsonLd from "./JsonLd";
import BarChart from "./viz/BarChart";
import Faq, { type FaqItem } from "./Faq";
import AdSlot from "./AdSlot";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const birthday = (b: VoiceActor["birth"]) => (b?.month ? `${MONTHS[b.month - 1]}${b.day ? ` ${b.day}` : ""}${b.year ? `, ${b.year}` : ""}` : null);

/** One card per character (a character voiced across seasons is one role), most popular first. */
export function signatureRoles(roles: VaRole[]) {
  const out = new Map<number, { character: VaRole["characters"][number]; media: VaRole["media"][]; role: string }>();
  for (const r of roles) for (const c of r.characters) {
    const hit = out.get(c.id);
    if (hit) hit.media.push(r.media);
    else out.set(c.id, { character: c, media: [r.media], role: r.role });
  }
  return [...out.values()];
}

/** "Director (eps 1-25)" → "Director". */
const cleanRole = (r: string) => r.replace(/\s*\(.*\)\s*$/, "").trim();
// Credits people are known for outrank frequent technical ones (a director storyboards most shows they direct).
const HEADLINE = /^(chief director|director|original creator|original story|series composition|script|music|character design|animation director)$/i;

/** Headline roles for a staff member: key credits first, then by how often they appear. Pure. */
export function mainRoles(work: StaffWork[], limit = 3): string[] {
  const count = new Map<string, number>();
  for (const w of work) for (const r of new Set(w.roles.map(cleanRole))) count.set(r, (count.get(r) || 0) + 1);
  return [...count.entries()].sort((a, b) => Number(HEADLINE.test(b[0])) - Number(HEADLINE.test(a[0])) || b[1] - a[1]).slice(0, limit).map(([r]) => r);
}

function yearSpan<T>(items: T[], year: (t: T) => number | null) {
  const byYear = new Map<number, number>();
  for (const it of items) { const y = year(it); if (y) byYear.set(y, (byYear.get(y) || 0) + 1); }
  const years = [...byYear.keys()].sort((x, y) => x - y);
  const span = years.length ? Array.from({ length: Math.min(years[years.length - 1] - years[0] + 1, 30) }, (_, i) => years[years.length - 1] - Math.min(years[years.length - 1] - years[0], 29) + i) : [];
  const busiest = [...byYear.entries()].sort((x, y) => y[1] - x[1])[0];
  return { byYear, span, busiest };
}

/** Shared page for voice actors (/voice-actor) and production staff (/staff). */
export default async function PersonProfile({ va, kind }: { va: VoiceActor; kind: "voice" | "staff" }) {
  const [kitsu, wd] = await Promise.all([kitsuByAniListIds([...va.roles.map((r) => r.media.id), ...va.work.map((w) => w.media.id)].slice(0, 120)), personFacts(va.id)]);
  const link = (m: VaRole["media"]): Anime | undefined => kitsu.get(m.id);
  const path = kind === "voice" ? vaPath(va) : staffPath(va);
  const sig = signatureRoles(va.roles);
  const mains = va.roles.filter((r) => r.role === "MAIN").length;
  const capped = va.roles.length >= 95;
  const jobs = mainRoles(va.work);
  const { text: bio, facts: bioFacts } = cleanBio(va.bio);
  const voiceYears = yearSpan(va.roles, (r) => r.media.year);
  const workYears = yearSpan(va.work, (w) => w.media.year);
  const { span, busiest, byYear } = kind === "voice" ? voiceYears : workYears;
  const born = birthday(va.birth);
  const facts = [
    born && { label: "Birthday", value: born },
    va.age && { label: "Age", value: String(va.age) },
    (va.homeTown || wd?.birthPlace) && { label: va.homeTown ? "Hometown" : "Born in", value: va.homeTown || wd!.birthPlace! },
    va.yearsActive[0] && { label: "Active since", value: String(va.yearsActive[0]) },
    va.gender && { label: "Gender", value: va.gender },
    ...bioFacts.filter((f) => !/birth|age|hometown|gender/i.test(f.label)),
  ].filter(Boolean) as { label: string; value: string }[];
  const occupation = kind === "voice" ? `${va.language ? `${va.language} ` : ""}voice actor` : (va.occupations[0] || jobs[0] || "Anime staff").toLowerCase();

  const ld = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: va.name,
    alternateName: [va.native, ...va.alternative].filter(Boolean),
    jobTitle: kind === "voice" ? "Voice actor" : va.occupations[0] || jobs[0],
    image: va.imageLarge || undefined,
    birthDate: va.birth?.year && va.birth.month && va.birth.day ? `${va.birth.year}-${String(va.birth.month).padStart(2, "0")}-${String(va.birth.day).padStart(2, "0")}` : undefined,
    award: wd?.awards.length ? wd.awards : undefined,
    url: abs(path),
    sameAs: [`https://anilist.co/staff/${va.id}`, ...(wd ? [`https://www.wikidata.org/wiki/${wd.qid}`] : []), ...(wd?.website ? [wd.website] : [])],
  };
  const topWork = va.work.slice(0, 6);
  const faq: FaqItem[] = kind === "voice"
    ? [
        { q: `What characters has ${va.name} voiced?`, a: `${va.name}'s best-known roles include ${sig.slice(0, 6).map((r) => `${r.character.name} (${r.media[0].title})`).join(", ")}. ${va.name} has voiced ${capped ? "more than 100" : va.roles.length} anime roles.` },
        ...(sig[0] ? [{ q: `What is ${va.name}'s most popular role?`, a: `${sig[0].character.name} in ${sig[0].media[0].title}, the most-watched anime ${va.name} has voiced in.` }] : []),
        ...(born ? [{ q: `When is ${va.name}'s birthday?`, a: `${va.name} was born on ${born}${va.homeTown || wd?.birthPlace ? ` in ${va.homeTown || wd!.birthPlace}` : ""}.` }] : []),
        ...(wd?.awards.length ? [{ q: `What awards has ${va.name} won?`, a: `${wd.awards.join(", ")}.` }] : []),
      ]
    : [
        { q: `What anime has ${va.name} worked on?`, a: `${va.name}'s best-known work includes ${topWork.map((w) => `${w.media.title} (${cleanRole(w.roles[0])})`).join(", ")}.` },
        ...(jobs[0] ? [{ q: `What does ${va.name} do?`, a: `${va.name} is credited most often as ${jobs.join(", ").toLowerCase()} on anime.` }] : []),
        ...(born ? [{ q: `When was ${va.name} born?`, a: `${va.name} was born on ${born}${wd?.birthPlace ? ` in ${wd.birthPlace}` : ""}.` }] : []),
        ...(wd?.awards.length ? [{ q: `What awards has ${va.name} won?`, a: `${wd.awards.join(", ")}.` }] : []),
      ];

  const workList = (items: StaffWork[]) => (
    <ol className="card divide-y divide-line">
      {[...items].sort((x, y) => (y.media.year || 0) - (x.media.year || 0) || y.media.popularity - x.media.popularity).map((w) => {
        const k = link(w.media);
        return (
          <li key={w.media.id} className="flex items-center gap-3 p-2.5 text-sm">
            <span className="w-10 shrink-0 text-xs tabular-nums text-muted">{w.media.year || "TBA"}</span>
            <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-bg-2">{w.media.cover && <Image src={w.media.cover} alt="" fill sizes="36px" className="object-cover" />}</span>
            <span className="min-w-0 flex-1">
              {k ? <Link href={animePath(k)} className="block truncate font-medium text-ink hover:text-violet-2">{w.media.title}</Link> : <span className="block truncate font-medium text-ink">{w.media.title}</span>}
              <span className="block truncate text-xs text-muted">{[...new Set(w.roles.map(cleanRole))].join(", ")}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="container-x pb-8">
      <JsonLd data={ld} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, kind === "voice" ? { href: "/voice-actors", label: "Voice actors" } : { href: "/lists", label: "Anime staff" }, { href: path, label: va.name }]}
        eyebrow={`${kind === "voice" ? "🎙️" : "🎬"} ${occupation}`}
        title={<>{va.name}{va.native && <span className="mt-1 block text-lg font-semibold text-ink/60 sm:text-xl">{va.native}</span>}</>}
        subtitle={kind === "voice"
          ? (sig.length ? <>Known for {sig.slice(0, 3).map((r, i) => <span key={r.character.id}>{i ? (i === Math.min(sig.length, 3) - 1 ? " and " : ", ") : ""}<strong className="text-ink">{r.character.name}</strong> in {r.media[0].title}</span>)}.</> : undefined)
          : (topWork.length ? <>{jobs.slice(0, 2).join(" and ")} on {topWork.slice(0, 3).map((w, i) => <span key={w.media.id}>{i ? (i === Math.min(topWork.length, 3) - 1 ? " and " : ", ") : ""}<strong className="text-ink">{w.media.title}</strong></span>)}.</> : undefined)}
        facts={kind === "voice"
          ? [
              { value: `${va.roles.length}${capped ? "+" : ""}`, label: "anime roles" },
              { value: `${mains}${capped ? "+" : ""}`, label: "main roles" },
              ...(va.yearsActive[0] ? [{ value: String(va.yearsActive[0]), label: "active since" }] : []),
              ...(busiest ? [{ value: String(busiest[0]), label: `busiest year (${busiest[1]} roles)` }] : []),
            ]
          : [
              { value: `${va.work.length}${va.work.length >= 50 ? "+" : ""}`, label: "anime credits" },
              ...(jobs[0] ? [{ value: jobs[0], label: "most credited as" }] : []),
              ...(wd?.awards.length ? [{ value: String(wd.awards.length), label: wd.awards.length === 1 ? "award" : "awards" }] : []),
              ...(busiest ? [{ value: String(busiest[0]), label: `busiest year (${busiest[1]})` }] : []),
            ]}
        hue={kind === "voice" ? 300 : 220}
        posters={[va.imageLarge]}
      >
        {va.imageLarge && <div className="relative aspect-[5/7] w-32 overflow-hidden rounded-2xl border border-white/15 shadow-2xl lg:hidden"><Image src={va.imageLarge} alt={va.name} fill sizes="128px" className="object-cover" priority /></div>}
      </PageHero>

      {kind === "voice" ? (
        <section className="reveal mt-10" aria-labelledby="sig-h">
          <h2 id="sig-h" className="h-section mb-3">Best-known roles</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sig.slice(0, 12).map((r) => {
              const k = link(r.media[0]);
              const body = (
                <>
                  <span className="relative block aspect-[5/6] overflow-hidden rounded-xl border border-line bg-bg-2">
                    {r.character.image && <Image src={r.character.image} alt="" fill sizes="(max-width:640px) 50vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />}
                    {r.role === "MAIN" && <span className="absolute left-2 top-2 rounded bg-accent-strong px-1.5 py-0.5 text-[10px] font-bold uppercase text-snow">Main</span>}
                  </span>
                  <span className="mt-2 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{r.character.name}</span>
                  <span className="block truncate text-xs text-muted">{r.media[0].title}{r.media.length > 1 ? ` +${r.media.length - 1}` : ""}</span>
                </>
              );
              return <li key={r.character.id}>{k ? <Link href={animePath(k)} className="group block">{body}</Link> : <div className="group">{body}</div>}</li>;
            })}
          </ul>
        </section>
      ) : (
        <section className="reveal mt-10" aria-labelledby="known-h">
          <h2 id="known-h" className="h-section mb-3">Best-known work</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {va.work.slice(0, 12).map((w) => {
              const k = link(w.media);
              const body = (
                <>
                  <span className="relative block aspect-[2/3] overflow-hidden rounded-xl border border-line bg-bg-2">{w.media.cover && <Image src={w.media.cover} alt="" fill sizes="(max-width:640px) 50vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />}</span>
                  <span className="mt-2 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{w.media.title}</span>
                  <span className="block truncate text-xs text-muted">{cleanRole(w.roles[0])}{w.media.year ? ` · ${w.media.year}` : ""}</span>
                </>
              );
              return <li key={w.media.id}>{k ? <Link href={animePath(k)} className="group block">{body}</Link> : <div className="group">{body}</div>}</li>;
            })}
          </ul>
        </section>
      )}

      {span.length >= 3 && (
        <section className="reveal mt-10">
          <BarChart
            title={kind === "voice" ? "Roles per year" : "Credits per year"}
            subtitle={kind === "voice" ? `Anime with ${va.name} in the cast${capped ? ", among the 100 most popular" : ""}` : `Anime ${va.name} worked on, by premiere year`}
            valueHeading={kind === "voice" ? "Roles" : "Credits"}
            integer
            highlightKey={busiest ? String(busiest[0]) : undefined}
            labelKeys={busiest ? [String(busiest[0])] : undefined}
            data={span.map((y) => ({ key: String(y), label: String(y).slice(2), value: byYear.get(y) || 0, display: `${byYear.get(y) || 0} in ${y}` }))}
          />
        </section>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-10">
          {kind === "voice" && (
            <section className="reveal" aria-labelledby="all-h">
              <h2 id="all-h" className="h-section mb-3">All roles{capped ? " (100 most popular)" : ""}</h2>
              <ol className="card divide-y divide-line">
                {[...va.roles].sort((x, y) => (y.media.year || 0) - (x.media.year || 0) || y.media.popularity - x.media.popularity).map((r) => {
                  const k = link(r.media);
                  return (
                    <li key={r.media.id} className="flex items-center gap-3 p-2.5 text-sm">
                      <span className="w-10 shrink-0 text-xs tabular-nums text-muted">{r.media.year || "TBA"}</span>
                      <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-bg-2">{r.media.cover && <Image src={r.media.cover} alt="" fill sizes="36px" className="object-cover" />}</span>
                      <span className="min-w-0 flex-1">
                        {k ? <Link href={animePath(k)} className="block truncate font-medium text-ink hover:text-violet-2">{r.media.title}</Link> : <span className="block truncate font-medium text-ink">{r.media.title}</span>}
                        <span className="block truncate text-xs text-muted">{r.characters.map((c) => c.name).join(", ")}</span>
                      </span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${r.role === "MAIN" ? "bg-accent/20 text-accent-2" : "bg-white/5 text-muted"}`}>{r.role.toLowerCase()}</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
          {va.work.length > 0 && (
            <section className="reveal" aria-labelledby="work-h">
              <h2 id="work-h" className="h-section mb-3">{kind === "voice" ? "Production credits" : "All credits"}</h2>
              {workList(va.work)}
            </section>
          )}
        </div>
        <aside className="space-y-4">
          {facts.length > 0 && (
            <div className="card p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Profile</h2>
              <dl className="divide-y divide-line text-sm">
                {facts.map((f) => <div key={f.label} className="flex justify-between gap-3 py-2"><dt className="text-muted">{f.label}</dt><dd className="text-right text-ink">{f.value}</dd></div>)}
              </dl>
            </div>
          )}
          {wd && (wd.awards.length > 0 || wd.website) && (
            <div className="card p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Awards & links</h2>
              {wd.awards.length > 0 && <ul className="space-y-1 text-sm text-ink/90">{wd.awards.map((a) => <li key={a}>🏆 {a}</li>)}</ul>}
              {wd.website && <a href={wd.website} target="_blank" rel="noopener nofollow" className="mt-3 inline-block text-sm text-violet hover:text-violet-2">Official website →</a>}
              <p className="mt-2 text-xs text-muted">From <a href={`https://www.wikidata.org/wiki/${wd.qid}`} target="_blank" rel="noopener" className="underline">Wikidata</a>.</p>
            </div>
          )}
          {bio && (
            <div className="card p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">About</h2>
              <p className="whitespace-pre-line text-sm leading-6 text-ink/85">{bio}</p>
              <p className="mt-2 text-xs text-muted">From <a href={`https://anilist.co/staff/${va.id}`} rel="noopener" className="underline">AniList</a>.</p>
            </div>
          )}
        </aside>
      </div>

      <AdSlot slot="va-bottom" />
      <Faq items={faq} />
    </div>
  );
}
