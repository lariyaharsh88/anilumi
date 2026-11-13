import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SceneSearch from "@/components/SceneSearch";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { abs } from "@/lib/site";
import { ORG_ID, SITE_ID } from "@/lib/ld";
import Link from "@/components/Link";
import { seasonOf } from "@/lib/kitsu";

// Daily, so the "browse by season" link follows the current season.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "What Anime Is This? Free Screenshot Search, Episode & Time",
  description: fitDescription("Paste or upload a screenshot to find the anime, the exact episode and the minute it's from, in seconds. Free, no sign-up, with where to watch it next."),
  alternates: { canonical: "/what-anime-is-this" },
};

export default function WhatAnimeIsThis() {
  return (
    <div className="container-x pb-8">
      {/* A free web app, stated plainly for search engines and AI assistants that recommend tools. */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "@id": `${abs("/what-anime-is-this")}#app`,
        name: "AniLumi: What Anime Is This?",
        url: abs("/what-anime-is-this"),
        description: "Find the anime, the episode and the timestamp from a screenshot, with a preview clip, then where to watch it, its watch order and whether it has an official Hindi dub.",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: ["Paste, drop, upload or link a screenshot", "Anime title, episode and timestamp with a preview clip", "Where to watch, watch order and Hindi dub for each match", "No sign-up; the image is not stored"],
        isPartOf: { "@id": SITE_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "en",
      }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/what-anime-is-this", label: "What anime is this?" }]}
        eyebrow="🔍 Scene search"
        title={<>What anime <span className="text-gradient">is this?</span></>}
        subtitle="Paste a screenshot and get the anime, the episode and the exact moment it's from, with a preview clip to check. Free, no sign-up."
        hue={190}
      />
      <SceneSearch />

      <section className="reveal pt-12" aria-labelledby="how-h">
        <h2 id="how-h" className="h-section mb-4">How the screenshot search works</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            ["1", "Add a frame", "Paste a screenshot (Ctrl+V or ⌘+V), drop an image, upload one, or paste an image link. A still from a video works best."],
            ["2", "It's matched frame by frame", "trace.moe compares it with frames from tens of thousands of hours of anime episodes, not with posters or fan art."],
            ["3", "Check the clip, then watch", "You get the anime, the episode and the minute, with a short preview clip, plus where to stream it, its watch order and whether it has a Hindi dub."],
          ].map(([n, h, t]) => (
            <li key={n} className="card p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-violet/15 text-sm font-bold text-violet-2">{n}</span>
              <h3 className="mt-2 font-semibold text-ink">{h}</h3>
              <p className="mt-1 text-sm leading-6 text-ink/85">{t}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="reveal pt-12" aria-labelledby="tips-h">
        <h2 id="tips-h" className="h-section mb-4">Tips for the best match</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="card border-emerald-500/30 p-4">
            <h3 className="font-semibold text-emerald-300">✓ Works well</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink/90">
              <li>A clean frame straight from the episode, the bigger the better</li>
              <li>Cropping off black bars, subtitles burned into the edges, or a phone&apos;s status bar</li>
              <li>A frame from the middle of a scene rather than a fade or a flash</li>
              <li>Trying two or three frames from the same scene if the first match is under 87%</li>
            </ul>
          </div>
          <div className="card border-accent/30 p-4">
            <h3 className="font-semibold text-accent-2">✗ Usually fails</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink/90">
              <li>Fan art, edits, memes with big captions, and posters or key visuals</li>
              <li>Mirrored, zoomed or heavily filtered clips (common on TikTok and Reels)</li>
              <li>Openings and endings shared by many episodes: you get the show, but the episode may be any of them</li>
              <li>Episodes from the last few days, which may not be indexed yet</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="reveal pt-12" aria-labelledby="else-h">
        <h2 id="else-h" className="h-section mb-1">No screenshot? Other ways to find an anime</h2>
        <p className="mb-4 text-sm text-muted">If all you remember is the story, a character or the vibe:</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["/search", "🔎 Search by title or character", "Type any part of a name, in English or romaji."],
            ["/genre", "🏷️ Browse by genre and theme", "Isekai, time travel, sports, romance and hundreds more."],
            ["/random-anime-generator", "🎲 Random anime generator", "Pick a mood and get three picks you can share."],
            [`/season/${seasonOf().year}/${seasonOf().season}`, "📅 Browse by season", "Remember roughly when it aired? Every season back to the 1960s."],
          ].map(([href, h, t]) => (
            <li key={href}><Link href={href} className="card block h-full p-4 transition hover:border-violet/60"><span className="font-semibold text-ink">{h}</span><span className="mt-1 block text-sm text-muted">{t}</span></Link></li>
          ))}
        </ul>
      </section>
      <Faq
        items={[
          { q: "How do I find an anime from a screenshot?", a: "Paste the screenshot on this page (Ctrl+V or ⌘+V), drop it in, or upload it. The search compares it against frames from tens of thousands of hours of anime and returns the anime, episode and timestamp, with a short clip so you can confirm." },
          { q: "Why didn't it find my anime?", a: "It matches frames from the actual episodes, so fan art, edited images, heavily cropped clips, mirrored videos and screenshots with big overlays usually fail. Try a clean frame from the same scene. Very new episodes may not be indexed yet." },
          { q: "What does the match percentage mean?", a: "How closely your frame matches the one found. Above 90% is almost always right; below about 87% the result is often a different show with a similar-looking scene." },
          { q: "Is it free?", a: "Yes. Each person gets a free monthly allowance of searches from trace.moe, the open scene-search engine that powers this tool. The page shows how many you have left." },
          { q: "Can it find an anime from a TikTok or Instagram clip?", a: "Often, if you screenshot a clean frame. Clips on TikTok and Reels are frequently mirrored, zoomed or filtered to avoid copyright matching, which also stops this search; crop to the picture and try a frame without captions." },
          { q: "Can it tell me the anime from a GIF or a video?", a: "Pause on a clear frame and take a screenshot, then paste that. The search works on single images; for a GIF, any sharp frame from it will do." },
          { q: "Do you keep my screenshot?", a: "No. Your browser sends the image straight to trace.moe for matching. AniLumi never receives or stores it." },
        ]}
      />
      <p className="mt-6 text-xs text-muted">Scene matching by <a href="https://trace.moe" target="_blank" rel="noopener nofollow" className="underline">trace.moe</a>. Titles from AniList.</p>
    </div>
  );
}
