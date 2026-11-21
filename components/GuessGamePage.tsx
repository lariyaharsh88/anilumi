import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import GuessGame from "@/components/GuessGame";
import { abs } from "@/lib/site";
import { ORG_ID, SITE_ID } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { GUESS_MODES, guessMode, guessPool } from "@/lib/guessgame";
import { ATTR_LABEL, MAX_GUESSES, attrsFor, charPage, dailyPick, istDay, type GuessMode } from "@/lib/guessgame-core";

/** Shared by /guess-the-anime-character and /guess-the-anime-character/[mode]. */
function load(mode: string) {
  const def = guessMode(mode);
  if (!def) notFound();
  const pool = guessPool(def.mode);
  if (pool.length < 10) notFound();
  return { def, pool };
}
const label = (name: string) => (name === "Anime" ? "anime" : name);

export function guessMetadata(mode: GuessMode): Metadata {
  const { def, pool } = load(mode);
  const all = def.mode === "all";
  return {
    title: fitTitle(all
      ? ["Guess the Anime Character: A New Character Every Day", "Guess the Anime Character (Daily Game)"]
      : [def.dle ? `${def.name} Character Guessing Game: Daily, like ${def.dle}` : null, `${def.name} Character Guessing Game: New Character Daily`, `Guess the ${def.name} Character: New One Daily`, `${def.name} Character Guess (Daily)`]),
    description: fitDescription(all
      ? `Guess today's anime character in ${MAX_GUESSES} tries: each guess shows if the series, gender, role, birthday, height, age and voice actor match. ${pool.length} characters, new daily.`
      : `Guess today's ${def.name} character in ${MAX_GUESSES} tries: each guess shows if gender, role, birthday, height, age and voice actor match. A new one daily at midnight IST.`),
    alternates: { canonical: def.path },
  };
}

export default function GuessGamePage({ mode }: { mode: GuessMode }) {
  const { def, pool } = load(mode);
  const all = def.mode === "all";
  const yesterday = dailyPick(pool, def.mode, istDay() - 1);
  const attrs = attrsFor(def.mode);
  const shareTitle = all ? "AniLumi anime character guess" : `AniLumi ${def.name} character guess`;
  const fallbackHref = def.anime ? `/anime/${def.anime}/characters` : "/characters";
  const faq: FaqItem[] = [
    { q: "How do I play?", a: `Type a ${label(def.name)} character's name and pick it from the list. Each guess shows how it compares with today's character: ${attrs.map((a) => ATTR_LABEL[a].toLowerCase()).join(", ")}. Green is a match, yellow is close, and an arrow says whether the answer is higher or lower. You have ${MAX_GUESSES} guesses.` },
    ...(def.dle ? [{ q: `Is this like ${def.dle}?`, a: `Yes, the same idea: one ${def.name} character a day, guessed from hints about each try. It's free, needs no sign-up, and also shows the character's AniLumi page once you've played.` }] : []),
    { q: "When is there a new character?", a: "Every day at midnight India time (IST). Everyone gets the same character, so you can compare results with friends using the Share button." },
    { q: "How do the hints work?", a: "The colours are the hints. A yellow birthday is within a month, a yellow height within 5 cm and a yellow age within 3 years; the arrows tell you which way to go. A dark square means the fact isn't known for one of the two characters." },
    { q: `Which characters can come up?`, a: all ? `The ${pool.length} most popular anime characters on AniList that have enough known facts, from shows like Jujutsu Kaisen, One Piece, Naruto, Attack on Titan and Demon Slayer.` : `${pool.length} characters from ${def.name}'s main and supporting cast, most popular first, each with enough known facts to be guessable.` },
    { q: "Where do the facts come from?", a: "Character birthdays, heights, ages, roles and Japanese voice actors come from AniList's character database, checked monthly. Ages are as listed there, usually at the start of the story." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", "@id": `${abs(def.path)}#game`, name: all ? "Guess the Anime Character" : `${def.name} Character Guessing Game`, url: abs(def.path), applicationCategory: "GameApplication", operatingSystem: "Any (web browser)", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, isPartOf: { "@id": SITE_ID }, publisher: { "@id": ORG_ID }, inLanguage: "en" }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/guess-the-anime-character", label: "Guess the character" }, ...(all ? [] : [{ href: def.path, label: def.name }])]}
        eyebrow={`${def.emoji} Daily game`}
        title={all ? <>Guess the <span className="text-gradient">anime character</span></> : <>Guess the <span className="text-gradient">{def.name}</span> character</>}
        subtitle={`A new ${label(def.name)} character every day at midnight IST. ${MAX_GUESSES} guesses; every guess tells you what matches.`}
        facts={[{ value: String(pool.length), label: "characters" }, { value: String(MAX_GUESSES), label: "guesses" }, { value: "Daily", label: "new character" }]}
        hue={all ? 300 : 20}
      />

      <section className="reveal mt-8" aria-label="Game"><GuessGame mode={def.mode} pool={pool} title={shareTitle} url={abs(def.path)} fallbackHref={fallbackHref} /></section>

      <p className="mt-4 text-center text-sm text-muted">
        Yesterday&apos;s character was{" "}
        {charPage(yesterday) ? <Link href={charPage(yesterday)!} className="font-medium text-ink hover:text-violet-2">{yesterday.n}</Link> : <strong className="text-ink">{yesterday.n}</strong>}
        {yesterday.t ? ` (${yesterday.t})` : ""}.
      </p>

      <section className="reveal mt-10" aria-labelledby="modes-h">
        <h2 id="modes-h" className="h-section mb-3">More daily characters</h2>
        <p className="flex flex-wrap gap-2 text-sm">
          {GUESS_MODES.filter((m) => m.mode !== def.mode).map((m) => <Link key={m.mode} href={m.path} className="chip">{m.emoji} {m.mode === "all" ? "Any anime" : m.name}</Link>)}
          <Link href="/quiz/which-naruto-character-are-you" className="chip">Which Naruto character are you?</Link>
          <Link href="/anime-birthday-twin" className="chip">🎂 Your anime birthday twin</Link>
        </p>
      </section>

      <section className="reveal mt-10" aria-labelledby="how-h">
        <h2 id="how-h" className="h-section mb-3">How to play</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {[["1", "Guess", `Type any ${label(def.name)} character and pick them from the list.`], ["2", "Read the colours", "Green matches, yellow is close, red is off; arrows point to the answer's birthday month, height or age."], ["3", "Share", `Solve it in ${MAX_GUESSES} guesses or fewer, then share your grid. A new character comes at midnight IST.`]].map(([n, h, t]) => (
            <li key={n} className="card p-4"><p className="text-xs font-bold text-accent-2">STEP {n}</p><p className="mt-1 font-semibold text-ink">{h}</p><p className="mt-1 text-sm text-muted">{t}</p></li>
          ))}
        </ol>
      </section>

      <Faq title={all ? "Guess the anime character: FAQ" : `${def.name} character game: FAQ`} items={faq} />
    </div>
  );
}
