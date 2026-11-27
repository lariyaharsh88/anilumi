import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import MadeBy from "@/components/MadeBy";
import AnswerLead from "@/components/AnswerLead";
import JoinChannels from "@/components/JoinChannels";
import { hrefIn } from "@/components/RegionalDubPage";
import { animeBySlugs, posterUrl, type Anime } from "@/lib/kitsu";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { LANG, REGIONAL_CHECKED, cheapest, dubbedIn, platformLabel, regionalDate, regionalPlatformPath, regionalPlatforms, type RegionalDub, type RegionalLang } from "@/lib/regionaldub";

/**
 * The best anime with an official Tamil or Telugu dub, ranked by fan score, as /hindi-dub/best does for Hindi
 * ("best tamil dubbed anime", "best telugu dubbed anime"). A title needs MIN_USERS Kitsu members so a handful of votes
 * can't top the list.
 */
const MIN_USERS = 2000;
type Ranked = { d: RegionalDub; a: Anime; score: number };
async function ranked(lang: RegionalLang): Promise<Ranked[]> {
  const dubs = dubbedIn(lang);
  const kitsu = await animeBySlugs(dubs.map((d) => d.s));
  return dubs.flatMap((d) => { const a = kitsu.get(d.s); return a?.rating && a.userCount >= MIN_USERS ? [{ d, a, score: a.rating }] : []; }).sort((x, y) => y.score - x.score);
}
const score10 = (r: number) => (r / 10).toFixed(1);
const where = (d: RegionalDub) => [...new Set(d.platforms.map((p) => p.name.replace(/ \(.*\)$/, "")))].slice(0, 3).join(", ");
const kindLabel = { free: "Free", subscription: "Paid", tv: "TV" } as const;

export async function regionalBestMetadata(lang: RegionalLang): Promise<Metadata> {
  const L = LANG[lang], list = await ranked(lang).catch(() => []), y = new Date().getFullYear();
  return {
    title: fitTitle([`Best ${L.name} Dubbed Anime (${y}): Top ${list.length} Ranked by Fans`, `Best ${L.name} Dubbed Anime (${y}), Ranked`, `Best ${L.name} Dubbed Anime`]),
    description: fitDescription(`The ${list.length} best anime with an official ${L.name} dub, ranked by fan score: ${list.slice(0, 4).map((r) => r.d.t).join(", ")} and more, with where each streams in India. Checked ${regionalDate()}.`),
    alternates: { canonical: `${L.path}/best` },
    ...(list.length >= 10 ? {} : { robots: { index: false, follow: true } }),
  };
}

