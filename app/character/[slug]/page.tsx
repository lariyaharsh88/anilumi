import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCharacterBySlug, getCharacterAppearances, animePath, posterUrl, subtypeLabel } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import { getCast, sameName, vaPath } from "@/lib/anilist";
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
  const home = mains[0]?.anime || apps[0]?.anime;
  const cast = home ? await getCast(home.id, 25) : null;
  const jpKey = (s: string | null | undefined) => (s || "").replace(/[\s・·=＝]/g, "");
  const voiced = cast?.entries.find((e) => sameName(e.character.name, c.name) || (c.nameJp && jpKey(e.character.native) === jpKey(c.nameJp)));
  const bday = birthdayFor(c.name, apps.map((x) => x.anime.slug));
  return { c, apps, mains, home, voiced, bday };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { c, home, voiced, bday } = await load(slug);
  // Searchers want quick facts (birthday, voice actor), so the title and snippet lead with them.
  const facts = [bday && "Birthday", voiced?.jp && "Voice Actor"].filter(Boolean).join(", ");
  const lead = [
    home && `${c.name} is a character in ${home.title}.`,
    bday && `Birthday: ${bdLabel(bday.m, bday.d)}.`,
    voiced?.jp && `Voiced by ${voiced.jp.name} (Japanese)${voiced.en ? ` and ${voiced.en.name} (English)` : ""}.`,
  ].filter(Boolean).join(" ");
  return {
    title: `${c.name}${home ? ` (${home.title})` : ""}: ${facts ? `${facts} & Profile` : "Character Profile & Appearances"}`,
    description: (lead ? `${lead} ` : "") + (c.description ? c.description.slice(0, 120).replace(/\s+\S*$/, "") + "…" : `Every anime ${c.name} appears in.`),
    alternates: { canonical: `/character/${c.slug}` },
    openGraph: c.image ? { images: [{ url: c.image }] } : undefined,
  };
}

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  const { c, apps, mains, home, voiced, bday } = await load(slug);
  const voices = voiced ? [voiced.jp && { va: voiced.jp, lang: "Japanese" }, voiced.en && { va: voiced.en, lang: "English dub" }].filter((x): x is NonNullable<typeof x> => Boolean(x)) : [];
  const ld = { "@context": "https://schema.org", "@type": "Person", name: c.name, alternateName: c.nameJp || undefined, image: c.image || undefined, description: c.description || undefined, url: abs(`/character/${c.slug}`) };
  return (
    <article className="container-x pb-8">
      <JsonLd data={ld} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, ...(home ? [{ href: animePath(home), label: home.title }] : []), { href: `/character/${c.slug}`, label: c.name }]}
        eyebrow={mains.length ? "Main character" : "Character"}
        title={<>{c.name}{c.nameJp && <span className="mt-1 block text-lg font-semibold text-ink/60 sm:text-xl">{c.nameJp}</span>}</>}
        subtitle={home ? <>{mains.length ? "Main character in" : "Appears in"} <Link href={animePath(home)} className="font-semibold text-violet-2 hover:underline">{home.title}</Link>{apps.length > 1 ? ` and ${apps.length - 1} more` : ""}.</> : undefined}
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
      {bday && (
        <p className="mt-6 text-sm">
          <Link href={bdPath(bday.m, bday.d)} className="chip">🎂 Born on {bdLabel(bday.m, bday.d)}: see every character who shares it →</Link>
        </p>
      )}
      {voices.length > 0 && (
        <section className="mt-8 flex flex-wrap items-center gap-3" aria-label="Voiced by">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Voiced by</span>
          {voices.map(({ va, lang }) => (
            <Link key={va.id} href={vaPath(va)} className="card group flex items-center gap-2.5 py-1.5 pl-1.5 pr-4 transition hover:border-violet/60">
              <span className="relative h-10 w-10 overflow-hidden rounded-full bg-bg-2">{va.image && <Image src={va.image} alt="" fill sizes="40px" className="object-cover" />}</span>
              <span><span className="block text-sm font-semibold text-ink group-hover:text-violet-2">{va.name}</span><span className="block text-[11px] text-muted">{lang}</span></span>
            </Link>
          ))}
          {home && <Link href={`${animePath(home)}/cast`} className="text-sm text-violet hover:text-violet-2">Full {home.title} cast →</Link>}
        </section>
      )}
      <section className="card reveal mt-8 max-w-4xl p-5 sm:p-6">
        <h2 className="h-section mb-2">Biography</h2>
        <p className="prose-anime whitespace-pre-line">{c.description || "No biography has been written for this character yet."}</p>
      </section>
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
      <Faq
        title={`${c.name} FAQ`}
        items={[
          { q: `What anime is ${c.name} from?`, a: home ? `${c.name} is ${mains.length ? "a main character" : "a character"} in ${home.title}${apps.length > 1 ? ` and appears in ${apps.length} titles in total, including ${apps.slice(1, 3).map((a) => a.anime.title).join(" and ")}` : ""}.` : `${c.name}'s appearances have not been catalogued yet.` },
          ...(bday ? [{ q: `When is ${c.name}'s birthday?`, a: `${c.name}'s birthday is ${bdLabel(bday.m, bday.d)}. See every anime character born on ${bdLabel(bday.m, bday.d)} on AniLumi's birthday page.` }] : []),
          ...(voiced?.jp ? [{ q: `Who voices ${c.name}?`, a: `${c.name} is voiced by ${voiced.jp.name} in Japanese${voiced.en ? ` and by ${voiced.en.name} in the English dub` : ""}.` }] : []),
          ...(c.nameJp ? [{ q: `What is ${c.name}'s Japanese name?`, a: `${c.name} is written ${c.nameJp} in Japanese.` }] : []),
          { q: `Where can I watch ${c.name}?`, a: home ? `Open the ${home.title} page for licensed streaming links and the full episode list.` : "Streaming links are listed on each anime page." },
        ]}
      />
    </article>
  );
}
