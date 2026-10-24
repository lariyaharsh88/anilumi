import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import WrappedCard from "@/components/WrappedCard";

export const metadata: Metadata = {
  title: `My Anime Wrapped ${new Date().getFullYear()} – Your Year in Anime`,
  description: "Turn your anime list into a shareable card: hours watched, episodes, top genres and your anime personality. No account; it stays in your browser.",
  alternates: { canonical: "/my/wrapped" },
};

export default function WrappedPage() {
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/my", label: "My list" }, { href: "/my/wrapped", label: "Wrapped" }]}
        eyebrow="✨ Your year in anime"
        title={<>My anime <span className="text-gradient">Wrapped</span></>}
        subtitle="Hours watched, top genres and your anime personality, from the list saved in this browser. Download the card and share it anywhere."
        hue={300}
      />
      <WrappedCard />
    </div>
  );
}
