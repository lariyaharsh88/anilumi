import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { kitsuByAniListIds, animePath, type Anime } from "@/lib/kitsu";
import { getVoiceActor, vaIdFromParam, vaPath, cleanBio, type VoiceActor, type VaRole } from "@/lib/anilist";
import { abs } from "@/lib/site";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import BarChart from "@/components/viz/BarChart";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

export const revalidate = 604800;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ id: string }> };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const birthday = (b: VoiceActor["birth"]) => (b?.month ? `${MONTHS[b.month - 1]}${b.day ? ` ${b.day}` : ""}${b.year ? `, ${b.year}` : ""}` : null);

async function load(param: string) {
  const id = vaIdFromParam(param);
  if (!id) notFound();
  const va = await getVoiceActor(id);
  if (!va || !va.roles.length) notFound();
  return va;
}

/** One card per character (a character voiced across seasons is one role), most popular first. */
function signatureRoles(roles: VaRole[]) {
  const out = new Map<number, { character: VaRole["characters"][number]; media: VaRole["media"][]; role: string }>();
  for (const r of roles) for (const c of r.characters) {
    const hit = out.get(c.id);
    if (hit) hit.media.push(r.media);
    else out.set(c.id, { character: c, media: [r.media], role: r.role });
  }
  return [...out.values()];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const va = await load(id);
  const top = signatureRoles(va.roles).slice(0, 3);
  return {
    title: `${va.name}${va.native ? ` (${va.native})` : ""} – Voice Actor Roles & Characters`,
    description: `${va.name} is a ${va.language ? `${va.language} ` : ""}voice actor known for ${top.map((r) => `${r.character.name} in ${r.media[0].title}`).join(", ")}. Every anime role by year, with signature characters.`,
    alternates: { canonical: vaPath(va) },
    openGraph: va.imageLarge ? { images: [{ url: va.imageLarge }] } : undefined,
  };
}

