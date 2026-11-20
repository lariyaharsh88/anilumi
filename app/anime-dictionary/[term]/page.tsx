import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import { abs } from "@/lib/site";
import { fitTitle, fitDescription } from "@/lib/titles";
import { characterPathFor } from "@/lib/charsnap";
import { KIND_LABEL, TERMS, termBySlug, termPath, termsPath, type AnimeTerm, type TermExample } from "@/lib/animeterms";

export const revalidate = 2592000;
// Rendered on first request like the other content pages (OpenNext 404s build-time pages with dynamicParams = false).
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ term: string }> };

function load(slug: string): AnimeTerm {
  const t = termBySlug(slug);
  if (!t) notFound();
  return t;
}
/** The meaning first, then Hindi and examples; short meanings ("Thank you.") get the literal sense and first usage line so the snippet isn't a stub. */
function describe(t: AnimeTerm, named: string[]): string {
  let d = `${t.term} meaning: ${t.short} In Hindi: ${t.hi.word} (${t.hi.gloss}).`;
  if (d.length < 140 && !t.literal.startsWith("English")) d += ` Literally: ${t.literal}`;
  if (d.length < 140) d += ` ${t.usage.split(/(?<=\.)\s/)[0]}`;
  return named.length && d.length < 130 ? `${d} Examples: ${named.join(", ")}.` : d;
}
const exampleHref = (e: TermExample) => (e.char ? characterPathFor(e.char) : null) ?? (e.anime ? `/anime/${e.anime}` : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = load((await params).term);
  const named = t.examples.filter((e) => e.char || e.anime).slice(0, 2).map((e) => e.who);
  return {
    // "<term> meaning" is the search in both countries; phrases and honorifics are also looked up as Japanese words
    // ("san in japanese meaning", "kun in japanese means").
    title: fitTitle(t.kind === "phrase" || t.kind === "honorific"
      ? [`${t.term} Meaning in Japanese, Anime & Hindi`, `${t.term} Meaning in Japanese & Hindi`, `${t.term} Meaning`]
      : [`${t.term} Meaning: What It Means in Anime (+ Hindi)`, `${t.term} Meaning in Anime (+ Hindi)`, `${t.term} Meaning`]),
    description: fitDescription(describe(t, named)),
    alternates: { canonical: termPath(t.slug) },
  };
}

/** One dictionary entry: the answer first, then usage, the Hindi meaning, verified examples and related terms. */
export default async function TermPage({ params }: Props) {
  const t = load((await params).term);
  const related = t.related.map(termBySlug).filter((x): x is AnimeTerm => Boolean(x));
  const facts: [string, string][] = [
    ...(t.jp !== "—" ? [["Japanese", t.jp] as [string, string]] : []),
    ["Romaji", t.romaji], ["Literally", t.literal], ["Say it", t.say],
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "DefinedTerm", "@id": `${abs(termPath(t.slug))}#term`, name: t.term, alternateName: [t.jp, t.romaji].filter((x) => x && x !== "—"), description: t.short, url: abs(termPath(t.slug)), inDefinedTermSet: { "@type": "DefinedTermSet", "@id": `${abs(termsPath)}#set`, name: "AniLumi anime dictionary", url: abs(termsPath) } }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: termsPath, label: "Anime dictionary" }, { href: termPath(t.slug), label: t.term }]}
        eyebrow={`📖 ${KIND_LABEL[t.kind]}`}
        title={<>{t.term} <span className="text-gradient">meaning</span></>}
        subtitle={t.short}
        hue={210}
      />

      {/* The answer people searched for; the literal meaning is in the cards below. A one-word meaning ("Thank you.") gets the first usage line too. */}
      <AnswerLead><strong>{t.term}</strong>{t.jp !== "—" && <> (<span lang="ja">{t.jp.split(" (")[0]}</span>)</>}: {t.short}{t.short.length < 60 ? ` ${t.usage.split(/(?<=\.)\s/)[0]}` : ""}</AnswerLead>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(([k, v]) => <div key={k} className="card p-4"><dt className="text-xs uppercase tracking-wide text-muted">{k}</dt><dd className="mt-1 text-sm font-medium text-ink" lang={k === "Japanese" ? "ja" : undefined}>{v}</dd></div>)}
      </dl>

      <section className="reveal mt-10" aria-labelledby="use-h">
        <h2 id="use-h" className="h-section mb-3">How {t.term.toLowerCase()} is used in anime</h2>
        <p className="max-w-3xl text-[15px] leading-7 text-ink/90">{t.usage}</p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted"><strong className="text-ink/90">Good to know:</strong> {t.nuance}</p>
      </section>

      <section className="reveal mt-10" aria-labelledby="hi-h">
        <h2 id="hi-h" className="h-section mb-3">{t.term} meaning in Hindi</h2>
        <div className="card max-w-3xl border-orange-400/30 p-4">
          <p className="text-lg font-semibold text-ink" lang="hi">{t.hi.word}</p>
          <p className="mt-1 text-sm text-muted">Hinglish: {t.hi.gloss}</p>
        </div>
      </section>

      <section className="reveal mt-10" aria-labelledby="ex-h">
        <h2 id="ex-h" className="h-section mb-3">{t.kind === "archetype" ? `Famous ${t.term.toLowerCase()} characters` : `${t.term} in anime: examples`}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.examples.map((e) => {
            const href = exampleHref(e);
            return (
              <li key={e.who} className="card p-4 text-sm">
                <p className="font-semibold text-ink">{href ? <Link href={href} className="hover:text-violet-2">{e.who}</Link> : e.who}</p>
                <p className="text-xs text-muted">{e.where}</p>
                <p className="mt-2 text-ink/85">{e.note}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {t.confused && t.confused.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="conf-h">
          <h2 id="conf-h" className="h-section mb-3">Commonly confused with</h2>
          <ul className="max-w-3xl space-y-2 text-sm">
            {t.confused.map((c) => <li key={c.term} className="card p-3"><strong className="text-ink">{c.slug ? <Link href={termPath(c.slug)} className="hover:text-violet-2">{c.term}</Link> : c.term}:</strong> <span className="text-ink/85">{c.diff}</span></li>)}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="rel-h">
          <h2 id="rel-h" className="h-section mb-3">Related anime terms</h2>
          <p className="flex flex-wrap gap-2 text-sm">
            {related.map((r) => <Link key={r.slug} href={termPath(r.slug)} className="chip">{r.term}</Link>)}
            <Link href={termsPath} className="chip">All {TERMS.length} terms →</Link>
          </p>
        </section>
      )}

      <MadeBy className="mt-10" method={`Meanings are checked against Japanese dictionaries and the references below; anime examples against AniLumi's character data. Sources: ${t.sources.map((u) => new URL(u).hostname.replace(/^www\./, "")).join(", ")}.`} />
      <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted">{t.sources.map((u, i) => <a key={u} href={u} target="_blank" rel="noopener nofollow" className="underline">Source {i + 1}</a>)}</p>

      <Faq title={`${t.term}: FAQ`} items={t.faq} />
    </div>
  );
}
