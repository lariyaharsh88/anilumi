import Link from "@/components/Link";
import { editorWatched } from "@/lib/editor";
import { snapshotId } from "@/lib/wosnap";
import { vaNote, roleLine } from "@/lib/vanotes";
import MadeBy from "@/components/MadeBy";
import Image from "next/image";
import { animePath, getAnimeBySlug, posterUrl, type Anime } from "@/lib/kitsu";
import { vaPath } from "@/lib/anilist";
import { characterPathFor, snapById, type SnapChar } from "@/lib/charsnap";
import { roleIn } from "@/lib/seriessnap";
import { characterNote, linkedArcs } from "@/lib/charnotes";
import { premieresOn, otdPath, type Premiere } from "@/lib/onthisday";
import { bdLabel, bdPath, monthPath, nextDays, aroundDays, birthdaysOn, zodiacOf, sameSign, MONTHS, cap, type BdChar, type BdPerson } from "@/lib/birthdays";
import PageHero from "./PageHero";
import { itemList } from "@/lib/ld";
import JsonLd from "@/components/JsonLd";
import Faq from "./Faq";
import LeadForm from "./LeadForm";
import { dbEnabled } from "@/lib/db";

const fans = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));
const height = (s: SnapChar | null) => s?.l.find(([k]) => /height/i.test(k))?.[1] ?? null;
/** Short facts line for a character from the snapshot: age, height, gender. */
const factsOf = (s: SnapChar | null) => [s?.age && `Age ${s.age}`, height(s), s?.g].filter(Boolean) as string[];
const hrefOf = (c: BdChar) => characterPathFor(c.id) ?? (c.s ? animePath({ slug: c.s }) : null);

/** The shows these characters come from (distinct, most-favourited character first), with posters from Kitsu. */
async function showsOf(characters: BdChar[]): Promise<Anime[]> {
  const slugs = [...new Set(characters.map((c) => c.s).filter((s): s is string => Boolean(s)))].slice(0, 6);
  const found = await Promise.all(slugs.map((s) => getAnimeBySlug(s).catch(() => null)));
  return found.filter((a): a is Anime => Boolean(a));
}

/**
 * Shared body for /birthdays (today) and /birthdays/[month]/[day]: a spotlight on the most-favourited character,
 * profile cards (age, height, voice actors, fans) from the character snapshot, the shows they come from, anime
 * that premiered on the date, the week's other birthdays, and the date's zodiac sign.
 */
