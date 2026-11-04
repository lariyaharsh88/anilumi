/**
 * Poster URLs for a set of Kitsu anime ids, 20 per request, for emails (scripts/send-alerts.mts). Kitsu's
 * filter[id] takes a comma list (filter[slug] doesn't). Fails soft: ids it can't fetch are just absent.
 */
export async function kitsuPosters(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(ids)].filter((id) => /^\d+$/.test(id));
  for (let i = 0; i < unique.length; i += 20) {
    const chunk = unique.slice(i, i + 20);
    const res = await fetch(`https://kitsu.app/api/edge/anime?filter[id]=${chunk.join(",")}&fields[anime]=posterImage&page[limit]=20`, {
      headers: { Accept: "application/vnd.api+json" },
      signal: AbortSignal.timeout(15_000),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    for (const d of (res?.data || []) as { id: string; attributes?: { posterImage?: { small?: string; medium?: string } | null } }[]) {
      const url = d.attributes?.posterImage?.small || d.attributes?.posterImage?.medium;
      if (url) out.set(d.id, url);
    }
  }
  return out;
}
