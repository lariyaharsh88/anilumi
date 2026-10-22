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

## Charts, tonight picker and AniList (added 22 Oct)

- **Charts** (`components/viz/`): stat tiles, bar/column, stacked bar and line charts, each with hover + keyboard tooltips and a table view. Palette validated against the `#161b28` card surface. Used on anime (score breakdown), watch-order (where the hours go, score across seasons), season, studio, schedule and home.
- **What to watch tonight** (`/tonight`): pick available time, genre, format and minimum score; returns complete titles whose real runtime fits, one per franchise, plus longer series with episodes-per-night. GET form, works without JS.
- **Next-episode sources**: Kitsu → AniList (`nextAiringEpisode`, batched, on by default, `ANILIST_ENRICH=0` to disable) → Jikan (`JIKAN_ENRICH=1`). Compare them with `npx tsx scripts/check-jikan.ts`.

## My list stats, calendar, compare (added 22 Oct)

- **My list** shows time to watch everything, days at 2 h/day, episodes in the next 7 days (shows on a break called out), a weekday chart in the viewer's time zone and a main-genre breakdown. All computed in the browser from `/api/anime?ids=` (which now uses the Kitsu → AniList → Jikan next-episode chain).
- **Calendar**: `/api/calendar?ids=…` is a subscribable iCalendar feed (next episode per airing show, premiere dates for upcoming). Google / Apple-Outlook / .ics links on My list and airing anime pages. Google needs the site on a public URL.
- **Compare**: `/compare/[a]-vs-[b]` (slugs sorted; the reverse order 308-redirects), with verdict, comparison table, grouped score-share chart, runtime bars, genre overlap and FAQ. `/compare` has a search form and genre-matched popular matchups; ~100 pairs in the sitemap.
- Kitsu gotcha: `filter[id]` is silently ignored when combined with `filter[ageRating]`; `listAnime` skips the age filter for id lookups and drops R18 afterwards.

## Airing heatmap and genre trends (added 22 Oct)

- **Airing heatmap** on `/schedule`: AniList `airingSchedules` for the next 7 days (Japanese, non-adult, non-music), bucketed by weekday × hour in the viewer's time zone. Sequential blue ramp validated as ordinal on the card surface.
- **Genre trends**: `/trends/[genre]` for 17 genres (share of new TV series per premiere year since 2000, counts per year, defining titles per decade, method note, `Dataset` JSON-LD) and `/trends` ranking genres by the 10-year change in share. Kitsu's latest year is incomplete and tagging has improved over time; pages say so.

## Where to watch by country, AniList import, drop rates, parents' guide (added 22 Oct)

- **Where to watch** (`/api/watch`, `components/WhereToWatch.tsx`, `lib/tmdb.ts`): the viewer's country (geo header, then Accept-Language, then US; overridable) and that country's providers from TMDB (JustWatch data). **Needs `TMDB_API_KEY` or `TMDB_READ_TOKEN`**; without it pages show Kitsu's region-less links exactly as before.
- **AniList import** (`/api/import/anilist?user=`): public lists only; watching, planning, paused and rewatching with episode progress, merged into My list in the browser. Per-show progress counters; "time left" subtracts watched episodes.
- **Do people finish it?**: AniList status counts give drop and completion rates against the median of the 50 most popular finished shows in the same genre.
- **Parents' guide**: AniList content tags grouped into five areas with levels from tag agreement; story-theme tags (war, crime, slavery) capped at moderate; spoiler tags counted, not named; explicit tag names never shown.

## Breaks, spoiler shield, filler and manga continuation (added 22 Oct)

- **Break / disagreement banner** (`airingNotice` in `lib/kitsu.ts`): on a break when the next episode is more than 14 days out; "sources disagree" when Kitsu and AniList differ by more than 2 days. The schedule now uses AniList times and lists shows on a break separately.
- **Spoiler shield** (`components/SpoilerGate.tsx`): hides episode titles, synopses and stills past the progress saved in My list, with per-item "show" buttons and a safe browser-tab title. A pre-paint script (`SPOILER_PREPAINT`) blurs gated content before first paint. Toggle on My list; "I've watched up to episode N" on episode pages.
- **Filler and continuation data** (`data/filler.ts`, `lib/filler.ts`): DRAFT, written from memory; every entry is `reviewed: false` and the site labels it as a draft. Verify (e.g. against animefillerlist.com and the manga), then set `reviewed: true`.
- **Dub tracker: not built.** Neither Kitsu (its `dubs` field only lists original audio) nor AniList exposes reliable dub availability.
- **Outages vs 404s**: page-deciding Kitsu lookups throw `UpstreamError` on failure, so an outage shows `app/error.tsx` and is never cached as a 404.

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
