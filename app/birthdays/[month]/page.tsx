import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MONTHS, DAYS_IN, cap, bdPath, bdLabel, monthPath, parseMonth, birthdaysIn, todayJst, type BdChar } from "@/lib/birthdays";
import { zodiac } from "@/lib/charfacts";
import { characterPathFor } from "@/lib/charsnap";
import { animePath } from "@/lib/kitsu";
import { vaPath } from "@/lib/anilist";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";

// Every 6 hours, so the "Today" marker follows the date.
export const revalidate = 21600;
export const dynamicParams = false;
export function generateStaticParams() {
  return MONTHS.map((month) => ({ month }));
}
type Props = { params: Promise<{ month: string }> };

const href = (c: BdChar) => characterPathFor(c.id) ?? (c.s ? animePath({ slug: c.s }) : null);

function load(month: string) {
  const m = parseMonth(month);
  if (!m) notFound();
  const { characters, people } = birthdaysIn(m);
  const name = cap(MONTHS[m - 1]);
  // The two signs a month spans, each with its own most popular characters ("anime characters that are Scorpio").
  const signs = [...new Set(Array.from({ length: DAYS_IN[m - 1] }, (_, i) => zodiac(m, i + 1)!))].map((sign) => {
    const days = Array.from({ length: DAYS_IN[m - 1] }, (_, i) => i + 1).filter((d) => zodiac(m, d) === sign);
    return { sign, from: days[0], to: days[days.length - 1], chars: characters.filter((c) => zodiac(c.m, c.d) === sign) };
  });
  return { m, name, characters, people, signs };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month } = await params;
  const { m, name, characters, people } = load(month);
  return {
    title: `Anime Characters Born in ${name}: ${characters.length} Birthdays Day by Day`,
    description: `Every popular anime character with a ${name} birthday, day by day: ${characters.slice(0, 4).map((c) => `${c.n} (${bdLabel(c.m, c.d)})`).join(", ")} and more${people.length ? `, plus ${people.length} voice actors` : ""}.`,
    alternates: { canonical: monthPath(m) },
  };
}

