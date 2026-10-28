import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getVoiceActor, vaIdFromParam, vaPath, staffPath } from "@/lib/anilist";
import PersonProfile, { signatureRoles } from "@/components/PersonProfile";

export const revalidate = 604800;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ id: string }> };

async function load(param: string) {
  const id = vaIdFromParam(param);
  if (!id) notFound();
  const va = await getVoiceActor(id);
  if (!va || (!va.roles.length && !va.work.length)) notFound();
  return va;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const va = await load((await params).id);
  if (!va.roles.length) return { alternates: { canonical: staffPath(va) } };
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
  // People without voice roles (directors, composers…) live under /staff.
  if (!va.roles.length) permanentRedirect(staffPath(va));
  if (decodeURIComponent(id) !== vaPath(va).split("/").pop()) permanentRedirect(vaPath(va));
  return <PersonProfile va={va} kind="voice" />;
}
