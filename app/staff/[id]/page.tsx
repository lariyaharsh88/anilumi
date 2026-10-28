import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getVoiceActor, vaIdFromParam, vaPath, staffPath } from "@/lib/anilist";
import PersonProfile, { mainRoles } from "@/components/PersonProfile";

export const revalidate = 604800;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ id: string }> };

async function load(param: string) {
  const id = vaIdFromParam(param);
  if (!id) notFound();
  const p = await getVoiceActor(id);
  if (!p || (!p.roles.length && !p.work.length)) notFound();
  return p;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).id);
  if (p.roles.length) return { alternates: { canonical: vaPath(p) } };
  const jobs = mainRoles(p.work, 2);
  return {
    title: `${p.name}${p.native ? ` (${p.native})` : ""} – ${jobs[0] || "Anime Staff"}: Anime Credits & Works`,
    description: `${p.name}${jobs.length ? `, ${jobs.join(" and ").toLowerCase()},` : ""} worked on ${p.work.slice(0, 4).map((w) => w.media.title).join(", ")}. Every anime credit by year.`,
    alternates: { canonical: staffPath(p) },
    openGraph: p.imageLarge ? { images: [{ url: p.imageLarge }] } : undefined,
  };
}

export default async function StaffPage({ params }: Props) {
  const { id } = await params;
  const p = await load(id);
  // Anyone with voice roles keeps the voice-actor page as their main profile.
  if (p.roles.length) permanentRedirect(vaPath(p));
  if (decodeURIComponent(id) !== staffPath(p).split("/").pop()) permanentRedirect(staffPath(p));
  return <PersonProfile va={p} kind="staff" />;
}
