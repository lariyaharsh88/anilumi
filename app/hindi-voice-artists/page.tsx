import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import MadeBy from "@/components/MadeBy";
import { hindiArtists, hindiArtistPath, HINDI_VOICES_CHECKED } from "@/lib/hindivoices";
import { itemList } from "@/lib/ld";

export const revalidate = 86400;

const FAMOUS = ["Goku", "Luffy", "Gojo", "Vegeta", "Doraemon", "Shin-chan", "Denji", "Tanjiro", "Anya"];
const famous = (all: ReturnType<typeof hindiArtists>) => FAMOUS.filter((f) => all.some((a) => a.roles.some((r) => r.character.includes(f)))).slice(0, 3);

export function generateMetadata(): Metadata {
  const all = hindiArtists();
  return {
    // Named after characters with a confirmed Hindi voice on the list, most famous first.
    title: `Hindi Anime Dub Voice Artists (${all.length}): Who Voices ${famous(all).join(", ")} & More`,
    description: fitDescription(`The Indian voice artists behind official Hindi anime dubs: ${all.slice(0, 4).map((a) => a.name).join(", ")} and more, with every confirmed character.`),
    alternates: { canonical: "/hindi-voice-artists" },
  };
}

export default function HindiVoiceArtists() {
  const all = hindiArtists();
  if (!all.length) notFound();
  const roles = all.reduce((n, a) => n + a.roles.length, 0);
  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Hindi anime dub voice artists", all.map((a) => ({ url: hindiArtistPath(a), name: a.name })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dub" }, { href: "/hindi-voice-artists", label: "Hindi voice artists" }]}
        eyebrow="🇮🇳 Hindi dub"
        title={<>Who voices anime <span className="text-gradient">in Hindi?</span></>}
        subtitle="The Indian voice artists behind official Hindi anime dubs, with the characters they voice. Every role is confirmed by an official credit, the studio or the artist, or two independent reports."
        facts={[{ value: String(all.length), label: "voice artists" }, { value: String(roles), label: "confirmed roles" }]}
        hue={30}
      />
      <MadeBy className="mt-4" method={`Roles come from platform credits, dubbing studios' and artists' own posts, and news interviews; fan wikis alone don't count.${HINDI_VOICES_CHECKED ? ` Checked ${HINDI_VOICES_CHECKED}.` : ""}`} />
      <ul className="mt-8 grid gap-3 md:grid-cols-2">
        {all.map((a) => (
          <li key={a.slug}>
            <Link href={hindiArtistPath(a)} className="card group block p-4 transition hover:border-violet/60">
              <span className="font-bold text-ink group-hover:text-violet-2">{a.name}</span>
              <span className="mt-1 block text-sm text-muted">{a.roles.slice(0, 4).map((r) => `${r.character} (${r.anime})`).join(" · ")}{a.roles.length > 4 ? ` · +${a.roles.length - 4} more` : ""}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">Looking for where to watch? See every <Link href="/hindi-dub" className="text-violet hover:underline">anime with an official Hindi dub</Link>.</p>
      <Faq title="Hindi anime voice artists FAQ" items={[
        ...all.slice(0, 1).map((a) => ({ q: `Who is ${a.name}?`, a: a.bio })),
        { q: "How are these roles checked?", a: "Each role needs an official credit (the streaming platform or channel), a post by the dubbing studio or the artist, or two independent news reports or interviews. Fan wikis alone aren't enough, so some well-known voices may be missing until they're confirmed." },
      ]} />
    </div>
  );
}
