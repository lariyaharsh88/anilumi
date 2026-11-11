import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import MadeBy from "@/components/MadeBy";
import { hindiArtist, hindiArtistPath, hindiArtists, HINDI_VOICES_CHECKED } from "@/lib/hindivoices";
import { animePath } from "@/lib/kitsu";
import { abs } from "@/lib/site";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

function load(slug: string) {
  const a = hindiArtist(decodeURIComponent(slug));
  if (!a) notFound();
  return a;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = load((await params).slug);
  return {
    title: `${a.name}: Hindi Anime Voice Roles (${a.roles.length})${a.roles[0] ? `, ${a.roles[0].character} & More` : ""}`,
    description: fitDescription(`${a.name} voices ${a.roles.slice(0, 3).map((r) => `${r.character} in ${r.anime}`).join(", ")} in the official Hindi dubs. Every confirmed anime role, with sources.`),
    alternates: { canonical: hindiArtistPath(a) },
  };
}

export default async function HindiArtistPage({ params }: Props) {
  const a = load((await params).slug);
  const others = hindiArtists().filter((x) => x.slug !== a.slug).slice(0, 8);
  const person = { "@context": "https://schema.org", "@type": "Person", name: a.name, alternateName: a.knownAs, description: a.bio, jobTitle: "Voice artist", knowsLanguage: "Hindi", url: abs(hindiArtistPath(a)), sameAs: a.links };
  return (
    <div className="container-x pb-8">
      <JsonLd data={person} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-voice-artists", label: "Hindi voice artists" }, { href: hindiArtistPath(a), label: a.name }]}
        eyebrow="🇮🇳 Hindi voice artist"
        title={a.name}
        subtitle={a.bio}
        facts={[{ value: String(a.roles.length), label: "confirmed anime roles" }, { value: String(new Set(a.roles.map((r) => r.dub)).size), label: "dubs" }]}
        hue={30}
      />
      <MadeBy className="mt-4" method={`Each role is confirmed by an official credit, the studio's or artist's own post, or two independent reports; sources are linked under every role.${HINDI_VOICES_CHECKED ? ` Checked ${HINDI_VOICES_CHECKED}.` : ""}`} />
      <section className="reveal mt-8" aria-labelledby="roles-h">
        <h2 id="roles-h" className="h-section mb-3">{a.name}&apos;s anime roles in Hindi</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {a.roles.map((r) => (
            <li key={`${r.character}-${r.anime}`} className="card p-3">
              <p className="font-semibold text-ink">{r.character}</p>
              <p className="text-sm text-muted">{r.slug ? <Link href={animePath({ slug: r.slug })} className="text-violet hover:underline">{r.anime}</Link> : r.anime} · {r.dub}</p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted">{r.sources.slice(0, 3).map((u, i) => <a key={u} href={u} target="_blank" rel="noopener nofollow" className="underline">Source {i + 1}</a>)}</p>
            </li>
          ))}
        </ul>
      </section>
      {a.links?.length ? <p className="mt-6 flex flex-wrap gap-2 text-sm">{a.links.map((u) => <a key={u} href={u} target="_blank" rel="noopener nofollow" className="chip">{new URL(u).hostname.replace(/^www\./, "")}</a>)}</p> : null}
      {others.length > 0 && <p className="mt-8 text-sm text-muted">More Hindi voice artists: {others.map((o, i) => <span key={o.slug}>{i ? ", " : ""}<Link href={hindiArtistPath(o)} className="text-violet hover:underline">{o.name}</Link></span>)}. <Link href="/hindi-dub" className="text-violet hover:underline">Anime with a Hindi dub →</Link></p>}
      <Faq title={`${a.name} FAQ`} items={[
        { q: `Who does ${a.name} voice in anime?`, a: `${a.roles.map((r) => `${r.character} in ${r.anime} (${r.dub})`).join("; ")}.` },
        ...a.roles.slice(0, 3).map((r) => ({ q: `Who voices ${r.character} in Hindi?`, a: `${a.name} voices ${r.character} in the official Hindi dub of ${r.anime} (${r.dub}).` })),
      ]} />
    </div>
  );
}
