# AniLumi (anilumi.in) — anime schedule, watch orders, episode countdowns

SEO-first anime site built on the free, keyless [Kitsu API](https://kitsu.io/api/edge). Next.js 15 App Router, Tailwind 4, ISR caching. No database, no API key, no sign-up.

## Why this gets traffic

The site targets the recurring, high-intent anime queries that renew every week and every season:

| Page type | Example URL | Query it ranks for |
|---|---|---|
| Anime detail | `/anime/sousou-no-frieren` | "frieren season 2 release date", "where to watch frieren" |
| Episode list | `/anime/one-piece/episodes` | "one piece episode 1150 release date" |
| Weekly schedule | `/schedule` | "anime airing today", "anime schedule this week" |
| Seasonal chart | `/season/2026/fall` | "fall 2026 anime", "winter 2027 anime list" |
| Top lists | `/top/rated`, `/top/upcoming` | "top 100 anime", "upcoming anime 2026" |
| Genre lists | `/genre/isekai?sort=rated` | "best isekai anime", "best romance anime" |

Every page ships with a unique title/description, canonical URL, Open Graph image, `BreadcrumbList`, `FAQPage` with auto-generated Q&A, and `TVSeries`/`Movie` JSON-LD with `AggregateRating` and trailer `VideoObject` (eligible for rich results). The sitemap lists ~1,000 URLs (top 500 anime + episode lists, genres, 11 seasons, rankings) and is itself cached for a day.

## What makes it different from other API wrappers

- **Auto-generated watch orders** (`/watch-order/[slug]`): walks Kitsu's sequel/prequel/side-story graph to assemble the whole franchise, slots movies and OVAs after the season they belong to, moves recaps and alternative cuts into a "safe to skip" list, and totals the runtime. Ships `ItemList` JSON-LD. Targets "X watch order" queries that are otherwise served only by hand-written editorial.
- **Binge planner** on every title: interactive hours-per-day slider → days to finish, episodes per day, weekends needed, with an option to subtract openings/endings.
- **Local-time schedule**: JST is rendered on the server; a tiny client component appends the viewer's own timezone after hydration, so the page is still fully static and cacheable.
- **Franchise panel** on each anime page linking sequels, prequels, spin-offs and specials.

## Watchlist, lists & affiliates (added 22 Oct)

- **My list** (`/my`): localStorage watchlist, no account. "+ My list" on every anime page and schedule card; the schedule gets an "Only my list" filter; `/my` refreshes next-episode times through `/api/anime?ids=`.
- **Data-templated lists**: `/best/[year]` (top rated / most popular per year), `/short-anime` (complete TV series ≤ 12/13/24/26 episodes, by genre), `/similar/[slug]` (genre-overlap recommendations), hub at `/lists`.
- **Affiliates**: `lib/affiliate.ts`. Set `NEXT_PUBLIC_AMAZON_TAG` for manga/Blu-ray buttons and `NEXT_PUBLIC_AFFILIATE_WRAP` to wrap streaming links; unset, they are plain links.

## Run

```bash
npm install
npm run dev        # http://localhost:3130
npm run build && npm start
```

Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` in production so canonicals, sitemap and OG tags use the real host. Set `NEXT_PUBLIC_ADS=1` to render the `AdSlot` placeholders once an ad network is approved.

## Architecture

- `lib/kitsu.ts` — typed client. Every call goes through `fetch` with `next.revalidate`, so a page costs the upstream a handful of requests per revalidation window, not per visitor. R18 titles are filtered out site-wide. Signed Backblaze image URLs (15-minute expiry on freshly uploaded art) are rewritten to the permanent `media.kitsu.app` host.
- `app/anime/[slug]` — ISR (1 day), trending titles prerendered at build. Falls through to on-demand rendering for every other slug.
- `app/schedule` — groups the current season's airing titles by weekday using `nextRelease` (JST). Revalidates every 30 min.
- `app/season/[year]/[season]`, `app/top/[list]`, `app/genre/[slug]` — paginated via `?page=`, max 50 pages, with `rel=prev/next`.
- `app/sitemap.ts`, `app/robots.ts` — generated; `/search` is `noindex`.

Revalidation windows: home 30 min · schedule 30 min · lists 1 h · anime detail 24 h · episodes 6 h · genres/sitemap 24 h.

## Deploy (Vercel, free tier)

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project → Import** the repo. Framework is auto-detected as Next.js; no build settings to change.
3. Environment variables: `NEXT_PUBLIC_SITE_URL=https://anilumi.in` (defaults to this in production builds), `NEXT_PUBLIC_GSC_VERIFICATION=<token>` once you add the property in Search Console, `NEXT_PUBLIC_ADS=1` when an ad network is approved.
4. Add the custom domain under **Settings → Domains** and point DNS (A `76.76.21.21` or the CNAME Vercel shows).
5. Search Console: add the domain property, choose the HTML-tag method, paste only the `content` value into `NEXT_PUBLIC_GSC_VERIFICATION`, redeploy, verify, then submit `https://<your-domain>/sitemap.xml`.

ISR needs the Node runtime, so static-export hosts (GitHub Pages) will not work. On a VPS: `npm run build && npm start` behind Nginx.

### Open Graph images
Every anime, episode and watch-order page generates its own 1200×630 card at `<page>/opengraph-image` using `next/og` (poster, title, score or countdown badge). The site-wide fallback is `/opengraph-image`.

### Episode pages
`/anime/[slug]/episode/[n]` exists for every catalogued episode, plus a synthetic page for the next episode of an airing show (driven by the series' `nextRelease`) when Kitsu's episode dates are recent enough to trust. Pages carry `TVEpisode` JSON-LD, a live countdown, local-time conversion and prev/next links.

## Switching data source

Jikan (MyAnimeList) and AniList were unreachable when this was built. `lib/kitsu.ts` is the only file that knows about the upstream shape; the `Anime`, `Episode`, `Category` types are the contract the pages depend on, so another provider can be dropped in behind the same functions.

## Growth roadmap

1. Point a domain, submit the sitemap in Search Console.
2. Add character pages (`/character/[slug]`) and studio pages — both are available from Kitsu.
3. Countdown widget on airing titles (client component, next-episode timer) for dwell time.
4. "Watch order" and "similar anime" editorial pages for the top 100 franchises.
5. Ads (AdSense/Ezoic) via `components/AdSlot.tsx`, plus Crunchyroll/Amazon affiliate links on the where-to-watch buttons.
