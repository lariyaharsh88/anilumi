# AniLumi: database features and lead capture plan

Status: **Phase A built 29 Oct 2026** (live once `MONGODB_URI` and `ADMIN_TOKEN` are set in Render). Phase B waits on a Resend key.

Local development uses `MONGODB_DB=anilumi_test` in `.env.local`, so tests never touch the production `anilumi` database.

## Goal

Add community features that need storage (ratings, reactions, hype votes, polls) and turn visitors into
an email list plus partner enquiries, without logins, without slowing the cached pages, and on free plans.

## What you set up (before or during build)

| When | What | Where |
|---|---|---|
| Phase A | MongoDB Atlas **M0 free** cluster, region **AWS Singapore (ap-southeast-1)** | cloud.mongodb.com |
| Phase A | Database user with read/write; Network Access `0.0.0.0/0` (Render free has no fixed IP) | Atlas |
| Phase A | `MONGODB_URI` = the `mongodb+srv://…` connection string | Render → anilumi → Environment |
| Phase A | `ADMIN_TOKEN` = any long random password (for `/admin`) | Render |
| Phase A | `LEADS_NOTIFY_EMAIL` = where partner enquiries should go (used from Phase B) | Render |
| Phase B | Resend account, verify the `anilumi.in` domain (3 DNS records at GoDaddy), `RESEND_API_KEY` | resend.com, GoDaddy, Render |
| Phase B | `CRON_SECRET` = another long random string | Render + GitHub repo secrets |

I never see or type the secrets; you paste them into Render. Until `MONGODB_URI` exists, every widget below
stays hidden and the site works exactly as today.

## How it fits the current site

- Pages stay ISR-cached. Database widgets are small client components that call `/api/*`, so a page render
  never waits on MongoDB. The one exception: the anime page reads cached rating totals (refreshed hourly)
  for the Google rating stars.
- No accounts. Each browser gets an anonymous visitor id cookie (`al_vid`, random, 1 year). Votes are one per
  visitor per item. IPs are only ever stored as a salted hash, for rate limiting.
- One shared connection (`lib/db.ts`, pool of 5) to stay inside Render's 512 MB.

## Collections

| Collection | Shape | Indexes |
|---|---|---|
| `ratings` | animeId, vid, score 1–10, createdAt, updatedAt | unique (animeId, vid) |
| `rating_stats` | _id animeId, count, sum, dist[10] | _id |
| `reactions` | key `animeId:ep`, vid, emoji | unique (key, vid) |
| `reaction_stats` | _id key, counts {love, lol, sad, shock, meh} | _id |
| `hype` | animeId, vid, season `2027-winter` | unique (animeId, vid) |
| `hype_stats` | _id animeId, season, count | (season, count desc) |
| `polls` / `poll_votes` | question, options, weekOf / pollId, vid, option | unique (pollId, vid) |
| `leads` | email, kind (alert, digest, cheatsheet, guide), animeId?, source (which CTA), consent, status (pending, confirmed, unsubscribed), token, utm, createdAt | unique (email, kind, animeId) |
| `partner_leads` | name, email, company, website, budget, message, status, createdAt | createdAt |
| `rate_limits` | _id `ipHash:route:minute`, n, expiresAt | TTL on expiresAt |

Totals live in `*_stats` documents updated with `$inc` on each vote, so reads are one document, not an
aggregation. `scripts/db-indexes.mts` creates all indexes (run once, and in CI).

## Phase A: MongoDB only

### A1. Foundation (~25k tokens)
- `lib/db.ts`: lazy MongoClient singleton; `db()` returns null when `MONGODB_URI` is unset.
- `lib/visitor.ts`: read or set the `al_vid` cookie; salted IP hash.
- `lib/ratelimit.ts`: per IP hash and route, per minute, TTL collection.
- Shared request guard for all write routes: same-origin check, JSON size limit, honeypot field, rate limit.
- `scripts/db-indexes.mts`; `/api/health/db` (reports connected yes or no, nothing else).

### A2. AniLumi ratings (~30k)
- `RatingWidget` on the anime page: 10 stars, your score, average, vote count, change your vote.
- `POST /api/rate`, `GET /api/stats?anime=`.
- `aggregateRating` JSON-LD returns **only** once a title has 10+ genuine ratings. Ratings are collected
  on AniLumi itself, which Google allows for TVSeries and Movie (CreativeWorkSeries) review snippets.
- "Top rated by AniLumi fans" rail on `/top/rated` once enough titles qualify.

