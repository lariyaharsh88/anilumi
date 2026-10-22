export const site = {
  name: "AniLumi",
  domain: "anilumi.in",
  tagline: "Anime release dates, seasonal charts & where to watch",
  description:
    "Track what's airing this week, browse seasonal anime charts, check episode release dates and find where to stream every series. Powered by community data from Kitsu.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? "https://anilumi.in" : "http://localhost:3130")).replace(/\/$/, ""),
  twitter: "@anilumi",
};

export function abs(path: string) {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}
