import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCharacterBySlug, getCharacterAppearances, animePath, posterUrl, subtypeLabel } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCharacterBySlug(decodeURIComponent(slug));
  if (!c) notFound();
  const apps = await getCharacterAppearances(c.id);
  const from = apps.find((a) => a.role === "main")?.anime.title || apps[0]?.anime.title;
  return {
    title: `${c.name}${from ? ` (${from})` : ""} – Character Profile & Appearances`,
    description: `${c.name}${c.nameJp ? ` (${c.nameJp})` : ""}: ${c.description ? c.description.slice(0, 140).replace(/\s+\S*$/, "") + "…" : `every anime ${c.name} appears in, with roles and where to watch.`}`,
    alternates: { canonical: `/character/${c.slug}` },
    openGraph: c.image ? { images: [{ url: c.image }] } : undefined,
  };
}

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  const c = await getCharacterBySlug(decodeURIComponent(slug));
  if (!c) notFound();
  const apps = await getCharacterAppearances(c.id);
  const mains = apps.filter((a) => a.role === "main");
  const home = mains[0]?.anime || apps[0]?.anime;
  const ld = { "@context": "https://schema.org", "@type": "Person", name: c.name, alternateName: c.nameJp || undefined, image: c.image || undefined, description: c.description || undefined, url: abs(`/character/${c.slug}`) };
  return (
    <article className="container-x py-8">
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ href: "/", label: "Home" }, ...(home ? [{ href: animePath(home), label: home.title }] : []), { href: `/character/${c.slug}`, label: c.name }]} />
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative aspect-[5/6] w-44 shrink-0 overflow-hidden rounded-xl border border-line bg-bg-2 sm:w-56">{c.image && <Image src={c.image} alt={c.name} fill sizes="224px" className="object-cover" priority />}</div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{c.name}</h1>
          {c.nameJp && <p className="mt-1 text-muted">{c.nameJp}</p>}
          {home && <p className="mt-2 text-sm text-muted">{mains.length ? "Main character in" : "Appears in"} <Link href={animePath(home)} className="text-violet hover:underline">{home.title}</Link>{apps.length > 1 ? ` and ${apps.length - 1} more` : ""}</p>}
          <p className="prose-anime mt-4 whitespace-pre-line">{c.description || "No biography has been written for this character yet."}</p>
        </div>
      </div>
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
          ...(c.nameJp ? [{ q: `What is ${c.name}'s Japanese name?`, a: `${c.name} is written ${c.nameJp} in Japanese.` }] : []),
          { q: `Where can I watch ${c.name}?`, a: home ? `Open the ${home.title} page for licensed streaming links and the full episode list.` : "Streaming links are listed on each anime page." },
        ]}
      />
    </article>
  );
}
