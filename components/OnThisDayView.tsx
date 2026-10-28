import Link from "@/components/Link";
import Image from "next/image";
import { animePath, posterUrl, type Anime } from "@/lib/kitsu";
import { allDays, bdLabel, bdPath } from "@/lib/birthdays";
import { otdPath, type Premiere } from "@/lib/onthisday";
import PageHero from "./PageHero";
import Faq from "./Faq";

const ago = (year: number, now: number) => (now - year === 0 ? "this year" : now - year === 1 ? "1 year ago" : `${now - year} years ago`);

/** Shared body for /on-this-day (today) and /on-this-day/[month]/[day]. */
export default function OnThisDayView({ m, d, premieres, pick, today = false }: { m: number; d: number; premieres: Premiere[]; pick?: Anime | null; today?: boolean }) {
  const label = bdLabel(m, d);
  const days = allDays();
  const i = days.findIndex((x) => x.m === m && x.d === d);
  const prev = days[(i - 1 + days.length) % days.length], next = days[(i + 1) % days.length];
  const now = new Date().getFullYear();
  const oldest = premieres.reduce<Premiere | null>((o, p) => (!o || p.year < o.year ? p : o), null);
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/on-this-day", label: "On this day" }, ...(today ? [] : [{ href: otdPath(m, d), label }])]}
        eyebrow={today ? `📅 Today in Japan · ${label}` : "📅 On this day in anime"}
        title={<>Anime that premiered on <span className="text-gradient">{label}</span></>}
        subtitle={premieres.length ? `${premieres.slice(0, 3).map((p) => `${p.title} (${p.year})`).join(", ")}${premieres.length > 3 ? ` and ${premieres.length - 3} more` : ""} first aired on ${label}.` : `No widely followed anime premiered on ${label}, as far as AniList knows.`}
        facts={[
          { value: String(premieres.length), label: "premieres on this date" },
          ...(oldest ? [{ value: String(oldest.year), label: "earliest year" }] : []),
        ]}
        hue={200}
        posters={premieres.filter((p) => p.anime).slice(0, 3).map((p) => posterUrl(p.anime!, "medium"))}
      />

      {pick && (
        <section className="card reveal mt-10 flex gap-4 p-4 sm:p-5" aria-labelledby="aotd-h">
          <Link href={animePath(pick)} className="relative h-40 w-28 shrink-0 overflow-hidden rounded-lg bg-bg-2">{posterUrl(pick, "small") && <Image src={posterUrl(pick, "small")!} alt="" fill sizes="112px" className="object-cover" />}</Link>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">Anime of the day</p>
            <h2 id="aotd-h" className="mt-1 text-xl font-bold text-ink"><Link href={animePath(pick)} className="hover:text-violet-2">{pick.title}</Link></h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/80">{pick.synopsis}</p>
            <p className="mt-3 flex flex-wrap gap-2 text-sm"><Link href={animePath(pick)} className="chip">Details</Link><Link href={`/similar/${pick.slug}`} className="chip">More like this</Link></p>
          </div>
        </section>
      )}

      {premieres.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="prem-h">
          <h2 id="prem-h" className="h-section mb-3">First aired on {label}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {premieres.map((p) => {
              const body = (
                <>
                  <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2">
                    {p.anime && posterUrl(p.anime, "small") && <Image src={posterUrl(p.anime, "small")!} alt="" fill sizes="(max-width:640px) 50vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />}
                    <span className="absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-bold text-snow">{p.year}</span>
                  </span>
                  <span className="mt-2 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{p.anime?.title || p.title}</span>
                  <span className="block truncate text-xs text-muted">{p.format} · {ago(p.year, now)}</span>
                </>
              );
              return <li key={`${p.title}-${p.year}`}>{p.anime ? <Link href={animePath(p.anime)} className="group block">{body}</Link> : <div className="group">{body}</div>}</li>;
            })}
          </ul>
        </section>
      )}

      <nav className="mt-10 flex flex-wrap items-center gap-2 text-sm" aria-label="Other dates">
        <Link href={otdPath(prev.m, prev.d)} className="chip">← {bdLabel(prev.m, prev.d)}</Link>
        <Link href={otdPath(next.m, next.d)} className="chip">{bdLabel(next.m, next.d)} →</Link>
        <Link href={bdPath(m, d)} className="chip">🎂 Characters born on {label}</Link>
      </nav>
      <p className="mt-4 text-xs text-muted">Premiere dates and popularity from AniList; dates are the original Japanese release.</p>

      <Faq items={[
        { q: `What anime came out on ${label}?`, a: premieres.length ? `${premieres.slice(0, 6).map((p) => `${p.anime?.title || p.title} (${p.format.toLowerCase()}, ${p.year})`).join("; ")}.` : `No widely followed anime premiered on ${label}.` },
        ...(oldest ? [{ q: `What is the oldest anime that premiered on ${label}?`, a: `${oldest.anime?.title || oldest.title}, which first aired on ${label}, ${oldest.year}.` }] : []),
      ]} />
    </div>
  );
}
