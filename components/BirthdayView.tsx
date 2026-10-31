import Link from "@/components/Link";
import Image from "next/image";
import { animePath } from "@/lib/kitsu";
import { vaPath } from "@/lib/anilist";
import { characterPathFor } from "@/lib/charsnap";
import { bdLabel, bdPath, nextDays, birthdaysOn, MONTHS, cap, type BdChar, type BdPerson } from "@/lib/birthdays";
import PageHero from "./PageHero";
import Faq from "./Faq";

/** Shared body for /birthdays (today) and /birthdays/[month]/[day]. */
export default function BirthdayView({ m, d, characters, people, today = false }: { m: number; d: number; characters: BdChar[]; people: BdPerson[]; today?: boolean }) {
  const label = bdLabel(m, d);
  const upcoming = nextDays(m, d, 7).map((x) => ({ ...x, n: birthdaysOn(x.m, x.d).characters.length }));
  const year = new Date().getFullYear();
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/birthdays", label: "Birthdays" }, ...(today ? [] : [{ href: bdPath(m, d), label }])]}
        eyebrow={today ? `🎂 Today in Japan · ${label}` : "🎂 Anime birthdays"}
        title={<>Anime characters born on <span className="text-gradient">{label}</span></>}
        subtitle={characters.length ? `${characters.slice(0, 3).map((c) => c.n).join(", ")}${characters.length > 3 ? ` and ${characters.length - 3} more` : ""} celebrate on ${label}${people.length ? `, along with ${people.length} voice actor${people.length === 1 ? "" : "s"}` : ""}.` : `No popular characters on record share the ${label} birthday${people.length ? `, but ${people.length} voice actor${people.length === 1 ? " does" : "s do"}` : ""}.`}
        facts={[{ value: String(characters.length), label: "characters" }, { value: String(people.length), label: "voice actors" }]}
        hue={330}
        posters={characters.slice(0, 3).map((c) => c.i)}
      />

      {characters.length > 0 && (
        <section className="reveal mt-10">
          <h2 className="h-section mb-3">Characters</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {characters.map((c) => {
              const body = (
                <>
                  <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2">{c.i && <Image src={c.i} alt="" fill sizes="(max-width:640px) 50vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />}</span>
                  <span className="mt-2 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{c.n}</span>
                  <span className="block truncate text-xs text-muted">{c.t}</span>
                </>
              );
              const href = characterPathFor(c.id) ?? (c.s ? animePath({ slug: c.s }) : null);
              return <li key={c.id}>{href ? <Link href={href} className="group block">{body}</Link> : <div className="group">{body}</div>}</li>;
            })}
          </ul>
        </section>
      )}

      {people.length > 0 && (
        <section className="reveal mt-10">
          <h2 className="h-section mb-3">Voice actors</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <li key={p.id}>
                <Link href={vaPath({ id: p.id, name: p.n })} className="card group flex items-center gap-3 p-2.5 transition hover:border-violet/60">
                  <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-bg-2">{p.i && <Image src={p.i} alt="" fill sizes="44px" className="object-cover" />}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink group-hover:text-violet-2">{p.n}</span>
                    <span className="block truncate text-xs text-muted">{[p.j, p.l, p.y ? `turns ${year - p.y} in ${year}` : null].filter(Boolean).join(" · ")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="reveal mt-10">
        <h2 className="h-section mb-3">Coming up</h2>
        <ul className="flex flex-wrap gap-2">
          {upcoming.map((x) => <li key={`${x.m}-${x.d}`}><Link href={bdPath(x.m, x.d)} className="chip">{bdLabel(x.m, x.d)}{x.n ? ` · ${x.n}` : ""}</Link></li>)}
        </ul>
        <h2 className="h-section mb-3 mt-8">Browse by month</h2>
        <ul className="flex flex-wrap gap-2">{MONTHS.map((mo, i) => <li key={mo}><Link href={bdPath(i + 1, 1)} className={`chip ${i + 1 === m ? "chip-active" : ""}`}>{cap(mo)}</Link></li>)}</ul>
      </section>

      <Faq items={[
        { q: `Which anime characters have a birthday on ${label}?`, a: characters.length ? `${characters.slice(0, 8).map((c) => `${c.n} (${c.t})`).join(", ")}${characters.length > 8 ? `, and ${characters.length - 8} more` : ""}.` : `None of the most popular characters on record were born on ${label}.` },
        ...(people.length ? [{ q: `Which voice actors were born on ${label}?`, a: `${people.slice(0, 6).map((p) => p.n).join(", ")}.` }] : []),
      ]} />
      <p className="mt-6 text-xs text-muted">Birthdays of the most-favourited characters and voice actors on AniList.</p>
    </div>
  );
}
