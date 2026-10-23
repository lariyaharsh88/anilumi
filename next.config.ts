import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run alongside the dev server (NEXT_DIST_DIR=.next-prod npm run build).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Without this, on-demand ISR pages cache whichever variant the first visitor triggered;
  // for normal browsers that is streamed metadata in <body>, which crawlers then receive too.
  htmlLimitedBots: /.*/,
  // One canonical host: www.anilumi.in → anilumi.in (301).
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "www.anilumi.in" }], destination: "https://anilumi.in/:path*", permanent: true }];
  },
  images: {
    // Cloudflare Workers has no built-in Next.js image optimizer (Cloudflare Images is a paid add-on).
    // Kitsu already serves fixed sizes (tiny/small/medium/large), and the code picks the right one.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "media.kitsu.app" },
      { protocol: "https", hostname: "media.kitsu.io" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

export default nextConfig;
