// Cloudflare cron for the GitHub workflows. GitHub runs scheduled workflows late or not at all (hourly jobs ran
// 3-9 hours apart in Nov 2026); Cloudflare's cron triggers fire on time, so the edge Worker starts the
// time-sensitive workflows itself through GitHub's "workflow dispatch" API. Their own GitHub schedules stay as a
// backup: every one of them is safe to run twice (alerts are claimed once in MongoDB, the rest are refreshes).

export const REPO = "lariyaharsh88/anilumi";

/**
 * Workflows due at a cron tick (edge/wrangler.toml fires at :05 and :35 every hour, UTC). Pure.
 *   alerts      every tick: new episodes, today's birthdays, the weekly digest (scripts/send-alerts.mts "auto")
 *   anilist-sync  hourly: AniList data the pages asked for (pages can't reach AniList from Cloudflare)
 *   airing      every 3 hours: next air times for airing shows
 *   warm-cache  every 6 hours, after that hour's airing snapshot
 *   health      daily at 05:35 UTC (11:05 IST)
 *   sitemap     daily at 06:05 UTC: resubmit the sitemap to Google, changed URLs to IndexNow
 *   release     every 6 hours (:05); the workflow itself only releases once the last release is 48 hours old
 */
export function dueWorkflows(date) {
  const h = date.getUTCHours();
  const first = date.getUTCMinutes() < 30;
  const out = ["alerts.yml"];
  if (first) out.push("anilist-sync.yml");
  if (first && h % 3 === 0) out.push("airing.yml");
  if (!first && h % 6 === 0) out.push("warm-cache.yml");
  if (!first && h === 5) out.push("health.yml");
  if (first && h === 6) out.push("sitemap.yml");
  if (first && h % 6 === 0) out.push("release.yml");
  return out;
}

/** Workflow inputs per file. release.yml releases at once when run by hand; from here it waits out its 48 hours. */
const INPUTS = { "release.yml": { force: "false" } };

/** Start each due workflow on main. Needs the secret GH_DISPATCH_TOKEN (Actions: read and write on the repo). */
export async function dispatchDue(env, date = new Date()) {
  const due = dueWorkflows(date);
  if (!env.GH_DISPATCH_TOKEN) {
    console.log(`cron: GH_DISPATCH_TOKEN is not set; not starting ${due.join(", ")}`);
    return;
  }
  const results = await Promise.all(
    due.map((file) =>
      fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${file}/dispatches`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.GH_DISPATCH_TOKEN}`,
          accept: "application/vnd.github+json",
          "x-github-api-version": "2022-11-28",
          "user-agent": "anilumi-edge-cron",
          "content-type": "application/json",
        },
        body: JSON.stringify(INPUTS[file] ? { ref: "main", inputs: INPUTS[file] } : { ref: "main" }),
      })
        .then((r) => `${file} ${r.status}`)
        .catch((e) => `${file} ${e.name}`),
    ),
  );
  // 204 = started. 401/403: token missing the Actions write permission or expired; 404: wrong repo or file.
  console.log(`cron: ${results.join(", ")}`);
}
