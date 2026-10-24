/** Parse a MyAnimeList list export (XML). Regex-based so it runs anywhere and is unit-testable. Pure. */
export type MalStatus = "watching" | "planning" | "paused" | "completed" | "dropped";
export type MalEntry = { malId: number; status: MalStatus; progress: number; score: number };

const STATUS: Record<string, MalStatus> = { "watching": "watching", "1": "watching", "completed": "completed", "2": "completed", "on-hold": "paused", "3": "paused", "dropped": "dropped", "4": "dropped", "plan to watch": "planning", "6": "planning" };

export function parseMalXml(xml: string): MalEntry[] {
  const out: MalEntry[] = [];
  const tag = (block: string, name: string) => (block.match(new RegExp(`<${name}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${name}>`)) || [])[1]?.trim() ?? "";
  for (const m of xml.matchAll(/<anime>([\s\S]*?)<\/anime>/g)) {
    const b = m[1];
    const malId = Number(tag(b, "series_animedb_id"));
    const status = STATUS[tag(b, "my_status").toLowerCase()];
    if (!malId || !status) continue;
    out.push({ malId, status, progress: Number(tag(b, "my_watched_episodes")) || 0, score: Number(tag(b, "my_score")) || 0 });
  }
  return out;
}
