/** Minimal RFC 5545 writer: escaping, 75-octet line folding, CRLF endings. */
export type IcsEvent = {
  uid: string;
  summary: string;
  description?: string;
  url?: string;
  /** ISO timestamp for timed events, or YYYY-MM-DD for an all-day event. */
  start: string;
  durationMin?: number;
};

export function icsEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold a content line so no physical line exceeds 75 octets (UTF-8), never splitting a character. */
export function foldLine(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "", bytes = 0, limit = 75;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > limit) { out.push(cur); cur = ""; bytes = 0; limit = 74; } // continuation lines start with a space
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const utc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const ymd = (s: string) => s.replace(/-/g, "");

export function buildIcs(name: string, events: IcsEvent[], now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AniLumi//Anime episodes//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(name)}`, "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H",
  ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${utc(now)}`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(e.start)) {
      const next = new Date(`${e.start}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${ymd(e.start)}`, `DTEND;VALUE=DATE:${ymd(next.toISOString().slice(0, 10))}`);
    } else {
      const start = new Date(e.start);
      lines.push(`DTSTART:${utc(start)}`, `DTEND:${utc(new Date(start.getTime() + (e.durationMin || 24) * 60000))}`);
    }
    lines.push(`SUMMARY:${icsEscape(e.summary)}`);
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
