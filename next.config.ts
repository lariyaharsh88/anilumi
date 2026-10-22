import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Without this, on-demand ISR pages cache whichever variant the first visitor triggered;
  // for normal browsers that is streamed metadata in <body>, which crawlers then receive too.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.kitsu.app" },
      { protocol: "https", hostname: "media.kitsu.io" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

export default nextConfig;
