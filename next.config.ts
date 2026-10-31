import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run alongside the dev server (NEXT_DIST_DIR=.next-prod npm run build).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Without this, on-demand ISR pages cache whichever variant the first visitor triggered;
  // for normal browsers that is streamed metadata in <body>, which crawlers then receive too.
  htmlLimitedBots: /.*/,
  // Render's free instance has 512 MB: build with one page-generation worker and leaner webpack.
  ...(process.env.RENDER ? { experimental: { cpus: 1, webpackMemoryOptimizations: true } } : {}),
  // Baked in at build: which commit is live (/api/version; Cloudflare Workers Builds sets WORKERS_CI_COMMIT_SHA,
  // Render RENDER_GIT_COMMIT) and the public GA4 ID on Cloudflare builds (Render sets it in render.yaml).
  env: {
    BUILD_COMMIT: process.env.WORKERS_CI_COMMIT_SHA || process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "",
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID || (process.env.WORKERS_CI ? "G-V7DV9GGSDD" : ""),
  },
  // One canonical host: www.anilumi.in → anilumi.in (301).
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.anilumi.in" }], destination: "https://anilumi.in/:path*", permanent: true },
      // Episode lists moved from ?page=n to /page/n so they can be cached.
      { source: "/anime/:slug/episodes", has: [{ type: "query", key: "page", value: "(?<p>[2-9]|[1-9][0-9]+)" }], destination: "/anime/:slug/episodes/page/:p", permanent: true },
    ];
  },
  // Query-string variants of list pages render dynamically under ./q; the plain URLs stay ISR-cached.
  async rewrites() {
    return {
      beforeFiles: [
      { source: "/top/:list", has: [{ type: "query", key: "page" }], destination: "/top/:list/q" },
      { source: "/genre/:slug", has: [{ type: "query", key: "page" }], destination: "/genre/:slug/q" },
      { source: "/genre/:slug", has: [{ type: "query", key: "sort" }], destination: "/genre/:slug/q" },
      { source: "/season/:year/:season", has: [{ type: "query", key: "page" }], destination: "/season/:year/:season/q" },
      { source: "/best/:year", has: [{ type: "query", key: "page" }], destination: "/best/:year/q" },
      { source: "/best/:year", has: [{ type: "query", key: "sort" }], destination: "/best/:year/q" },
      { source: "/tonight", has: [{ type: "query", key: "minutes" }], destination: "/tonight/q" },
      { source: "/tonight", has: [{ type: "query", key: "genre" }], destination: "/tonight/q" },
      { source: "/tonight", has: [{ type: "query", key: "type" }], destination: "/tonight/q" },
      { source: "/tonight", has: [{ type: "query", key: "min" }], destination: "/tonight/q" },
      { source: "/tonight", has: [{ type: "query", key: "all" }], destination: "/tonight/q" },
      { source: "/short-anime", has: [{ type: "query", key: "page" }], destination: "/short-anime/q" },
      { source: "/short-anime", has: [{ type: "query", key: "genre" }], destination: "/short-anime/q" },
      { source: "/short-anime", has: [{ type: "query", key: "max" }], destination: "/short-anime/q" },
      ],
    };
  },
  images: {
    // Cloudflare Workers has no built-in Next.js image optimizer (Cloudflare Images is a paid add-on).
    // Kitsu already serves fixed sizes (tiny/small/medium/large), and the code picks the right one.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "media.kitsu.app" },
      { protocol: "https", hostname: "media.kitsu.io" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "s4.anilist.co" },
    ],
  },
};

export default nextConfig;