export default async function BirthdayMonth({ params }: Props) {
  const { month } = await params;
  const { m, name, characters, people, signs } = load(month);
  const today = todayJst();
  const prev = ((m + 10) % 12) + 1, next = (m % 12) + 1;
  const Face = ({ c, size = "sm" }: { c: BdChar; size?: "sm" | "lg" }) => {
    const body = (
      <>
        <span className={`relative block overflow-hidden rounded-xl border border-line bg-bg-2 ${size === "lg" ? "aspect-[5/7]" : "aspect-square"}`}>
          {c.i && <Image src={c.i} alt={size === "lg" ? `${c.n} from ${c.t}` : ""} fill sizes={size === "lg" ? "(max-width:640px) 50vw, 180px" : "64px"} className="object-cover object-top transition duration-500 group-hover:scale-105" />}
        </span>
        <span className={`mt-1 block truncate font-semibold text-ink group-hover:text-violet-2 ${size === "lg" ? "text-sm" : "text-[11px]"}`}>{c.n}</span>
        {size === "lg" && <span className="block truncate text-xs text-muted">{bdLabel(c.m, c.d)} · {c.t}</span>}
      </>
    );
    const h = href(c);
    return h ? <Link href={h} className="group block" title={`${c.n} (${c.t})`}>{body}</Link> : <div className="group" title={`${c.n} (${c.t})`}>{body}</div>;
  };

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/birthdays", label: "Birthdays" }, { href: monthPath(m), label: name }]}
        eyebrow={`🎂 ${signs.map((s) => s.sign).join(" & ")}`}
        title={<>Anime characters born in <span className="text-gradient">{name}</span></>}
        subtitle={`${characters.slice(0, 3).map((c) => c.n).join(", ")} and ${Math.max(0, characters.length - 3)} more popular characters celebrate in ${name}${people.length ? `, along with ${people.length} voice actors` : ""}. Pick a day for everyone born on it.`}
        facts={[{ value: String(characters.length), label: "characters" }, { value: String(people.length), label: "voice actors" }]}
        hue={330}
        posters={characters.slice(0, 3).map((c) => c.i)}
      />

      <section className="reveal mt-10" aria-labelledby="top-h">
        <h2 id="top-h" className="h-section mb-3">Most popular {name} birthdays</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {characters.slice(0, 12).map((c) => <li key={c.id}><Face c={c} size="lg" /></li>)}
        </ul>
      </section>

      <section className="reveal mt-12" aria-labelledby="days-h">
        <h2 id="days-h" className="h-section mb-3">{name}, day by day</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: DAYS_IN[m - 1] }, (_, i) => i + 1).map((d) => {
            const born = characters.filter((c) => c.d === d);
            const isToday = today.m === m && today.d === d;
            return (
              <li key={d} className={`card p-3 ${isToday ? "border-accent/60 ring-1 ring-accent/40" : ""}`}>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <Link href={bdPath(m, d)} className="font-bold text-ink hover:text-violet-2">{bdLabel(m, d)}{isToday && <span className="ml-2 rounded-full bg-accent-strong px-2 py-0.5 text-[10px] font-bold uppercase text-snow">Today</span>}</Link>
                  <Link href={bdPath(m, d)} className="text-xs text-muted hover:text-violet-2">{born.length ? `${born.length} →` : "See day →"}</Link>
                </div>
                {born.length ? (
                  <ul className="grid grid-cols-4 gap-2">{born.slice(0, 4).map((c) => <li key={c.id}><Face c={c} /></li>)}</ul>
                ) : (
                  <p className="text-xs text-muted">No popular characters on record.</p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {signs.map((s) => s.chars.length >= 4 && (
        <section key={s.sign} className="reveal mt-12" aria-labelledby={`sign-${s.sign}`}>
          <h2 id={`sign-${s.sign}`} className="h-section mb-1">{s.sign} anime characters born in {name}</h2>
          <p className="mb-3 text-sm text-muted">{name} {s.from}–{s.to}. {s.chars.length} popular characters.</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-8">{s.chars.slice(0, 16).map((c) => <li key={c.id}><Face c={c} /></li>)}</ul>
        </section>
      ))}

      {people.length > 0 && (
        <section className="reveal mt-12" aria-labelledby="va-h">
          <h2 id="va-h" className="h-section mb-3">Voice actors born in {name}</h2>
          <ul className="flex flex-wrap gap-2">
            {people.slice(0, 40).map((p) => <li key={p.id}><Link href={vaPath({ id: p.id, name: p.n })} className="chip">{p.n} · {bdLabel(p.m, p.d)}</Link></li>)}
          </ul>
        </section>
      )}

      <nav className="mt-12 flex flex-wrap gap-2 text-sm" aria-label="Other months">
        <Link href={monthPath(prev)} className="chip">← {cap(MONTHS[prev - 1])}</Link>
        <Link href="/birthdays" className="chip">🎂 Birthdays today</Link>
        <Link href={monthPath(next)} className="chip">{cap(MONTHS[next - 1])} →</Link>
      </nav>

      <Faq
        title={`${name} anime birthdays FAQ`}
        items={[
          { q: `Which anime characters have a birthday in ${name}?`, a: `${characters.slice(0, 10).map((c) => `${c.n} (${bdLabel(c.m, c.d)})`).join(", ")}${characters.length > 10 ? `, and ${characters.length - 10} more listed on this page` : ""}.` },
          ...(characters[0] ? [{ q: `Who is the most popular anime character born in ${name}?`, a: `${characters[0].n} from ${characters[0].t}, born on ${bdLabel(characters[0].m, characters[0].d)}.` }] : []),
          ...signs.filter((s) => s.chars.length).map((s) => ({ q: `Which anime characters born in ${name} are ${s.sign}?`, a: `Characters born ${name} ${s.from}–${s.to} are ${s.sign}, including ${s.chars.slice(0, 5).map((c) => c.n).join(", ")}.` })),
        ]}
      />
    </div>
  );
}