export default async function VoiceActorPage({ params }: Props) {
  const { id } = await params;
  const va = await load(id);
  if (decodeURIComponent(id) !== vaPath(va).split("/").pop()) permanentRedirect(vaPath(va));
  const kitsu = await kitsuByAniListIds(va.roles.map((r) => r.media.id));
  const link = (m: VaRole["media"]): Anime | undefined => kitsu.get(m.id);
  const sig = signatureRoles(va.roles);
  const mains = va.roles.filter((r) => r.role === "MAIN").length;
  // AniList's pageInfo.total is capped and unreliable; count what we fetched (up to 100) instead.
  const capped = va.roles.length >= 95;
  const { text: bio, facts: bioFacts } = cleanBio(va.bio);
  const byYear = new Map<number, number>();
  for (const r of va.roles) if (r.media.year) byYear.set(r.media.year, (byYear.get(r.media.year) || 0) + 1);
  const years = [...byYear.keys()].sort((x, y) => x - y);
  const span = years.length ? Array.from({ length: Math.min(years[years.length - 1] - years[0] + 1, 30) }, (_, i) => years[years.length - 1] - Math.min(years[years.length - 1] - years[0], 29) + i) : [];
  const busiest = [...byYear.entries()].sort((x, y) => y[1] - x[1])[0];
  const timeline = [...va.roles].sort((x, y) => (y.media.year || 0) - (x.media.year || 0) || y.media.popularity - x.media.popularity);
  const born = birthday(va.birth);
  const facts = [
    born && { label: "Birthday", value: born },
    va.age && { label: "Age", value: String(va.age) },
    va.homeTown && { label: "Hometown", value: va.homeTown },
    va.yearsActive[0] && { label: "Active since", value: String(va.yearsActive[0]) },
    va.gender && { label: "Gender", value: va.gender },
    ...bioFacts.filter((f) => !/birth|age|hometown|gender/i.test(f.label)),
  ].filter(Boolean) as { label: string; value: string }[];

  const ld = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: va.name,
    alternateName: [va.native, ...va.alternative].filter(Boolean),
    jobTitle: "Voice actor",
    image: va.imageLarge || undefined,
    birthDate: va.birth?.year && va.birth.month && va.birth.day ? `${va.birth.year}-${String(va.birth.month).padStart(2, "0")}-${String(va.birth.day).padStart(2, "0")}` : undefined,
    url: abs(vaPath(va)),
    sameAs: [`https://anilist.co/staff/${va.id}`],
  };
  const faq: FaqItem[] = [
    { q: `What characters has ${va.name} voiced?`, a: `${va.name}'s best-known roles include ${sig.slice(0, 6).map((r) => `${r.character.name} (${r.media[0].title})`).join(", ")}. ${va.name} has voiced ${capped ? "more than 100" : va.roles.length} anime roles.` },
    ...(sig[0] ? [{ q: `What is ${va.name}'s most popular role?`, a: `${sig[0].character.name} in ${sig[0].media[0].title}, the most-watched anime ${va.name} has voiced in.` }] : []),
    ...(born ? [{ q: `When is ${va.name}'s birthday?`, a: `${va.name} was born on ${born}${va.homeTown ? ` in ${va.homeTown}` : ""}.` }] : []),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={ld} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/voice-actors", label: "Voice actors" }, { href: vaPath(va), label: va.name }]}
        eyebrow={`🎙️ ${va.language ? `${va.language} ` : ""}voice actor`}
        title={<>{va.name}{va.native && <span className="mt-1 block text-lg font-semibold text-ink/60 sm:text-xl">{va.native}</span>}</>}
        subtitle={sig.length ? <>Known for {sig.slice(0, 3).map((r, i) => <span key={r.character.id}>{i ? (i === Math.min(sig.length, 3) - 1 ? " and " : ", ") : ""}<strong className="text-ink">{r.character.name}</strong> in {r.media[0].title}</span>)}.</> : undefined}
        facts={[
          { value: `${va.roles.length}${capped ? "+" : ""}`, label: "anime roles" },
          { value: `${mains}${capped ? "+" : ""}`, label: "main roles" },
          ...(va.yearsActive[0] ? [{ value: String(va.yearsActive[0]), label: "active since" }] : []),
          ...(busiest ? [{ value: String(busiest[0]), label: `busiest year (${busiest[1]} roles)` }] : []),
        ]}
        hue={300}
        posters={[va.imageLarge]}
      >
        {va.imageLarge && <div className="relative aspect-[5/7] w-32 overflow-hidden rounded-2xl border border-white/15 shadow-2xl lg:hidden"><Image src={va.imageLarge} alt={va.name} fill sizes="128px" className="object-cover" priority /></div>}
      </PageHero>

      <section className="reveal mt-10" aria-labelledby="sig-h">
        <h2 id="sig-h" className="h-section mb-3">Best-known roles</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {sig.slice(0, 12).map((r) => {
            const k = link(r.media[0]);
            const body = (
              <>
                <span className="relative block aspect-[5/6] overflow-hidden rounded-xl border border-line bg-bg-2">
                  {r.character.image && <Image src={r.character.image} alt="" fill sizes="(max-width:640px) 50vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />}
                  {r.role === "MAIN" && <span className="absolute left-2 top-2 rounded bg-accent-strong px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Main</span>}
                </span>
                <span className="mt-2 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{r.character.name}</span>
                <span className="block truncate text-xs text-muted">{r.media[0].title}{r.media.length > 1 ? ` +${r.media.length - 1}` : ""}</span>
              </>
            );
            return <li key={r.character.id}>{k ? <Link href={animePath(k)} className="group block">{body}</Link> : <div className="group">{body}</div>}</li>;
          })}
        </ul>
      </section>

      {span.length >= 3 && (
        <section className="reveal mt-10">
          <BarChart
            title="Roles per year"
            subtitle={`Anime with ${va.name} in the cast${capped ? ", among the 100 most popular" : ""}`}
            valueHeading="Roles"
            integer
            highlightKey={busiest ? String(busiest[0]) : undefined}
            labelKeys={busiest ? [String(busiest[0])] : undefined}
            data={span.map((y) => ({ key: String(y), label: String(y).slice(2), value: byYear.get(y) || 0, display: `${byYear.get(y) || 0} roles in ${y}` }))}
          />
        </section>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="reveal min-w-0" aria-labelledby="all-h">
          <h2 id="all-h" className="h-section mb-3">All roles{capped ? " (100 most popular)" : ""}</h2>
          <ol className="card divide-y divide-line">
            {timeline.map((r) => {
              const k = link(r.media);
              return (
                <li key={r.media.id} className="flex items-center gap-3 p-2.5 text-sm">
                  <span className="w-10 shrink-0 text-xs tabular-nums text-muted">{r.media.year || "TBA"}</span>
                  <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-bg-2">{r.media.cover && <Image src={r.media.cover} alt="" fill sizes="36px" className="object-cover" />}</span>
                  <span className="min-w-0 flex-1">
                    {k ? <Link href={animePath(k)} className="block truncate font-medium text-ink hover:text-violet-2">{r.media.title}</Link> : <span className="block truncate font-medium text-ink">{r.media.title}</span>}
                    <span className="block truncate text-xs text-muted">{r.characters.map((c) => c.name).join(", ")}</span>
                  </span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${r.role === "MAIN" ? "bg-accent/20 text-accent-2" : "bg-white/5 text-muted"}`}>{r.role.toLowerCase()}</span>
                </li>
              );
            })}
          </ol>
        </section>
        <aside className="space-y-4">
          {facts.length > 0 && (
            <div className="card p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Profile</h2>
              <dl className="divide-y divide-line text-sm">
                {facts.map((f) => <div key={f.label} className="flex justify-between gap-3 py-2"><dt className="text-muted">{f.label}</dt><dd className="text-right text-ink">{f.value}</dd></div>)}
              </dl>
            </div>
          )}
          {bio && (
            <div className="card p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">About</h2>
              <p className="whitespace-pre-line text-sm leading-6 text-ink/85">{bio}</p>
              <p className="mt-2 text-xs text-muted">From <a href={`https://anilist.co/staff/${va.id}`} rel="noopener" className="underline">AniList</a>.</p>
            </div>
          )}
        </aside>
      </div>

      <AdSlot slot="va-bottom" />
      <Faq items={faq} />
    </div>
  );
}