export default async function BirthdayView({ m, d, characters, people, today = false }: { m: number; d: number; characters: BdChar[]; people: BdPerson[]; today?: boolean }) {
  const label = bdLabel(m, d);
  const year = new Date().getFullYear();
  const upcoming = nextDays(m, d, 7).map((x) => ({ ...x, n: birthdaysOn(x.m, x.d).characters.length }));
  const week = aroundDays(m, d, 3).map((x) => ({ ...x, top: birthdaysOn(x.m, x.d).characters[0] ?? null }));
  const sign = zodiacOf(m, d);
  const signmates = sameSign(m, d);
  const otherSign = signmates.filter((c) => !(c.m === m && c.d === d)).slice(0, 6);
  const top = characters[0] ?? null;
  const topSnap = top ? snapById(top.id) : null;
  const [shows, premieres] = await Promise.all([
    showsOf(characters),
    premieresOn(m, d, 12).catch((): Premiere[] => []),
  ]);
  const firsts = premieres.filter((p) => p.anime).slice(0, 8);

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList(`Anime characters born on ${label}`, characters.flatMap((c) => { const href = characterPathFor(c.id); return href ? [{ url: href, name: c.n }] : []; }))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/birthdays", label: "Birthdays" }, ...(today ? [] : [{ href: monthPath(m), label: cap(MONTHS[m - 1]) }, { href: bdPath(m, d), label }])]}
        eyebrow={today ? `🎂 Today in Japan · ${label}` : "🎂 Anime birthdays"}
        title={<>Anime characters born on <span className="text-gradient">{label}</span></>}
        subtitle={characters.length ? `${characters.slice(0, 3).map((c) => c.n).join(", ")}${characters.length > 3 ? ` and ${characters.length - 3} more` : ""} celebrate on ${label}${people.length ? `, along with ${people.length} voice actor${people.length === 1 ? "" : "s"}` : ""}.` : `No popular characters on record share the ${label} birthday${people.length ? `, but ${people.length} voice actor${people.length === 1 ? " does" : "s do"}` : ""}.`}
        facts={[
          { value: String(characters.length), label: "characters" },
          { value: String(people.length), label: "voice actors" },
          { value: `${sign.symbol} ${sign.name}`, label: "zodiac sign" },
          ...(firsts.length ? [{ value: String(firsts.length), label: "anime premieres" }] : []),
        ]}
        hue={330}
        posters={characters.slice(0, 3).map((c) => c.i)}
      />
      <MadeBy className="mt-4" method="Birthdays come from AniList's character and staff records, ranked by fans; roles, arcs and voice-actor facts come from our checked notes where we have them." />

      {top && (
        <section className="reveal mt-10" aria-labelledby="spot-h">
          <h2 id="spot-h" className="h-section mb-3">Most popular birthday on {label}</h2>
          <div className="card flex flex-col gap-5 p-4 sm:flex-row sm:p-5">
            <span className="relative mx-auto block aspect-[5/7] w-40 shrink-0 overflow-hidden rounded-xl border border-line bg-bg-2 sm:mx-0 sm:w-44">
              {top.i && <Image src={top.i.replace("/medium/", "/large/")} alt={top.n} fill sizes="176px" className="object-cover" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">🎂 Born {label}</p>
              <h3 className="mt-1 text-2xl font-bold text-ink">{hrefOf(top) ? <Link href={hrefOf(top)!} className="hover:text-violet-2">{top.n}</Link> : top.n}</h3>
              {top.s && <p className="mt-1 text-sm text-muted">From <Link href={animePath({ slug: top.s })} className="text-violet hover:underline">{top.t}</Link></p>}
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                <div><dt className="text-xs text-muted">Fans on AniList</dt><dd className="font-semibold text-ink">❤ {top.f.toLocaleString()}</dd></div>
                {topSnap?.age && <div><dt className="text-xs text-muted">Age</dt><dd className="font-semibold text-ink">{topSnap.age}</dd></div>}
                {height(topSnap) && <div><dt className="text-xs text-muted">Height</dt><dd className="font-semibold text-ink">{height(topSnap)}</dd></div>}
                {topSnap?.g && <div><dt className="text-xs text-muted">Gender</dt><dd className="font-semibold text-ink">{topSnap.g}</dd></div>}
                {topSnap?.bt && <div><dt className="text-xs text-muted">Blood type</dt><dd className="font-semibold text-ink">{topSnap.bt}</dd></div>}
                <div><dt className="text-xs text-muted">Zodiac sign</dt><dd className="font-semibold text-ink">{sign.symbol} {sign.name}</dd></div>
              </dl>
              {(topSnap?.jp || topSnap?.en) && (
                <p className="mt-4 text-sm text-ink/85">
                  Voiced by {topSnap.jp && <Link href={vaPath({ id: topSnap.jp.id, name: topSnap.jp.n })} className="text-violet hover:underline">{topSnap.jp.n}</Link>}{topSnap.jp && " (Japanese)"}
                  {topSnap.jp && topSnap.en && " and "}
                  {topSnap.en && <><Link href={vaPath({ id: topSnap.en.id, name: topSnap.en.n })} className="text-violet hover:underline">{topSnap.en.n}</Link> (English)</>}.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {characters.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="chars-h">
          <h2 id="chars-h" className="h-section mb-3">Every character born on {label}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((c, i) => {
              const s = snapById(c.id);
              const href = hrefOf(c);
              const facts = factsOf(s);
              // "Main character in One Piece": the role from the series cast snapshot, the show linked to its page.
              const role = roleIn(c.s, c.id);
              // Top characters have verified key arcs (lib/charnotes.ts), linked to the show's episode list.
              const note = href?.startsWith("/character/") ? characterNote(href.slice("/character/".length)) : null;
              const arcs = note && c.s ? linkedArcs(note, c.s).slice(0, 3) : [];
              const body = (
                <>
                  {(() => { const pic = <span className="relative block h-24 w-[68px] shrink-0 overflow-hidden rounded-lg border border-line bg-bg-2">{c.i && <Image src={c.i} alt={c.n} fill sizes="68px" className="object-cover transition duration-500 group-hover:scale-105" />}</span>; return href ? <Link href={href} tabIndex={-1} aria-hidden className="shrink-0">{pic}</Link> : pic; })()}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2"><span className="text-xs font-bold tabular-nums text-muted">#{i + 1}</span>{href ? <Link href={href} className="truncate font-semibold text-ink hover:text-violet-2">{c.n}</Link> : <span className="truncate font-semibold text-ink">{c.n}</span>}</span>
                    <span className="block truncate text-xs text-muted">{role ? `${role === "main" ? "Main" : "Supporting"} character in ` : ""}{c.s ? <Link href={animePath({ slug: c.s })} className="underline decoration-line underline-offset-2 hover:text-violet-2">{c.t}</Link> : c.t}</span>
                    {facts.length > 0 && <span className="mt-1 block truncate text-xs text-ink/80">{facts.join(" · ")}</span>}
                    {arcs.length > 0 && <span className="mt-1 block truncate text-xs text-muted">Key arcs: {arcs.map((a, j) => <span key={a.name}>{j ? ", " : ""}{a.arc ? <Link href={`/anime/${c.s}/episodes${Math.ceil(a.arc.from / 20) > 1 ? `/page/${Math.ceil(a.arc.from / 20)}` : ""}#ep-${a.arc.from}`} className="hover:text-violet-2 hover:underline">{a.name}</Link> : a.name}</span>)}</span>}
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                      <span>❤ {fans(c.f)} fans</span>
                      {s?.jp && <span className="truncate">· VA {s.jp.n}</span>}
                      {c.s && editorWatched({ id: snapshotId(c.s) ?? "", slug: c.s }) && <span className="text-emerald-300">· ✓ Harsh has watched this series</span>}
                    </span>
                  </span>
                </>
              );
              return <li key={c.id}><div className="card group flex gap-3 p-2.5 transition hover:border-violet/60">{body}</div></li>;
            })}
          </ul>
        </section>
      )}

      {shows.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="shows-h">
          <h2 id="shows-h" className="h-section mb-1">Their anime</h2>
          <p className="mb-3 text-sm text-muted">The series these {label} birthdays come from.</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {shows.map((a) => (
              <li key={a.id}>
                <Link href={animePath(a)} className="group block">
                  <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2">{posterUrl(a, "small") && <Image src={posterUrl(a, "small")!} alt={`${a.title} poster`} fill sizes="(max-width:640px) 30vw, 160px" className="object-cover transition duration-500 group-hover:scale-105" />}</span>
                  <span className="mt-1.5 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{a.title}</span>
                  <span className="block text-xs text-muted">{[a.startDate?.slice(0, 4), a.episodeCount ? `${a.episodeCount} ep` : null].filter(Boolean).join(" · ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {people.length > 0 && (
        <section className="reveal mt-10">
          <h2 className="h-section mb-3">Voice actors born on {label}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <li key={p.id}>
                <Link href={vaPath({ id: p.id, name: p.n })} className="card group flex items-center gap-3 p-2.5 transition hover:border-violet/60">
                  <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-bg-2">{p.i && <Image src={p.i} alt={p.n} fill sizes="44px" className="object-cover" />}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink group-hover:text-violet-2">{p.n}</span>
                    <span className="block truncate text-xs text-muted">{[p.j, p.l, p.y ? `turns ${year - p.y} in ${year}` : null].filter(Boolean).join(" · ")}</span>
                    {vaNote(p.id)?.signature.length ? <span className="mt-0.5 block truncate text-xs text-ink/80">Known for {vaNote(p.id)!.signature.slice(0, 2).map(roleLine).join("; ")}</span> : null}
                    {vaNote(p.id)?.awards.length ? <span className="block truncate text-xs text-muted">🏆 {vaNote(p.id)!.awards[0].award} ({vaNote(p.id)!.awards[0].year})</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {firsts.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="otd-h">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="otd-h" className="h-section">Anime that premiered on {label}</h2>
            <Link href={otdPath(m, d)} className="shrink-0 text-sm font-medium text-violet hover:text-violet-2">All →</Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {firsts.map((p) => (
              <li key={p.anime!.id}>
                <Link href={animePath(p.anime!)} className="card group flex gap-3 p-2.5 transition hover:border-violet/60">
                  <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(p.anime!, "tiny") && <Image src={posterUrl(p.anime!, "tiny")!} alt={`${p.anime!.title} poster`} fill sizes="56px" className="object-cover" />}</span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-semibold text-ink group-hover:text-violet-2">{p.anime!.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{p.format} · {p.year}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="reveal mt-10" aria-labelledby="week-h">
        <h2 id="week-h" className="h-section mb-3">Born the same week</h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {week.map((x) => (
            <li key={`${x.m}-${x.d}`}>
              <Link href={bdPath(x.m, x.d)} className="card group block p-2 text-center transition hover:border-violet/60">
                <span className="relative mx-auto block aspect-square w-14 overflow-hidden rounded-full border border-line bg-bg-2">{x.top?.i && <Image src={x.top.i} alt={x.top.n} fill sizes="56px" className="object-cover" />}</span>
                <span className="mt-1.5 block text-xs font-semibold text-ink group-hover:text-violet-2">{bdLabel(x.m, x.d)}</span>
                <span className="block truncate text-[11px] text-muted">{x.top ? x.top.n : "No major birthdays"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {otherSign.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="sign-h">
          <h2 id="sign-h" className="h-section mb-1">{sign.symbol} Other {sign.name} anime characters</h2>
          <p className="mb-3 text-sm text-muted">{label} falls under {sign.name}. {signmates.length.toLocaleString()} of the most popular anime characters share the sign; these are the best known.</p>
          <ul className="flex flex-wrap gap-2">
            {otherSign.map((c) => {
              const href = hrefOf(c);
              const chip = <>{c.n} <span className="text-muted">· {bdLabel(c.m, c.d)}</span></>;
              return <li key={c.id}>{href ? <Link href={href} className="chip">{chip}</Link> : <span className="chip">{chip}</span>}</li>;
            })}
          </ul>
        </section>
      )}

      <section className="reveal mt-10">
        <h2 className="h-section mb-3">Coming up</h2>
        <ul className="flex flex-wrap gap-2">
          {upcoming.map((x) => <li key={`${x.m}-${x.d}`}><Link href={bdPath(x.m, x.d)} className="chip">{bdLabel(x.m, x.d)}{x.n ? ` · ${x.n}` : ""}</Link></li>)}
        </ul>
        <h2 className="h-section mb-3 mt-8">Browse by month</h2>
        <ul className="flex flex-wrap gap-2">{MONTHS.map((mo, i) => <li key={mo}><Link href={monthPath(i + 1)} className={`chip ${i + 1 === m ? "chip-active" : ""}`}>{cap(mo)}</Link></li>)}</ul>
        <p className="mt-4 text-sm"><Link href={monthPath(m)} className="text-violet hover:underline">Every anime character born in {cap(MONTHS[m - 1])}, day by day →</Link></p>
      </section>

      {/* Birthday pages bring most of the search clicks but nobody back: the Friday digest now lists the week's birthdays. */}
      {dbEnabled() && <LeadForm className="mt-10" kind="digest" source="birthday-digest" title="🎂 Next week's anime birthdays, every Friday" blurb="Popular characters' birthdays for the week ahead, plus new episodes and premieres, in one short email." button="Subscribe" />}

      <Faq items={[
        { q: `Which anime characters have a birthday on ${label}?`, a: characters.length ? `${characters.slice(0, 8).map((c) => `${c.n} (${c.t})`).join(", ")}${characters.length > 8 ? `, and ${characters.length - 8} more` : ""}.` : `None of the most popular characters on record were born on ${label}.` },
        ...(top ? [{ q: `Who is the most popular anime character born on ${label}?`, a: `${top.n} from ${top.t}, with ${top.f.toLocaleString()} fans on AniList${topSnap?.jp ? `. In Japanese, ${top.n} is voiced by ${topSnap.jp.n}` : ""}.` }] : []),
        { q: `What zodiac sign are anime characters born on ${label}?`, a: `${sign.name} (${sign.symbol}).${otherSign.length ? ` Other well-known ${sign.name} characters include ${otherSign.slice(0, 3).map((c) => c.n).join(", ")}.` : ""}` },
        ...(people.length ? [{ q: `Which voice actors were born on ${label}?`, a: `${people.slice(0, 6).map((p) => p.n).join(", ")}.` }] : []),
        ...(firsts.length ? [{ q: `Which anime premiered on ${label}?`, a: `${firsts.slice(0, 5).map((p) => `${p.anime!.title} (${p.year})`).join(", ")}.` }] : []),
      ]} />
      <p className="mt-6 text-xs text-muted">Birthdays, ages, heights and voice actors of the most-favourited characters and voice actors on AniList; premieres from AniList; posters from Kitsu.</p>
    </div>
  );
}
