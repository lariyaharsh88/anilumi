import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCharacterBySlug, getCharacterAppearances, getCharacters, animePath, posterUrl, subtypeLabel } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import { getCast, getAniListCharacter, sameName, vaPath, type Va } from "@/lib/anilist";
import { snapFor, showRanking, snapToAniList } from "@/lib/charsnap";
import { parseKitsuBio, mergeFacts, factsTitle, ageAnswer, zodiac, aliasList, quickAnswer } from "@/lib/charfacts";
import { formatMix, yearsActive, perYear, castRank, debutAndLatest } from "@/lib/charstats";
import StatTiles from "@/components/viz/StatTiles";
import BarChart from "@/components/viz/BarChart";
import StackedBar from "@/components/viz/StackedBar";
import AdSlot from "@/components/AdSlot";
import { birthdayFor, bdLabel, bdPath } from "@/lib/birthdays";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

/** Character, appearances, voice cast and birthday: shared by metadata and the page (fetches are cached). */
async function load(slug: string) {
  const c = await getCharacterBySlug(decodeURIComponent(slug));
  if (!c) notFound();
  const apps = await getCharacterAppearances(c.id);
  const mains = apps.filter((a) => a.role === "main");
  // The show they're known for: a TV series first (main role, then any role), most-followed first. Kishou Arima
  // is "main" only in the Jack OVA, but people know him from Tokyo Ghoul.
  const top = (xs: typeof apps) => [...xs].sort((x, y) => y.anime.userCount - x.anime.userCount)[0];
  const tv = (xs: typeof apps) => xs.filter((x) => x.anime.subtype === "TV");
  const homeApp = top(tv(mains)) || top(tv(apps)) || top(mains) || top(apps);
  const home = homeApp?.anime;
  const bday = birthdayFor(c.name, apps.map((x) => x.anime.slug));
  // Popular characters come from the monthly AniList snapshot (no live calls: AniList allows ~30 a minute);
  // everyone else falls back to live AniList, which may be missing on a bad minute.
  const snap = snapFor(c.name, apps.map((x) => x.anime.slug));
  const person = (p: { id: number; n: string; i: string | null } | null): Va | null => (p ? { id: p.id, name: p.n, native: null, image: p.i } : null);
  let voiced: { character: { id: number }; jp: Va | null; en: Va | null } | undefined;
  let al, cast = null, ranking: { id: number; name: string; favourites: number }[] = [], rankShow: string | null = null;
  if (snap) {
    voiced = { character: { id: snap.id }, jp: person(snap.jp), en: person(snap.en) };
    al = snapToAniList(snap);
    ranking = showRanking(snap).map((x) => ({ id: x.id, name: x.n, favourites: x.f }));
    rankShow = snap.t;
  } else {
    cast = home ? await getCast(home.id, 25) : null;
    const jpKey = (s: string | null | undefined) => (s || "").replace(/[\s・·=＝]/g, "");
    voiced = cast?.entries.find((e) => sameName(e.character.name, c.name) || (c.nameJp && jpKey(e.character.native) === jpKey(c.nameJp)));
    al = voiced ? await getAniListCharacter(voiced.character.id) : null;
    ranking = (cast?.entries || []).map((e) => e.character);
    rankShow = home?.title ?? null;
  }
  const others = home ? await getCharacters(home.id, 13) : [];
  const { facts: kitsuFacts, bio } = parseKitsuBio(c.description);
  const facts = mergeFacts(al, kitsuFacts);
  // The birthday snapshot links to a date page; fall back to it when neither source lists a birthday.
  if (bday && !facts.some((f) => f.key === "birthday")) facts.splice(facts.findIndex((f) => f.key !== "age") < 0 ? facts.length : facts.findIndex((f) => f.key !== "age"), 0, { key: "birthday", label: "Birthday", value: bdLabel(bday.m, bday.d) });
  const fact = (k: string) => facts.find((f) => f.key === k)?.value;
  const ranked = castRank(ranking, voiced?.character.id);
  const aliases = aliasList(c.name, c.nameJp, c.otherNames, snap?.al);
  const born = bday ? { m: bday.m, d: bday.d } : al?.dateOfBirth?.month && al.dateOfBirth.day ? { m: al.dateOfBirth.month, d: al.dateOfBirth.day } : null;
  const sign = born ? zodiac(born.m, born.d) : null;
  const span = debutAndLatest(apps);
  // Only a one-word nickname that isn't part of the name goes in the title: "Nate River "Near"", "Touka Kirishima "Rabbit"".
  // Kitsu's list only: AniList's alternatives are mostly spellings ("Ryuu" for Ryuk).
  const nick = (c.otherNames || []).find((x) => /^[\p{L}'-]{2,12}$/u.test(x) && !c.name.toLowerCase().includes(x.toLowerCase())) ?? null;
  return { c, apps, mains, home, homeApp, voiced, bday, facts, fact, bio, al, ranked, rankShow, snapped: Boolean(snap), others: others.filter((o) => o.id !== c.id).slice(0, 12), aliases, sign, span, nick };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { c, home, voiced, facts, fact, bio, aliases, nick } = await load(slug);
  // Searchers want quick facts (age, height, birthday, voice actor), so the title and snippet lead with them.
  const what = factsTitle(facts.map((f) => f.key), Boolean(voiced?.jp));
  const brief = [fact("age") && `age ${fact("age")}`, fact("height") && `${fact("height")} tall`, fact("birthday") && `birthday ${fact("birthday")}`].filter(Boolean).join(", ");
  const lead = [
    home && `${c.name} from ${home.title}${brief ? `: ${brief}` : ""}.`,
    voiced?.jp && `Voiced by ${voiced.jp.name} (Japanese)${voiced.en ? ` and ${voiced.en.name} (English)` : ""}.`,
    aliases.length > 0 && `Also known as ${aliases.slice(0, 2).join(" and ")}.`,
  ].filter(Boolean).join(" ");
  return {
    title: `${c.name}${nick ? ` "${nick}"` : ""}${home ? ` (${home.title})` : ""}: ${what ? `${what}` : "Character Profile & Appearances"}`,
    description: ((lead ? `${lead} ` : "") + (bio ? bio.slice(0, 120).replace(/\s+\S*$/, "") + "…" : `Every anime ${c.name} appears in.`)).slice(0, 300),
    alternates: { canonical: `/character/${c.slug}` },
    openGraph: c.image ? { images: [{ url: c.image }] } : undefined,
  };
}

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  const { c, apps, mains, home, homeApp, voiced, bday, facts, fact, bio, al, ranked, rankShow, snapped, others, aliases, sign, span: firsts } = await load(slug);
  const span = yearsActive(apps);
  const answer = quickAnswer({
    name: c.name, gender: fact("gender"), role: home ? (homeApp?.role === "main" ? "main" : "supporting") : null, anime: home?.title,
    age: fact("age"), height: fact("height"), birthday: fact("birthday"), sign, jp: voiced?.jp?.name, en: voiced?.en?.name,
  });
  const appLabel = (x: { anime: { title: string; startDate: string | null } }) => `${x.anime.title}${x.anime.startDate ? ` (${x.anime.startDate.slice(0, 4)})` : ""}`;
  const formats = formatMix(apps);
  const years = perYear(apps);
  const favs = al?.favourites || 0;
  // Top 8 of the show's cast by favourites, always including this character.
  const loved = ranked ? [...ranked.sorted.slice(0, 8), ...(ranked.rank > 8 ? [ranked.sorted[ranked.rank - 1]] : [])] : [];
  const stats = [
    ...(favs ? [{ label: "Favourites on AniList", value: favs.toLocaleString("en-US"), sub: "fans who marked them a favourite" }] : []),
    ...(ranked && rankShow ? [{ label: `Rank in ${rankShow}`, value: `#${ranked.rank}`, sub: snapped ? "among its characters, by favourites" : `of ${ranked.of} characters, by favourites` }] : []),
    ...(apps.length ? [{ label: "Appearances", value: String(apps.length), sub: `${mains.length} as a main character` }] : []),
    ...(span ? [{ label: "On screen", value: span.from === span.to ? String(span.from) : `${span.from}–${span.to}`, sub: span.to > span.from ? `${span.to - span.from + 1} years` : "one year", still: true }] : []),
  ];
  const voices = voiced ? [voiced.jp && { va: voiced.jp, lang: "Japanese" }, voiced.en && { va: voiced.en, lang: "English dub" }].filter((x): x is NonNullable<typeof x> => Boolean(x)) : [];
  const alternateName = [c.nameJp, ...aliases].filter(Boolean);
  const ld = { "@context": "https://schema.org", "@type": "Person", name: c.name, alternateName: alternateName.length ? alternateName : undefined, image: c.image || undefined, description: bio || undefined, url: abs(`/character/${c.slug}`) };
  return (
    <article className="container-x pb-8">
      <JsonLd data={ld} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, ...(home ? [{ href: animePath(home), label: home.title }] : []), { href: `/character/${c.slug}`, label: c.name }]}
        eyebrow={homeApp?.role === "main" ? "Main character" : "Character"}
        title={<>{c.name}{c.nameJp && <span className="mt-1 block text-lg font-semibold text-ink/60 sm:text-xl">{c.nameJp}</span>}</>}
        subtitle={home ? <>{homeApp?.role === "main" ? "Main character in" : "Appears in"} <Link href={animePath(home)} className="font-semibold text-violet-2 hover:underline">{home.title}</Link>{apps.length > 1 ? ` and ${apps.length - 1} more` : ""}.</> : undefined}
        facts={[
          ...(bday ? [{ value: bdLabel(bday.m, bday.d), label: "birthday" }] : []),
          ...(apps.length ? [{ value: String(apps.length), label: apps.length === 1 ? "appearance" : "appearances" }, { value: String(mains.length), label: "main roles" }] : []),
        ]}
        hue={300}
        backdrop={home?.cover?.large || null}
        posters={[c.image]}
      >
        {c.image && (
          <div className="relative -mt-1 aspect-[5/6] w-36 overflow-hidden rounded-2xl border border-white/15 shadow-2xl lg:hidden">
            <Image src={c.image} alt={home ? `${c.name} from ${home.title}` : c.name} fill sizes="144px" className="object-cover" priority />
          </div>
        )}
      </PageHero>
      {answer && (
        <section className="reveal mt-8 rounded-2xl border-2 border-violet/40 bg-violet/[.06] p-4 sm:p-5" aria-labelledby="answer-h">
          <h2 id="answer-h" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-violet-2"><span aria-hidden>⚡</span> {c.name} at a glance</h2>
          <p className="mt-2 text-base leading-7 text-ink sm:text-lg">{answer}</p>
          {aliases.length > 0 && <p className="mt-2 text-sm text-muted">Also known as {aliases.map((x, i) => <span key={x}>{i ? ", " : ""}<strong className="font-semibold text-ink/85">{x}</strong></span>)}.</p>}
        </section>
      )}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-start">
        <section className="card reveal p-5" aria-labelledby="facts-h">
          <h2 id="facts-h" className="text-xs font-semibold uppercase tracking-wider text-muted">{c.name}: quick facts</h2>
          <dl className="mt-3 divide-y divide-line/60 text-sm">
            {home && <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Anime</dt><dd className="text-right font-medium"><Link href={animePath(home)} className="text-violet hover:underline">{home.title}</Link></dd></div>}
            {home && <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Role</dt><dd className="text-right font-medium">{homeApp?.role === "main" ? "Main character" : "Supporting character"}</dd></div>}
            {facts.map((f) => (
              <div key={f.key} className="flex justify-between gap-4 py-2">
                <dt className="shrink-0 text-muted">{f.label}</dt>
                <dd className="text-right font-medium">{f.key === "birthday" && bday ? <Link href={bdPath(bday.m, bday.d)} className="text-violet hover:underline">{f.value}</Link> : f.value}</dd>
              </div>
            ))}
            {sign && <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Zodiac sign</dt><dd className="text-right font-medium">{sign}</dd></div>}
            {aliases.length > 0 && <div className="flex justify-between gap-4 py-2"><dt className="shrink-0 text-muted">Also known as</dt><dd className="text-right font-medium">{aliases.join(", ")}</dd></div>}
            {firsts && <div className="flex justify-between gap-4 py-2"><dt className="shrink-0 text-muted">First appearance</dt><dd className="text-right font-medium"><Link href={animePath(firsts.first.anime)} className="text-violet hover:underline">{appLabel(firsts.first)}</Link></dd></div>}
            {firsts?.latest && <div className="flex justify-between gap-4 py-2"><dt className="shrink-0 text-muted">Latest appearance</dt><dd className="text-right font-medium"><Link href={animePath(firsts.latest.anime)} className="text-violet hover:underline">{appLabel(firsts.latest)}</Link></dd></div>}
            {c.nameJp && <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Japanese name</dt><dd className="text-right font-medium">{c.nameJp}</dd></div>}
            {voices.map(({ va, lang }) => (
              <div key={va.id} className="flex items-center justify-between gap-4 py-2">
                <dt className="text-muted">{lang === "Japanese" ? "Japanese voice" : "English voice"}</dt>
                <dd><Link href={vaPath(va)} className="group flex items-center gap-2 font-medium text-violet hover:underline"><span className="relative h-7 w-7 overflow-hidden rounded-full bg-bg-2">{va.image && <Image src={va.image} alt="" fill sizes="28px" className="object-cover" />}</span>{va.name}</Link></dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 flex flex-wrap gap-2 text-sm">
            {bday && <Link href={bdPath(bday.m, bday.d)} className="chip">🎂 Everyone born on {bdLabel(bday.m, bday.d)}</Link>}
            {home && <Link href={`${animePath(home)}/cast`} className="chip">Full {home.title} cast</Link>}
            <Link href="/characters" className="chip">👤 Most popular characters</Link>
          </p>
        </section>
        <section className="card reveal p-5 sm:p-6" aria-labelledby="bio-h">
          <h2 id="bio-h" className="h-section mb-2">Who is {c.name}?</h2>
          <p className="prose-anime whitespace-pre-line">{bio || "No biography has been written for this character yet."}</p>
        </section>
      </div>
      {stats.length >= 2 && (
        <section className="reveal mt-10" aria-labelledby="numbers-h">
          <h2 id="numbers-h" className="h-section mb-3">{c.name} in numbers</h2>
          <StatTiles stats={stats} />
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {loved.length >= 3 && rankShow && (
              <BarChart
                orientation="bar"
                title={`Most-loved characters in ${rankShow}`}
                subtitle="AniList favourites"
                valueHeading="Favourites"
                highlightKey={String(voiced!.character.id)}
                labelKeys={[String(voiced!.character.id)]}
                data={loved.map((x) => ({ key: String(x.id), label: x.name, value: x.favourites, display: x.favourites.toLocaleString("en-US") }))}
              />
            )}
            <div className="space-y-3">
              {formats.length > 1 && <StackedBar title="Appearances by format" subtitle={`${apps.length} titles in total`} segments={formats} unit="titles" />}
              {years.length >= 3 && <BarChart title="Appearances per year" subtitle={years[0].label.endsWith("s") ? "Grouped by five years" : "New titles featuring them"} valueHeading="Titles" integer height={140} data={years.map((y) => ({ ...y, display: `${y.value} ${y.value === 1 ? "title" : "titles"}` }))} />}
            </div>
          </div>
        </section>
      )}

      <AdSlot slot="character-mid" />
      {apps.length > 0 && (
        <section className="mt-10">
          <h2 className="h-section mb-3">Appearances</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {apps.map(({ role, anime }) => (
              <li key={anime.id}>
                <Link href={animePath(anime)} className="card flex gap-3 p-3 transition hover:border-violet">
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(anime, "tiny") && <Image src={posterUrl(anime, "tiny")!} alt="" fill sizes="56px" className="object-cover" />}</div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-semibold">{anime.title}</p>
                    <p className="text-xs text-muted">{subtypeLabel(anime.subtype)}{anime.startDate ? ` · ${anime.startDate.slice(0, 4)}` : ""} · <span className="uppercase">{role}</span></p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {home && others.length > 0 && (
        <section className="mt-10" aria-labelledby="others-h">
          <h2 id="others-h" className="h-section mb-3">More characters from {home.title}</h2>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {others.map((o) => (
              <li key={o.id}>
                <Link href={`/character/${o.slug}`} className="group block">
                  <span className="relative block aspect-[5/6] overflow-hidden rounded-xl border border-line bg-bg-2">{o.image && <Image src={o.image} alt="" fill sizes="(max-width:640px) 33vw, 160px" className="object-cover transition duration-500 group-hover:scale-105" />}</span>
                  <span className="mt-1.5 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{o.name}</span>
                  <span className="block text-xs capitalize text-muted">{o.role}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Faq
        title={`${c.name} FAQ`}
        items={[
          { q: `What anime is ${c.name} from?`, a: home ? `${c.name} is ${homeApp?.role === "main" ? "a main character" : "a character"} in ${home.title}${apps.length > 1 ? ` and appears in ${apps.length} titles in total, including ${apps.filter((x) => x.anime.id !== home.id).slice(0, 2).map((x) => x.anime.title).join(" and ")}` : ""}.` : `${c.name}'s appearances have not been catalogued yet.` },
          ...(fact("age") ? [{ q: `How old is ${c.name}?`, a: ageAnswer(c.name, fact("age")!) }] : []),
          ...(fact("height") ? [{ q: `How tall is ${c.name}?`, a: `${c.name} is ${fact("height")} tall.` }] : []),
          ...(bday ? [{ q: `When is ${c.name}'s birthday?`, a: `${c.name}'s birthday is ${bdLabel(bday.m, bday.d)}. See every anime character born on ${bdLabel(bday.m, bday.d)} on AniLumi's birthday page.` }] : fact("birthday") ? [{ q: `When is ${c.name}'s birthday?`, a: `${c.name}'s birthday is ${fact("birthday")}.` }] : []),
          ...(voiced?.jp ? [{ q: `Who voices ${c.name}?`, a: `${c.name} is voiced by ${voiced.jp.name} in Japanese${voiced.en ? ` and by ${voiced.en.name} in the English dub` : ""}.` }] : []),
          // "Sakura Haruno" → "What is Sakura's full name?"; skipped for "Monkey D. Luffy" style names, whose first word isn't the given name.
          ...(c.name.split(" ").length === 2 ? [{ q: `What is ${c.name.split(" ")[0]}'s full name?`, a: `${c.name.split(" ")[0]}'s full name is ${c.name}${c.nameJp ? ` (${c.nameJp} in Japanese)` : ""}.${aliases.length ? ` ${c.name} is also known as ${aliases.join(", ")}.` : ""}` }] : []),
          ...(aliases.length && c.name.split(" ").length !== 2 ? [{ q: `What else is ${c.name} called?`, a: `${c.name} is also known as ${aliases.join(", ")}.` }] : []),
          ...(sign && fact("birthday") ? [{ q: `What is ${c.name}'s zodiac sign?`, a: `${c.name} is ${/^[AEIOU]/.test(sign) ? "an" : "a"} ${sign}: ${fact("gender")?.toLowerCase() === "female" ? "her" : fact("gender")?.toLowerCase() === "male" ? "his" : "the"} birthday is ${fact("birthday")}.` }] : []),
          ...(firsts ? [{ q: `When did ${c.name} first appear?`, a: `${c.name} first appeared in ${appLabel(firsts.first)}${firsts.latest ? ` and most recently appeared in ${appLabel(firsts.latest)}` : ""}.` }] : []),
          ...(c.nameJp ? [{ q: `What is ${c.name}'s Japanese name?`, a: `${c.name} is written ${c.nameJp} in Japanese.` }] : []),
          { q: `Where can I watch ${c.name}?`, a: home ? `Open the ${home.title} page for licensed streaming links and the full episode list.` : "Streaming links are listed on each anime page." },
        ]}
      />
    </article>
  );
}
