/**
 * The emails: confirmation (double opt-in), a new-episode alert and the Friday digest. Styled like the site's
 * dark theme with table layout and inline styles (what Gmail, Outlook and Apple Mail render reliably), declared
 * dark so mail apps don't invert it, plus a plain-text version of each. Pure.
 */
import { EMAIL_SITE, unsubHeaders, unsubUrl, type Mail } from "./email";
import type { Alert } from "./pushplan";

export type LeadDoc = { email: string; kind: "alert" | "digest" | "cheatsheet" | "guide" | "list"; animeId: string | null; animeTitle?: string | null; token: string; page?: string; listId?: string };

// The site's dark theme (app/globals.css).
const C = { bg: "#0b0d13", bg2: "#111520", card: "#161b28", line: "#242b3b", ink: "#e8ecf5", body: "#c5cddd", muted: "#8f9ab3", accent: "#ff7a8f", violet: "#8b7cff", button: "#6c5ce7", gold: "#ffc857" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const abs = (path: string) => (/^https?:/.test(path) ? path : `${EMAIL_SITE}${path}`);

const p = (s: string, color = C.body) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${color}">${s}</p>`;
const kicker = (s: string) => `<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.accent}">${esc(s)}</p>`;
const h1 = (s: string) => `<h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;font-weight:800;color:${C.ink}">${s}</h1>`;
const h2 = (emoji: string, s: string, n?: number) =>
  `<h2 style="margin:28px 0 12px;font-size:17px;line-height:1.3;font-weight:800;color:${C.ink}">${emoji}&nbsp; ${esc(s)}${n ? ` <span style="font-size:13px;font-weight:600;color:${C.muted}">· ${n}</span>` : ""}</h2>`;
const chip = (s: string, color = C.violet) => `<span style="display:inline-block;padding:3px 10px;border-radius:999px;border:1px solid ${C.line};background:${C.bg2};font-size:12px;font-weight:700;color:${color};white-space:nowrap">${esc(s)}</span>`;
const a = (href: string, label: string, color = C.ink) => `<a href="${esc(abs(href))}" style="color:${color};text-decoration:none;font-weight:700">${esc(label)}</a>`;

/** A table-built button: renders the same in Outlook, which ignores padding on links. */
const button = (label: string, href: string) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px"><tr>
<td bgcolor="${C.button}" style="border-radius:999px;background:${C.button}"><a href="${esc(abs(href))}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)} &rarr;</a></td>
</tr></table>`;

const poster = (src: string | null | undefined, w: number, h: number) =>
  src ? `<img src="${esc(src)}" width="${w}" height="${h}" alt="" style="display:block;width:${w}px;height:${h}px;object-fit:cover;border-radius:10px;border:1px solid ${C.line}">` : `<div style="width:${w}px;height:${h}px;line-height:${h}px;text-align:center;font-size:${Math.round(w / 3)}px;color:${C.line};border-radius:10px;background:${C.bg2};border:1px solid ${C.line}">&#9654;</div>`;

const FOOT_LINKS: [string, string][] = [["/schedule", "Schedule"], ["/watch-order", "Watch orders"], ["/hindi-dub", "Hindi dub"], ["/my", "My list"]];

function layout(o: { preheader: string; content: string; why: string; token?: string }): string {
  const unsub = o.token ? `<br><a href="${esc(unsubUrl(o.token))}" style="color:${C.muted};text-decoration:underline">Unsubscribe</a>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<style>:root{color-scheme:dark;supported-color-schemes:dark}body{margin:0;padding:0}a{color:${C.violet}}
@media (max-width:600px){.px{padding-left:20px!important;padding-right:20px!important}.h1{font-size:23px!important}}</style></head>
<body style="margin:0;padding:0;background:${C.bg}" bgcolor="${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bg}" style="background:${C.bg};font-family:${FONT}"><tr><td align="center" style="padding:28px 12px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td style="padding:0 6px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td><a href="${EMAIL_SITE}" style="text-decoration:none"><img src="${EMAIL_SITE}/icons/icon-192.png" width="34" height="34" alt="" style="vertical-align:middle;border-radius:9px;border:0">&nbsp;&nbsp;<span style="vertical-align:middle;font-size:20px;font-weight:800;color:${C.ink};letter-spacing:-0.3px">AniLumi</span></a></td>
  <td align="right" style="font-size:13px"><a href="${EMAIL_SITE}/schedule" style="color:${C.muted};text-decoration:none;font-weight:600">This week&rsquo;s schedule</a></td>
</tr></table></td></tr>
<tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-radius:20px;overflow:hidden">
  <div style="height:4px;line-height:4px;font-size:4px;border-radius:20px 20px 0 0;background:${C.violet};background-image:linear-gradient(90deg,#ff7a8f 0%,#b3a8ff 55%,#ffd88a 100%)">&nbsp;</div>
  <div class="px" style="padding:30px 34px 32px">${o.content}</div>
</td></tr>
<tr><td align="center" style="padding:22px 16px 0;font-size:13px;line-height:1.7;color:${C.muted}">
  ${FOOT_LINKS.map(([h, l]) => `<a href="${EMAIL_SITE}${h}" style="color:${C.body};text-decoration:none;font-weight:600">${l}</a>`).join(` <span style="color:${C.line}">&nbsp;·&nbsp;</span> `)}
  <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:${C.muted}">${esc(o.why)}${unsub}<br>AniLumi · release dates, watch orders and where to watch · <a href="${EMAIL_SITE}" style="color:${C.muted}">anilumi.in</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

const WHAT: Record<LeadDoc["kind"], (l: LeadDoc) => string> = {
  alert: (l) => (l.animeTitle ? `an email when each new ${l.animeTitle} episode airs` : "new-episode alerts"),
  digest: () => "the weekly anime digest, every Friday",
  cheatsheet: () => "the season cheat sheet and a heads-up when new shows are confirmed",
  guide: (l) => (l.animeTitle ? `updates to the ${l.animeTitle} guides` : "guide updates"),
  list: () => "an email when a new episode of any show on your AniLumi list airs",
};
const PERKS: Record<LeadDoc["kind"], (l: LeadDoc) => string[]> = {
  alert: (l) => [`One email the moment each ${l.animeTitle ? esc(l.animeTitle) : ""} episode airs`, "Where to stream it, plus the episode guide", "Nothing else, and you can stop any time"],
  digest: () => ["Every Friday: the week's premieres and new episodes", "The five headlines worth knowing", "One short email, never more"],
  cheatsheet: () => ["Every premiere date on one printable page", "A heads-up when new shows are confirmed", "No spam, unsubscribe any time"],
  guide: (l) => [`A note when the ${l.animeTitle ? esc(l.animeTitle) : ""} guides change`, "New seasons, filler lists and where the manga picks up", "Only when something actually changes"],
  list: () => ["One email as each new episode of a show on your list airs", "Follows your synced list: add or remove shows any time", "Nothing else, and you can stop any time"],
};
const perks = (rows: string[]) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 6px">${rows.map((r) => `<tr><td valign="top" style="padding:5px 12px 5px 0;font-size:15px;line-height:1.5;color:${C.violet};font-weight:800">&#10003;</td><td style="padding:5px 0;font-size:15px;line-height:1.5;color:${C.body}">${r}</td></tr>`).join("")}</table>`;

/** Double opt-in: nothing else is sent until this link is used. */
export function confirmMail(l: LeadDoc): Mail {
  const url = `${EMAIL_SITE}/api/lead/confirm?t=${l.token}`;
  const what = WHAT[l.kind](l);
  const sheet = l.kind === "cheatsheet" && l.page ? l.page.replace(/\/preview$/, "/cheatsheet") : null;
  const content = kicker("One last step") + `<div class="h1">${h1("Confirm your email")}</div>` +
    p(`You asked for <strong style="color:${C.ink}">${esc(what)}</strong>. Tap the button so we know it&rsquo;s really you.`) +
    perks(PERKS[l.kind](l)) + button("Yes, confirm", url) +
    (sheet ? `<div style="margin:22px 0 0;padding:14px 16px;border-radius:14px;background:${C.bg2};border:1px solid ${C.line};font-size:14px;color:${C.body}">📋 Your cheat sheet is ready now: ${a(sheet, "open it here", C.violet)}</div>` : "") +
    `<p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:${C.muted}">Didn&rsquo;t sign up? Ignore this email and you won&rsquo;t hear from us again.</p>`;
  return {
    to: l.email, tag: "confirm",
    subject: l.kind === "alert" && l.animeTitle ? `Confirm your ${l.animeTitle} episode alerts` : l.kind === "digest" ? "Confirm your weekly anime digest" : l.kind === "cheatsheet" ? "Your cheat sheet + one tap to confirm" : l.kind === "list" ? "Confirm alerts for the shows on your list" : "Confirm your AniLumi updates",
    html: layout({ preheader: "One tap to confirm, then you're set.", content, why: `Someone (hopefully you) signed up for ${what} on anilumi.in.` }),
    text: `You asked for ${what} on AniLumi. Confirm here: ${url}${sheet ? `\n\nYour cheat sheet: ${abs(sheet)}` : ""}\n\nDidn't sign up? Ignore this email.`,
  };
}

/** One new episode (or a premiere) for someone following that anime. */
export function episodeMail(l: LeadDoc, al: Alert & { poster?: string | null }): Mail {
  const ep = Number(al.url.match(/\/episode\/(\d+)/)?.[1]) || null;
  const premiere = ep === 1;
  const show = al.url.replace(/\/episode\/\d+$/, "");
  const content = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    ${al.poster ? `<td valign="top" width="112" style="padding:0 20px 0 0">${poster(al.poster, 112, 160)}</td>` : ""}
    <td valign="top">${kicker(premiere ? "Premiere" : "New episode")}<div class="h1">${h1(esc(al.title))}</div>
      ${ep ? `<p style="margin:0 0 14px">${chip(premiere ? "Episode 1 · out now" : `Episode ${ep} · out now`, C.gold)}</p>` : ""}
      ${p(esc(al.body))}</td>
  </tr></table>` + button(premiere ? "Where to watch" : "Open the episode", al.url) +
    `<p style="margin:12px 0 0;font-size:14px;color:${C.muted}">${a(show, "Show page", C.violet)} &nbsp;·&nbsp; ${a(`${show}/episodes`, "All episodes", C.violet)} &nbsp;·&nbsp; ${a("/schedule", "This week's schedule", C.violet)}</p>`;
  return {
    to: l.email, tag: "episode", headers: unsubHeaders(l.token),
    subject: al.title,
    html: layout({ preheader: al.body, content, why: `You get this because you asked for ${WHAT[l.kind](l)}.`, token: l.token }),
    text: `${al.title}\n\n${al.body}\n${abs(al.url)}\n\nUnsubscribe: ${unsubUrl(l.token)}`,
  };
}

export type Digest = {
  week: string;
  episodes: { title: string; episode: number; day: string; url: string; poster?: string | null }[];
  premieres: { title: string; day: string; url: string; poster?: string | null }[];
  news: { title: string; url: string; source: string }[];
  /** Popular characters' birthdays in the coming week (lib/pushplan.ts weekBirthdays). */
  birthdays?: { name: string; show: string; day: string; url: string }[];
};

const stat = (n: number, label: string, color: string) => `<td width="33%" valign="top" style="padding:0 4px"><div style="padding:14px 12px;border-radius:14px;background:${C.bg2};border:1px solid ${C.line};text-align:center">
<div style="font-size:26px;line-height:1;font-weight:800;color:${color}">${n}</div><div style="margin-top:6px;font-size:12px;color:${C.muted}">${label}</div></div></td>`;

/** Premieres: one gets a wide feature row; several sit two cards to a row (poster, title, day). */
function premiereGrid(rows: Digest["premieres"]): string {
  if (rows.length === 1) {
    const x = rows[0];
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;background:${C.bg2};border:1px solid ${C.line}"><tr>
      ${x.poster ? `<td valign="top" width="120" style="padding:14px 0 14px 14px">${poster(x.poster, 120, 170)}</td>` : ""}
      <td valign="middle" style="padding:16px 18px">${chip(`Premieres ${x.day}`, C.accent)}
        <div style="margin:10px 0 6px;font-size:19px;line-height:1.3;font-weight:800;color:${C.ink}">${esc(x.title)}</div>
        <div style="font-size:14px;line-height:1.5;color:${C.muted}">Episode 1 lands this week. See where it streams and what to expect.</div>
        <div style="margin-top:12px">${a(x.url, "Where to watch →", C.violet)}</div></td></tr></table>`;
  }
  const cells = rows.map((x) => `<td width="50%" valign="top" style="padding:0 6px 14px"><a href="${esc(abs(x.url))}" style="text-decoration:none">
    ${x.poster ? `<img src="${esc(x.poster)}" width="250" alt="" style="display:block;width:100%;max-width:250px;height:auto;border-radius:12px;border:1px solid ${C.line}">` : ""}
    <div style="padding:8px 2px 0;font-size:15px;line-height:1.35;font-weight:700;color:${C.ink}">${esc(x.title)}</div>
    <div style="padding:4px 2px 0">${chip(x.day, C.accent)}</div></a></td>`);
  const out: string[] = [];
  for (let i = 0; i < cells.length; i += 2) out.push(`<tr>${cells[i]}${cells[i + 1] || '<td width="50%"></td>'}</tr>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -6px">${out.join("")}</table>`;
}

const episodeRow = (x: Digest["episodes"][number]) => `<tr>
  <td width="44" valign="middle" style="padding:8px 12px 8px 0;border-bottom:1px solid ${C.line}">${poster(x.poster, 44, 62)}</td>
  <td valign="middle" style="padding:8px 0;border-bottom:1px solid ${C.line}"><a href="${esc(abs(x.url))}" style="text-decoration:none"><span style="font-size:15px;line-height:1.35;font-weight:700;color:${C.ink}">${esc(x.title)}</span><br><span style="font-size:13px;color:${C.muted}">Episode ${x.episode}</span></a></td>
  <td align="right" valign="middle" style="padding:8px 0 8px 10px;border-bottom:1px solid ${C.line}">${chip(x.day)}</td></tr>`;

const newsRow = (x: Digest["news"][number]) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line}">
  <a href="${esc(x.url)}" style="font-size:15px;line-height:1.45;font-weight:600;color:${C.ink};text-decoration:none">${esc(x.title)}</a><br><span style="font-size:12px;color:${C.muted}">${esc(x.source)}</span></td></tr>`;

const birthdayRow = (x: NonNullable<Digest["birthdays"]>[number]) => `<tr><td style="padding:8px 0;border-bottom:1px solid ${C.line}">
  <a href="${esc(abs(x.url))}" style="text-decoration:none"><span style="font-size:15px;font-weight:700;color:${C.ink}">${esc(x.name)}</span><br><span style="font-size:13px;color:${C.muted}">${esc(x.show)}</span></a></td>
  <td align="right" valign="middle" style="padding:8px 0 8px 10px;border-bottom:1px solid ${C.line}">${chip(x.day)}</td></tr>`;

/** The Friday digest: the week's premieres and new episodes, popular characters' birthdays, and the week's news. */
export function digestMail(l: LeadDoc, d: Digest): Mail {
  const content = kicker(`Weekly digest · ${d.week}`) + `<div class="h1">${h1("This week in anime")}</div>` +
    p("Here&rsquo;s what&rsquo;s airing over the next seven days and the news worth catching up on.") +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px -4px 4px"><tr>${stat(d.premieres.length, d.premieres.length === 1 ? "premiere" : "premieres", C.accent)}${stat(d.episodes.length, d.episodes.length === 1 ? "new episode" : "new episodes", C.violet)}${stat(d.news.length, d.news.length === 1 ? "headline" : "headlines", C.gold)}</tr></table>` +
    (d.premieres.length ? h2("🎬", "Premiering this week", d.premieres.length) + premiereGrid(d.premieres) : "") +
    (d.episodes.length ? h2("📺", "New episodes", d.episodes.length) + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${d.episodes.map(episodeRow).join("")}</table>` : "") +
    (d.birthdays?.length ? h2("🎂", "Birthdays this week", d.birthdays.length) + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${d.birthdays.map(birthdayRow).join("")}</table>` : "") +
    (d.news.length ? h2("📰", "This week's news") + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${d.news.map(newsRow).join("")}</table>` : "") +
    button("See the full schedule", "/schedule");
  const text = [
    d.premieres.length ? `PREMIERING THIS WEEK\n${d.premieres.map((x) => `- ${x.title} (${x.day}) ${abs(x.url)}`).join("\n")}` : "",
    d.episodes.length ? `NEW EPISODES THIS WEEK\n${d.episodes.map((x) => `- ${x.title} ep ${x.episode} (${x.day}) ${abs(x.url)}`).join("\n")}` : "",
    d.birthdays?.length ? `BIRTHDAYS THIS WEEK\n${d.birthdays.map((x) => `- ${x.name}, ${x.show} (${x.day}) ${abs(x.url)}`).join("\n")}` : "",
    d.news.length ? `NEWS\n${d.news.map((x) => `- ${x.title} (${x.source}) ${x.url}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
  return {
    to: l.email, tag: "digest", headers: unsubHeaders(l.token),
    subject: `This week in anime: ${d.week}`,
    html: layout({ preheader: d.premieres.length ? `${d.premieres.length} premieres and ${d.episodes.length} new episodes this week` : `${d.episodes.length} new episodes this week`, content, why: "You get this because you signed up for the weekly AniLumi digest.", token: l.token }),
    text: `This week in anime · ${d.week}\n\n${text}\n\nFull schedule: ${EMAIL_SITE}/schedule\nUnsubscribe: ${unsubUrl(l.token)}`,
  };
}
