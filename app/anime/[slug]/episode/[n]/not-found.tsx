"use client";
import Link from "@/components/Link";
import { usePathname } from "next/navigation";

export default function EpisodeNotFound() {
  const path = usePathname() || "";
  const slug = path.split("/")[2];
  return (
    <div className="container-x py-24 text-center">
      <p className="text-6xl font-black text-accent">404</p>
      <h1 className="mt-2 text-2xl font-bold">That episode isn&apos;t in the catalogue yet.</h1>
      <p className="mt-2 text-muted">It may not have aired, or the number is off. The episode list has everything on record.</p>
      <div className="mt-6 flex justify-center gap-3">
        {slug && <Link href={`/anime/${slug}/episodes`} className="btn-primary">Episode list</Link>}
        {slug && <Link href={`/anime/${slug}`} className="btn-outline">Series page</Link>}
      </div>
    </div>
  );
}
