import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// SEO-tool and AI-training crawlers fetch every URL and send no visitors; on a CPU-metered host they
// cost real money. Search engines and AI *search* bots (OAI-SearchBot, PerplexityBot) stay allowed.
const BLOCKED = [
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot", "BLEXBot", "PetalBot", "SeekportBot", "serpstatbot", "Barkrowler",
  "GPTBot", "CCBot", "ClaudeBot", "anthropic-ai", "Bytespider", "meta-externalagent", "Amazonbot", "Applebot-Extended", "Google-Extended", "cohere-ai", "Diffbot", "ImagesiftBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/my/wrapped"], disallow: ["/search", "/my", "/api/", "/embed/", "/random", "/quiz/results", "/tier-list?", "/*/q$"] },
      { userAgent: BLOCKED, disallow: "/" },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