### A3. Episode reactions (~20k)
- `Reactions` bar on episode pages: 😍 😂 😭 🤯 😴, one per visitor per episode, counts shown after voting.
- `POST /api/react`.

### A4. Hype meter (~20k)
- "🔥 I'm hyped" button with count on upcoming anime pages and every row of the season preview.
- "Most hyped" section at the top of `/season/[y]/[s]/preview`, plus `/hype` (most hyped upcoming overall).
- `POST /api/hype`.

### A5. Weekly poll (~15k)
- `PollCard` on the home page; results bar after voting; past polls archived at `/polls`.
- Polls defined in `data/polls.ts` (you or I add one a week); votes in MongoDB.

### A6. Lead CTAs (~45k)
Placed by intent, highest first. Each is one `LeadForm` component with a `source` id, so GA4 shows which
CTA converts (`generate_lead` event with `source`).

| # | Where | Offer | Lead kind |
|---|---|---|---|
| 1 | Airing anime pages, episode pages, My list rows | "Email me when the next episode airs" | alert |
| 2 | Season preview pages | "Get the Winter 2027 cheat sheet": printable premiere list. Shown immediately after signup, so it works before email sending exists | cheatsheet |
| 3 | Filler-list and anime-to-manga pages | "Tell me when the next season or chapter guide is out" | guide |
| 4 | Footer, My list, /news | Weekly digest | digest |
| 5 | `/advertise` (new page, linked in footer) | Partner enquiry form: brands, merch, streaming and VPN partners | partner |
| 6 | Slim bottom bar | Digest signup; only after 2 page views, once per visit, dismiss remembered for 30 days; never a pop-up | digest |

- Every form: email plus consent line linking to `/privacy`, honeypot, rate limit, friendly success
  state, "already subscribed" handled quietly.
- New `/advertise` page: audience facts from GA4 (you fill in the numbers), formats on offer, the form.
- New `/privacy` page: what is stored, why, how to unsubscribe or delete; covers India's DPDP Act and GDPR basics.
- Printable cheat sheet page `/season/[y]/[s]/cheatsheet` (print CSS, noindex).

### A7. Admin (~20k)
- `/admin` (noindex): log in with `ADMIN_TOKEN` (constant-time compare, httpOnly cookie).
- Counts per lead kind and source, latest partner enquiries, recent ratings, delete or mark-spam buttons.
- CSV export of leads and partner leads (cells escaped against spreadsheet formula injection).

### A8. Verify and ship (~15k)
- Unit tests for the pure parts: validation, stats maths, rate-limit keys, CSV escaping, JSON-LD threshold.
- Live smoke test against your Atlas cluster in a separate `anilumi_test` database, then drop it.
- Check Render memory, page speed and that every widget hides cleanly without `MONGODB_URI`.

**Phase A total: about 190k tokens.**

## Phase B: email (needs Resend)

Resend's free plan sends 100 emails a day and 3,000 a month. Fine to start; when the digest list passes
roughly 2,500 people, move to Brevo's free plan (300 a day) or Resend's paid plan.

### B1. Sending and double opt-in (~25k)
- `lib/email.ts` (Resend). Confirmation email for every new lead; status moves pending → confirmed.
- `/api/lead/confirm?token=`, `/api/lead/unsubscribe?token=` (one click), plus the List-Unsubscribe header.
- Partner enquiries forwarded to `LEADS_NOTIFY_EMAIL`.

### B2. Episode alerts (~30k)
- Render's free plan has no cron, so a GitHub Action runs every 30 minutes and calls
  `/api/cron/alerts` with `CRON_SECRET`.
- Finds episodes aired since the last run (AniList airing schedule), emails confirmed subscribers of those
  shows, records what was sent so nobody gets a duplicate.

### B3. Weekly digest (~25k)
- Friday GitHub Action calls `/api/cron/digest`: this week's new episodes, next week's premieres,
  top news, the poll result. Plain, fast-loading HTML email with an unsubscribe link.

**Phase B total: about 80k tokens.**

## Phase C: later
- Written reviews with a moderation queue in `/admin`.
- Browser push notifications through the existing service worker (free, no email needed).
- Hindi pages (scope decision pending).

## Success measures (GA4 + admin)
- Signup rate per CTA (`generate_lead` by `source`); target 1–2% of airing-page visitors.
- Ratings per week, and number of titles past the 10-rating threshold.
- Partner enquiries per month.

## Order of work once `MONGODB_URI` arrives
A1 → A2 → A6 → A7 → ship (leads start collecting) → A3 → A4 → A5 → A8 → Phase B when the Resend key arrives.
