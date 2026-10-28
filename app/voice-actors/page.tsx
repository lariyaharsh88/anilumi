import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { popularVoiceActors, vaPath } from "@/lib/anilist";
import PageHero from "@/components/PageHero";

// Hourly: if AniList is rate-limiting during a build, the empty state clears quickly.
export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Popular Anime Voice Actors – Seiyuu Roles & Characters",
  description: "The most-followed anime voice actors in Japanese and English, with every character they've voiced, their best-known roles and roles per year.",
  alternates: { canonical: "/voice-actors" },
};

export default async function VoiceActorsHub() {
  const vas = await popularVoiceActors();
  const jp = vas.filter((v) => v.language === "Japanese");
  const other = vas.filter((v) => v.language !== "Japanese");
  const Grid = ({ items }: { items: typeof vas }) => (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {items.map((v, i) => (
        <li key={v.id}>
          <Link href={vaPath(v)} className="group block">
            <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2 transition group-hover:border-violet/60">
              {v.image && <Image src={v.image} alt="" fill sizes="(max-width:640px) 50vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />}
              <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-snow tabular-nums">#{i + 1}</span>
            </span>
            <span className="mt-2 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{v.name}</span>
            <span className="block truncate text-xs text-muted">{v.native || v.language}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/voice-actors", label: "Voice actors" }]}
        eyebrow="🎙️ Seiyuu"
        title={<>Popular anime <span className="text-gradient">voice actors</span></>}
        subtitle="The voices fans follow most. Open anyone for every character they've played, their signature roles and how busy they've been each year. Every anime also has a full cast page."
        facts={[{ value: String(vas.length), label: "voice actors" }]}
        hue={300}
        posters={jp.slice(0, 3).map((v) => v.image)}
      />
      <section className="reveal mt-10"><h2 className="h-section mb-3">Japanese voice actors</h2><Grid items={jp} /></section>
      {other.length > 0 && <section className="reveal mt-12"><h2 className="h-section mb-3">English and other dubs</h2><Grid items={other} /></section>}
      {!vas.length && <p className="card mt-10 p-8 text-center text-muted">AniList didn&apos;t answer just now. Try again in a minute.</p>}
    </div>
  );
}
