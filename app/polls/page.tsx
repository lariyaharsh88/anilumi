import type { Metadata } from "next";
import { POLLS } from "@/data/polls";
import PageHero from "@/components/PageHero";
import PollCard from "@/components/PollCard";

export const metadata: Metadata = { title: "Anime Polls: What Fans Think", description: "AniLumi's weekly anime polls and their results.", alternates: { canonical: "/polls" } };

export default function Polls() {
  const today = new Date().toISOString().slice(0, 10);
  const live = POLLS.filter((p) => p.from <= today).sort((a, b) => b.from.localeCompare(a.from));
  return (
    <div className="container-x pb-8">
      <PageHero crumbs={[{ href: "/", label: "Home" }, { href: "/polls", label: "Polls" }]} eyebrow="📊 Weekly polls" title="What anime fans think" subtitle="A new question every week. Vote to see the results." hue={262} />
      <div className="mt-10 grid gap-4 lg:grid-cols-2">{live.map((p) => <PollCard key={p.id} poll={p} />)}</div>
    </div>
  );
}
