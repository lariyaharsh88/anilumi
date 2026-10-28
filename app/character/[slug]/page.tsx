import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCharacterBySlug, getCharacterAppearances, getCharacters, animePath, posterUrl, subtypeLabel } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import { getCast, getAniListCharacter, sameName, vaPath } from "@/lib/anilist";
import { parseKitsuBio, mergeFacts, factsTitle, ageAnswer } from "@/lib/charfacts";
import { formatMix, yearsActive, perYear, castRank } from "@/lib/charstats";
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
  const cast = home ? await getCast(home.id, 25) : null;
  const jpKey = (s: string | null | undefined) => (s || "").replace(/[\s・·=＝]/g, "");
  const voiced = cast?.entries.find((e) => sameName(e.character.name, c.name) || (c.nameJp && jpKey(e.character.native) === jpKey(c.nameJp)));
  const bday = birthdayFor(c.name, apps.map((x) => x.anime.slug));
  const [al, others] = await Promise.all([
    voiced ? getAniListCharacter(voiced.character.id) : null,
    home ? getCharacters(home.id, 13) : [],
  ]);
  const { facts: kitsuFacts, bio } = parseKitsuBio(c.description);
  const facts = mergeFacts(al, kitsuFacts);
  // The birthday snapshot links to a date page; fall back to it when neither source lists a birthday.
  if (bday && !facts.some((f) => f.key === "birthday")) facts.splice(facts.findIndex((f) => f.key !== "age") < 0 ? facts.length : facts.findIndex((f) => f.key !== "age"), 0, { key: "birthday", label: "Birthday", value: bdLabel(bday.m, bday.d) });
  const fact = (k: string) => facts.find((f) => f.key === k)?.value;
  const ranked = castRank((cast?.entries || []).map((e) => e.character), voiced?.character.id);
  return { c, apps, mains, home, homeApp, voiced, bday, facts, fact, bio, al, ranked, others: others.filter((o) => o.id !== c.id).slice(0, 12) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { c, home, voiced, facts, fact, bio } = await load(slug);
  // Searchers want quick facts (age, height, birthday, voice actor), so the title and snippet lead with them.
  const what = factsTitle(facts.map((f) => f.key), Boolean(voiced?.jp));
  const brief = [fact("age") && `age ${fact("age")}`, fact("height") && `${fact("height")} tall`, fact("birthday") && `birthday ${fact("birthday")}`].filter(Boolean).join(", ");
  const lead = [
    home && `${c.name} from ${home.title}${brief ? `: ${brief}` : ""}.`,
    voiced?.jp && `Voiced by ${voiced.jp.name} (Japanese)${voiced.en ? ` and ${voiced.en.name} (English)` : ""}.`,
  ].filter(Boolean).join(" ");
  return {
    title: `${c.name}${home ? ` (${home.title})` : ""}: ${what ? `${what}` : "Character Profile & Appearances"}`,
    description: ((lead ? `${lead} ` : "") + (bio ? bio.slice(0, 120).replace(/\s+\S*$/, "") + "…" : `Every anime ${c.name} appears in.`)).slice(0, 300),
    alternates: { canonical: `/character/${c.slug}` },
    openGraph: c.image ? { images: [{ url: c.image }] } : undefined,
  };
}

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  const { c, apps, mains, home, homeApp, voiced, bday, facts, fact, bio, al, ranked, others } = await load(slug);
  const span = yearsActive(apps);
  const formats = formatMix(apps);
  const years = perYear(apps);
  const favs = al?.favourites || 0;
  // Top 8 of the show's cast by favourites, always including this character.
  const loved = ranked ? [...ranked.sorted.slice(0, 8), ...(ranked.rank > 8 ? [ranked.sorted[ranked.rank - 1]] : [])] : [];
  const stats = [
    ...(favs ? [{ label: "Favourites on AniList", value: favs.toLocaleString("en-US"), sub: "fans who marked them a favourite" }] : []),
    ...(ranked && home ? [{ label: `Rank in ${home.title}`, value: `#${ranked.rank}`, sub: `of ${ranked.of} characters, by favourites` }] : []),
    ...(apps.length ? [{ label: "Appearances", value: String(apps.length), sub: `${mains.length} as a main character` }] : []),
    ...(span ? [{ label: "On screen", value: span.from === span.to ? String(span.from) : `${span.from}–${span.to}`, sub: span.to > span.from ? `${span.to - span.from + 1} years` : "one year", still: true }] : []),
  ];
  const voices = voiced ? [voiced.jp && { va: voiced.jp, lang: "Japanese" }, voiced.en && { va: voiced.en, lang: "English dub" }].filter((x): x is NonNullable<typeof x> => Boolean(x)) : [];
  const ld = { "@context": "https://schema.org", "@type": "Person", name: c.name, alternateName: c.nameJp || undefined, image: c.image || undefined, description: bio || undefined, url: abs(`/character/${c.slug}`) };
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
            <Image src={c.image} alt={c.name} fill sizes="144px" className="object-cover" priority />
          </div>
        )}
      </PageHero>
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-start">
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
          </p>
        </section>
        <section className="card reveal p-5 sm:p-6" aria-labelledby="bio-h">
          <h2 id="bio-h" className="h-section mb-2">Biography</h2>
          <p className="prose-anime whitespace-pre-line">{bio || "No biography has been written for this character yet."}</p>
        </section>
      </div>
      {stats.length >= 2 && (
        <section className="reveal mt-10" aria-labelledby="numbers-h">
          <h2 id="numbers-h" className="h-section mb-3">{c.name} in numbers</h2>
          <StatTiles stats={stats} />
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {loved.length >= 3 && home && (
              <BarChart
                orientation="bar"
                title={`Most-loved characters in ${home.title}`}
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
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(anime, "small") && <Image src={posterUrl(anime, "small")!} alt="" fill sizes="56px" className="object-cover" />}</div>
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
          ...(c.nameJp ? [{ q: `What is ${c.name}'s Japanese name?`, a: `${c.name} is written ${c.nameJp} in Japanese.` }] : []),
          { q: `Where can I watch ${c.name}?`, a: home ? `Open the ${home.title} page for licensed streaming links and the full episode list.` : "Streaming links are listed on each anime page." },
        ]}
      />
    </article>
  );
}
