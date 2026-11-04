import Link from "@/components/Link";
import { animePath, fmtMinutes, runtimeMinutes, type WatchEntry } from "@/lib/kitsu";
import { fillerFor, continuationFor, startAt } from "@/lib/filler";
import { hiDuration, hiDays } from "@/lib/hindi";

type Lang = "en" | "hi";
const T = {
  en: {
    h: "Binge plan", sub: "How long each way through the franchise takes, what you can skip, and where the story goes next.",
    main: "Main story only", mainNote: (n: number) => `${n} part${n === 1 ? "" : "s"}, in order`,
    movies: "Story + movies", moviesNote: (n: number) => `adds ${n} movie${n === 1 ? "" : "s"}`,
    all: "Everything", allNote: (n: number) => `${n} entries incl. OVAs and specials`,
    canon: "Skipping filler", canonNote: (n: number) => `${n} filler episode${n === 1 ? "" : "s"} skipped`,
    pace: (d: number) => `${d} day${d === 1 ? "" : "s"} at 2 hours a day`,
    fillerH: "Filler you can skip", fillerRow: (n: number, pct: number) => `${n} filler episodes (${pct}% of the series)`, fillerLink: "Full filler list",
    mangaH: "Where the story continues", mangaRow: (medium: string, at: string) => `Continue in the ${medium} from ${at}`, mangaLink: "Details",
    after: "after",
    dur: fmtMinutes, days: (min: number) => Math.max(1, Math.ceil(min / 120)),
  },
  hi: {
    h: "बिंज प्लान", sub: "पूरी फ्रैंचाइज़ी अलग-अलग तरीकों से देखने में कितना समय लगेगा, क्या छोड़ सकते हैं और कहानी आगे कहाँ जाती है।",
    main: "सिर्फ़ मुख्य कहानी", mainNote: (n: number) => `${n} हिस्से, क्रम से`,
    movies: "कहानी + फ़िल्में", moviesNote: (n: number) => `${n} फ़िल्में जोड़कर`,
    all: "सब कुछ", allNote: (n: number) => `OVA और स्पेशल समेत ${n} हिस्से`,
    canon: "फ़िलर छोड़कर", canonNote: (n: number) => `${n} फ़िलर एपिसोड छोड़कर`,
    pace: (d: number) => `रोज़ 2 घंटे देखने पर ${d} दिन`,
    fillerH: "जो फ़िलर छोड़ सकते हैं", fillerRow: (n: number, pct: number) => `${n} फ़िलर एपिसोड (सीरीज़ का ${pct}%)`, fillerLink: "पूरी फ़िलर लिस्ट",
    mangaH: "कहानी आगे कहाँ से पढ़ें", mangaRow: (medium: string, at: string) => `${medium === "manga" ? "मंगा" : "लाइट नॉवेल"} में ${at.replace("chapter", "चैप्टर").replace("volume", "वॉल्यूम")} से आगे पढ़ें`, mangaLink: "विवरण",
    after: "के बाद",
    // Long runs read in days, like the English "11d 13h": "11 दिन 13 घंटे".
    dur: (min: number) => (min >= 1440 ? `${Math.floor(min / 1440)} दिन${Math.floor((min % 1440) / 60) ? ` ${Math.floor((min % 1440) / 60)} घंटे` : ""}` : hiDuration(min)), days: hiDays,
  },
} as const;

/**
 * The binge plan on watch-order guides: time for each route through the franchise (main story, with movies,
 * everything, without filler), the filler you can skip per season (data/filler.ts and the MAL filler snapshot),
 * and where the manga or light novel picks up (CONTINUE). Server component; English or Hindi.
 */
export default function BingePlan({ ordered, lang = "en" }: { ordered: WatchEntry[]; lang?: Lang }) {
  const t = T[lang];
  const mains = ordered.filter((e) => e.kind === "main");
  const movies = ordered.filter((e) => e.kind === "movie");
  const sum = (es: WatchEntry[]) => es.reduce((m, e) => m + runtimeMinutes(e.anime), 0);
  const mainMin = sum(mains), movieMin = sum(movies), allMin = sum(ordered);
  if (!mainMin || mains.length + movies.length < 2) return null;

  // Filler per main entry; episode length from Kitsu (24 min when missing).
  const filler = mains.flatMap((e) => {
    const f = fillerFor(e.anime.slug, e.anime.episodeCount);
    return f && f.count > 0 ? [{ e, f, minutes: f.count * (e.anime.episodeLength || 24) }] : [];
  });
  const fillerEps = filler.reduce((n, x) => n + x.f.count, 0);
  const fillerMin = filler.reduce((n, x) => n + x.minutes, 0);
  const manga = [...mains].reverse().flatMap((e) => { const c = continuationFor(e.anime.slug); return c ? [{ e, c }] : []; }).slice(0, 1);

  const routes = [
    { label: t.main, min: mainMin, note: t.mainNote(mains.length), key: "main" },
    ...(movies.length ? [{ label: t.movies, min: mainMin + movieMin, note: t.moviesNote(movies.length), key: "movies" }] : []),
    ...(allMin > mainMin + movieMin ? [{ label: t.all, min: allMin, note: t.allNote(ordered.length), key: "all" }] : []),
    ...(fillerMin > 0 ? [{ label: t.canon, min: Math.max(0, mainMin - fillerMin), note: t.canonNote(fillerEps), key: "canon" }] : []),
  ];

  return (
    <section className="reveal mt-8" aria-labelledby="binge-h">
      <h2 id="binge-h" className="h-section mb-1">{t.h}</h2>
      <p className="mb-3 text-sm text-muted">{t.sub}</p>
      <ul className={`grid grid-cols-2 gap-3 ${routes.length >= 4 ? "lg:grid-cols-4" : routes.length === 3 ? "sm:grid-cols-3" : ""}`}>
        {routes.map((r) => (
          <li key={r.key} className={`card p-3 ${r.key === "canon" ? "border-emerald-500/30" : r.key === "main" ? "border-violet/40" : ""}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{r.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{t.dur(r.min)}</p>
            <p className="mt-0.5 text-xs text-muted">{r.note}</p>
            <p className="mt-1 text-xs text-ink/75">{t.pace(t.days(r.min))}</p>
          </li>
        ))}
      </ul>

      {(filler.length > 0 || manga.length > 0) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filler.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-ink">{t.fillerH}</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {filler.map(({ e, f }) => (
                  <li key={e.anime.id} className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="min-w-0"><Link href={animePath(e.anime)} className="font-medium text-ink hover:text-violet-2">{e.anime.title}</Link> <span className="text-muted">· {t.fillerRow(f.count, Math.round(f.share))}</span></span>
                    <Link href={`${animePath(e.anime)}/filler-list`} className="shrink-0 text-xs font-medium text-violet hover:text-violet-2">{t.fillerLink} →</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {manga.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-ink">{t.mangaH}</h3>
              {manga.map(({ e, c }) => (
                <p key={e.anime.id} className="mt-2 text-sm text-ink/90">
                  {lang === "hi" ? <><Link href={animePath(e.anime)} className="font-medium text-violet-2 hover:underline">{e.anime.title}</Link> {t.after}: </> : <>{t.after[0].toUpperCase() + t.after.slice(1)} <Link href={animePath(e.anime)} className="font-medium text-violet-2 hover:underline">{e.anime.title}</Link>: </>}
                  {t.mangaRow(c.medium, startAt(c))}. <Link href={`${animePath(e.anime)}/manga`} className="text-xs font-medium text-violet hover:text-violet-2">{t.mangaLink} →</Link>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
