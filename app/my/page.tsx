import type { Metadata } from "next";
import MyList from "@/components/MyList";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = { title: "My list", description: "Your saved anime and their next episodes.", robots: { index: false, follow: true } };

export default function MyPage() {
  return (
    <div className="container-x pb-8">
      <PageHero eyebrow="Your anime" title={<>My <span className="text-gradient">list</span></>} subtitle="Saved in this browser, no account needed. Next-episode times refresh every time you open this page." hue={300} />
      <div className="mt-8"><MyList /></div>
    </div>
  );
}
