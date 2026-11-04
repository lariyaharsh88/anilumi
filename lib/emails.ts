/**
 * The emails themselves: confirmation (double opt-in), a new-episode alert and the Friday digest. Plain,
 * light-background HTML with inline styles (what email clients render reliably) plus a text version. Pure.
 */
import { EMAIL_SITE, unsubHeaders, unsubUrl, type Mail } from "./email";
import type { Alert } from "./pushplan";

export type LeadDoc = { email: string; kind: "alert" | "digest" | "cheatsheet" | "guide"; animeId: string | null; animeTitle?: string | null; token: string; page?: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = (path: string) => (/^https?:/.test(path) ? path : `${EMAIL_SITE}${path}`);

function layout(o: { preheader: string; heading: string; body: string; button?: { label: string; href: string }; why: string; token?: string }): string {
  const btn = o.button ? `<p style="margin:24px 0"><a href="${esc(o.button.href)}" style="display:inline-block;background:#7c5cff;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${esc(o.button.label)}</a></p>` : "";
  const unsub = o.token ? ` <a href="${esc(unsubUrl(o.token))}" style="color:#6b6884">Unsubscribe</a>.` : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f3f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1a2b">
<span style="display:none;max-height:0;overflow:hidden">${esc(o.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e4e1ef">
<tr><td style="padding:22px 26px 0"><a href="${EMAIL_SITE}" style="font-weight:800;font-size:18px;color:#7c5cff;text-decoration:none">AniLumi</a></td></tr>
<tr><td style="padding:10px 26px 26px;font-size:15px;line-height:1.6">
<h1 style="font-size:21px;line-height:1.3;margin:8px 0 12px">${esc(o.heading)}</h1>
${o.body}${btn}
</td></tr></table>
<p style="max-width:560px;font-size:12px;line-height:1.5;color:#6b6884;margin:14px auto 0">${esc(o.why)}${unsub}<br>AniLumi · anilumi.in</p>
</td></tr></table></body></html>`;
}

const p = (s: string) => `<p style="margin:0 0 12px">${s}</p>`;

const WHAT: Record<LeadDoc["kind"], (l: LeadDoc) => string> = {
  alert: (l) => (l.animeTitle ? `an email when each new ${l.animeTitle} episode airs` : "new-episode alerts"),
  digest: () => "the weekly anime digest, every Friday",
  cheatsheet: () => "the season cheat sheet and a heads-up when new shows are confirmed",
  guide: (l) => (l.animeTitle ? `updates to the ${l.animeTitle} guides` : "guide updates"),
};

/** Double opt-in: nothing else is sent until this link is used. */
export function confirmMail(l: LeadDoc): Mail {
  const url = `${EMAIL_SITE}/api/lead/confirm?t=${l.token}`;
  const what = WHAT[l.kind](l);
  const sheet = l.kind === "cheatsheet" && l.page ? l.page.replace(/\/preview$/, "/cheatsheet") : null;
  const body = p(`You asked for ${esc(what)}. Tap the button to confirm it's you.`) + (sheet ? p(`Your cheat sheet is ready now: <a href="${esc(abs(sheet))}" style="color:#7c5cff">open it here</a>.`) : "") + p(`<span style="color:#6b6884">Didn't sign up? Ignore this email and you won't hear from us.</span>`);
  return {
    to: l.email, tag: "confirm",
    subject: l.kind === "alert" && l.animeTitle ? `Confirm your ${l.animeTitle} episode alerts` : l.kind === "digest" ? "Confirm your weekly anime digest" : l.kind === "cheatsheet" ? "Your cheat sheet + one tap to confirm" : "Confirm your AniLumi updates",
    html: layout({ preheader: "One tap to confirm, then you're set.", heading: "Confirm your email", body, button: { label: "Yes, confirm", href: url }, why: `Someone (hopefully you) signed up for ${what} on anilumi.in.` }),
    text: `You asked for ${what} on AniLumi. Confirm here: ${url}${sheet ? `\n\nYour cheat sheet: ${abs(sheet)}` : ""}\n\nDidn't sign up? Ignore this email.`,
  };
}

/** One new episode (or a premiere) for someone following that anime. */
export function episodeMail(l: LeadDoc, a: Alert): Mail {
  return {
    to: l.email, tag: "episode", headers: unsubHeaders(l.token),
    subject: a.title,
    html: layout({ preheader: a.body, heading: a.title, body: p(esc(a.body)), button: { label: "Open the episode page", href: abs(a.url) }, why: `You get this because you asked for ${WHAT.alert(l)}.`, token: l.token }),
    text: `${a.title}\n\n${a.body}\n${abs(a.url)}\n\nUnsubscribe: ${unsubUrl(l.token)}`,
  };
}

export type Digest = {
  week: string;
  episodes: { title: string; episode: number; day: string; url: string }[];
  premieres: { title: string; day: string; url: string }[];
  news: { title: string; url: string; source: string }[];
};

const list = (rows: string[]) => `<ul style="margin:0 0 16px;padding-left:20px">${rows.map((r) => `<li style="margin:0 0 6px">${r}</li>`).join("")}</ul>`;
const h2 = (s: string) => `<h2 style="font-size:16px;margin:18px 0 8px">${s}</h2>`;
const link = (href: string, label: string) => `<a href="${esc(abs(href))}" style="color:#7c5cff;text-decoration:none;font-weight:600">${esc(label)}</a>`;

/** The Friday digest: next week's premieres and new episodes, plus the week's news. */
export function digestMail(l: LeadDoc, d: Digest): Mail {
  const body =
    (d.premieres.length ? h2("🎬 Premiering this week") + list(d.premieres.map((x) => `${link(x.url, x.title)} · ${esc(x.day)}`)) : "") +
    (d.episodes.length ? h2("📺 New episodes this week") + list(d.episodes.map((x) => `${link(x.url, x.title)} episode ${x.episode} · ${esc(x.day)}`)) : "") +
    (d.news.length ? h2("📰 This week's news") + list(d.news.map((x) => `<a href="${esc(x.url)}" style="color:#1c1a2b">${esc(x.title)}</a> <span style="color:#6b6884">(${esc(x.source)})</span>`)) : "");
  const text = [
    d.premieres.length ? `PREMIERING THIS WEEK\n${d.premieres.map((x) => `- ${x.title} (${x.day}) ${abs(x.url)}`).join("\n")}` : "",
    d.episodes.length ? `NEW EPISODES THIS WEEK\n${d.episodes.map((x) => `- ${x.title} ep ${x.episode} (${x.day}) ${abs(x.url)}`).join("\n")}` : "",
    d.news.length ? `NEWS\n${d.news.map((x) => `- ${x.title} (${x.source}) ${x.url}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
  return {
    to: l.email, tag: "digest", headers: unsubHeaders(l.token),
    subject: `This week in anime: ${d.week}`,
    html: layout({ preheader: d.premieres.length ? `${d.premieres.length} premieres and ${d.episodes.length} new episodes this week` : `${d.episodes.length} new episodes this week`, heading: `This week in anime · ${d.week}`, body, button: { label: "Full schedule", href: "/schedule" }, why: "You get this because you signed up for the weekly AniLumi digest.", token: l.token }),
    text: `This week in anime · ${d.week}\n\n${text}\n\nFull schedule: ${EMAIL_SITE}/schedule\nUnsubscribe: ${unsubUrl(l.token)}`,
  };
}
