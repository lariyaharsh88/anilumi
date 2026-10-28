import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SceneSearch from "@/components/SceneSearch";
import Faq from "@/components/Faq";

export const metadata: Metadata = {
  title: "What Anime Is This? Find Any Anime From a Screenshot",
  description: "Upload or paste a screenshot and find the anime, the exact episode and the timestamp it's from, with a preview clip. Free, no sign-up.",
  alternates: { canonical: "/what-anime-is-this" },
};

export default function WhatAnimeIsThis() {
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/what-anime-is-this", label: "What anime is this?" }]}
        eyebrow="🔍 Scene search"
        title={<>What anime <span className="text-gradient">is this?</span></>}
        subtitle="Paste a screenshot and get the anime, the episode and the exact moment it's from, with a preview clip to check. Free, no sign-up."
        hue={190}
      />
      <SceneSearch />
      <Faq
        items={[
          { q: "How do I find an anime from a screenshot?", a: "Paste the screenshot on this page (Ctrl+V or ⌘+V), drop it in, or upload it. The search compares it against frames from tens of thousands of hours of anime and returns the anime, episode and timestamp, with a short clip so you can confirm." },
          { q: "Why didn't it find my anime?", a: "It matches frames from the actual episodes, so fan art, edited images, heavily cropped clips, mirrored videos and screenshots with big overlays usually fail. Try a clean frame from the same scene. Very new episodes may not be indexed yet." },
          { q: "What does the match percentage mean?", a: "How closely your frame matches the one found. Above 90% is almost always right; below about 87% the result is often a different show with a similar-looking scene." },
          { q: "Is it free?", a: "Yes. Each person gets a free monthly allowance of searches from trace.moe, the open scene-search engine that powers this tool. The page shows how many you have left." },
          { q: "Do you keep my screenshot?", a: "No. Your browser sends the image straight to trace.moe for matching. AniLumi never receives or stores it." },
        ]}
      />
      <p className="mt-6 text-xs text-muted">Scene matching by <a href="https://trace.moe" target="_blank" rel="noopener" className="underline">trace.moe</a>. Titles from AniList.</p>
    </div>
  );
}