/** /tamil-dub/best, /telugu-dub/best: every dub in the language ranked by Kitsu fan score. */
export default async function RegionalBestPage({ lang }: { lang: RegionalLang }) {
  const L = LANG[lang], other = LANG[L.other];
  const list = await ranked(lang);
  const top = list.slice(0, 10);
  const free = list.filter((r) => cheapest(r.d) === "free");
  const movies = list.filter((r) => r.a.subtype === "movie");
  const plats = regionalPlatforms(lang);
  const answer = top.length ? `By fan score, the best anime in ${L.name} are ${top.slice(0, 5).map((r) => `${r.d.t} (${score10(r.score)}/10)`).join(", ")}. All have an official ${L.name} dub${plats[0] ? `, most of them on ${platformLabel(plats[0].p)}` : ""}.` : `We don't have enough rated ${L.name} dubs to rank yet.`;
  const faq = [
    { q: `What is the best anime in ${L.name} dubbed?`, a: `By fan score, ${top.slice(0, 5).map((r) => `${r.d.t} (${score10(r.score)}/10, ${where(r.d)})`).join(", ")}.` },
    ...(free.length ? [{ q: `Which good anime are free in ${L.name}?`, a: `${free.slice(0, 6).map((r) => `${r.d.t} (${where(r.d)})`).join(", ")}, all official and free with ads.` }] : []),
    ...(movies.length ? [{ q: `What is the best anime movie in ${L.name}?`, a: `${movies.slice(0, 4).map((r) => `${r.d.t} (${score10(r.score)}/10, ${where(r.d)})`).join(", ")}.` }] : []),
    { q: "How is this list ranked?", a: `By Kitsu's average fan score, out of 10, for every anime with an official ${L.name} dub that a platform confirms and at least ${MIN_USERS.toLocaleString("en-US")} fans rating it. A high score means fans who watched it rated it well, not that everyone will.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList(`Best ${L.name} dubbed anime`, list.map((r) => ({ url: hrefIn(r.d, lang), name: `${r.d.t} (${L.name} dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: L.path, label: `${L.name} dubbed anime` }, { href: `${L.path}/best`, label: "Best" }]}
        eyebrow={`🇮🇳 ${L.name} dub · ${L.native}`}
        title={<>Best <span className="text-gradient">{L.name} dubbed</span> anime</>}
        subtitle={`Every anime with an official ${L.name} dub, ranked by what fans scored it, with where it streams in India.`}
        facts={[
          { value: String(list.length), label: "ranked" },
          { value: String(free.length), label: "free to watch" },
          ...(top[0] ? [{ value: `★ ${score10(top[0].score)}`, label: `#1: ${top[0].d.t}` }] : []),
        ]}
        hue={lang === "ta" ? 15 : 45}
        posters={top.slice(0, 3).map((r) => posterUrl(r.a, "medium"))}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href={L.path} className="chip">All {L.name} dubs</Link>
          <Link href={`${other.path}/best`} className="chip">Best {other.name} dubs</Link>
          <Link href="/hindi-dub/best" className="chip">Best Hindi dubs</Link>
          {plats.map((x) => <Link key={x.p.slug} href={regionalPlatformPath(lang, x.p.slug)} className="chip">{L.name} on {platformLabel(x.p)}</Link>)}
        </p>
      </PageHero>

      <AnswerLead checked={regionalDate()}>{answer}</AnswerLead>

      <section className="reveal pt-10" aria-labelledby="rank-h">
        <h2 id="rank-h" className="h-section mb-4">All {list.length}, ranked</h2>
        <ol className="grid gap-2 lg:grid-cols-2">
          {list.map((r, i) => (
            <li key={r.d.s} className="card flex items-center gap-3 p-2.5">
              <span className="w-7 shrink-0 text-center text-sm font-bold text-muted">{i + 1}</span>
              <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-bg-2">{posterUrl(r.a, "tiny") && <Image src={posterUrl(r.a, "tiny")!} alt={`${r.d.t} poster`} fill sizes="44px" className="object-cover" />}</span>
              <span className="min-w-0 flex-1">
                <Link href={hrefIn(r.d, lang)} className="font-semibold text-ink hover:text-violet-2">{r.d.t}</Link>
                <span className="block text-xs text-muted">{r.a.subtype === "movie" ? "Film" : r.a.episodeCount ? `${r.a.episodeCount} episodes` : "Ongoing"} · {where(r.d)}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-bold text-ink">★ {score10(r.score)}</span>
                <span className={`text-[11px] font-semibold ${cheapest(r.d) === "free" ? "text-emerald-400" : "text-muted"}`}>{kindLabel[cheapest(r.d)]}</span>
              </span>
            </li>
          ))}
        </ol>
        <MadeBy className="mt-4" method={`Ranked by Kitsu fan score; each ${L.name} dub is checked on the platform's own title page, the licensor's announcement or Indian anime news.`} date={REGIONAL_CHECKED} />
      </section>

      <JoinChannels className="mt-8" source={`${lang === "ta" ? "tamil" : "telugu"}-best`} lang={L.name} />
      <div id="faq" data-section className="pt-2"><Faq title={`Best ${L.name} dubbed anime: FAQ`} items={faq} /></div>
    </div>
  );
}
