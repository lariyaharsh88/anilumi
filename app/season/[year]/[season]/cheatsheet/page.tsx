import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { SEASONS, cap, animePath, type Season } from "@/lib/kitsu";
import { getSeasonPreview, premiereKey, type PreviewItem } from "@/lib/preview";
import PrintButton from "@/components/PrintButton";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ year: string; season: string }> };

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const when = (d: PreviewItem["date"]) => (d.day && d.month ? `${MON[d.month - 1]} ${d.day}` : d.month ? `${MON[d.month - 1]} (TBA)` : "TBA");

function parse(year: string, season: string) {
  const y = Number(year);
  if (!SEASONS.includes(season as Season) || !(y >= 2000 && y <= new Date().getFullYear() + 2)) notFound();
  return { y, s: season as Season };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, season } = await params;
  const { y, s } = parse(year, season);
  return { title: `${cap(s)} ${y} Anime Cheat Sheet (Printable)`, robots: { index: false, follow: true }, alternates: { canonical: `/season/${y}/${s}/preview` } };
}

/** One-page printable list of the season, sorted by premiere date. The reward for the preview page's email CTA. */
export default async function Cheatsheet({ params }: Props) {
  const { year, season } = await params;
  const { y, s } = parse(year, season);
  const items = (await getSeasonPreview(y, s)).sort((a, b) => (premiereKey(a.date) || `${a.date.year}-${String(a.date.month || 13).padStart(2, "0")}-99`).localeCompare(premiereKey(b.date) || `${b.date.year}-${String(b.date.month || 13).padStart(2, "0")}-99`));
  return (
    <div className="container-x max-w-4xl py-8 print:max-w-none print:py-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">AniLumi cheat sheet</p>
          <h1 className="mt-1 text-3xl font-black">{cap(s)} {y} anime</h1>
          <p className="mt-1 text-sm text-muted">{items.length} shows, by premiere date (Japan). ★ = sequel. Updated daily at anilumi.in</p>
        </div>
        <PrintButton />
      </div>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-line text-xs text-muted"><tr><th className="py-2 pr-3 font-medium">Date</th><th className="py-2 pr-3 font-medium">Title</th><th className="py-2 pr-3 font-medium">Type</th><th className="py-2 font-medium">Studio</th><th className="py-2 pl-3 font-medium print:hidden">✓</th></tr></thead>
        <tbody className="divide-y divide-line">
          {items.map((i) => (
            <tr key={i.id} className="break-inside-avoid">
              <td className="whitespace-nowrap py-1.5 pr-3 font-semibold text-accent-2">{when(i.date)}</td>
              <td className="py-1.5 pr-3">{i.kind === "sequel" ? "★ " : ""}{i.anime ? <Link href={animePath(i.anime)} className="hover:text-violet-2">{i.anime.title}</Link> : i.title}</td>
              <td className="whitespace-nowrap py-1.5 pr-3 text-muted">{i.format}{i.episodes ? ` · ${i.episodes} ep` : ""}</td>
              <td className="py-1.5 text-muted">{i.studio || ""}</td>
              <td className="py-1.5 pl-3"><span aria-hidden className="inline-block h-3.5 w-3.5 rounded-sm border border-line" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-sm print:hidden"><Link href={`/season/${y}/${s}/preview`} className="text-violet hover:underline">← Back to the {cap(s)} {y} preview</Link></p>
    </div>
  );
}
