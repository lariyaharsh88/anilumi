export const site = {
  name: "AniLumi",
  domain: "anilumi.in",
  tagline: "Anime release dates, seasonal charts & where to watch",
  description:
    "Track what's airing this week, browse seasonal anime charts, check episode release dates and find where to stream every series. Powered by community data from Kitsu.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? "https://anilumi.in" : "http://localhost:3130")).replace(/\/$/, ""),
  /** The founder's X account (@anilumi belongs to someone else), so it goes in twitter:creator, not twitter:site. */
  twitter: "@harsh_products",
  /** AniLumi's own channels: Organization sameAs and the footer. */
  channels: [
    { name: "Telegram", url: "https://t.me/anilumi_in" },
    { name: "WhatsApp", url: "https://whatsapp.com/channel/0029Vb8zz3r3rZZjTkwgpK3m" },
  ],
  /** Forwarded to the owner's inbox by Cloudflare Email Routing (15 Nov 2026). */
  email: "hello@anilumi.in",
  /** The person who runs the site (About page, Organization JSON-LD). */
  founder: {
    name: "Harsh Lariya",
    url: "https://harshlariya.in",
    /** Their accounts, shared across their products: author sameAs and the footer. */
    social: [
      { name: "X", url: "https://x.com/harsh_products" },
      { name: "Quora", url: "https://www.quora.com/profile/Harsh-Lariya-5" },
    ],
  },
};

export function abs(path: string) {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
