/**
 * Who gets the email for a new episode: people following that show ("alert" leads) plus people whose synced
 * list has it ("list" leads, by the list's current items). One email per address. Pure; used by
 * scripts/send-alerts.mts.
 */
export function listLeadsByShow<L extends { listId?: string }>(leads: L[], lists: Map<string, { id: string }[]>): Map<string, L[]> {
  const byShow = new Map<string, L[]>();
  for (const l of leads) {
    if (!l.listId) continue;
    for (const it of new Set((lists.get(l.listId) || []).map((x) => x.id))) byShow.set(it, [...(byShow.get(it) || []), l]);
  }
  return byShow;
}

/** One lead per address; for an address in several groups, the last group's lead is kept. */
export function oncePerEmail<L extends { email: string }>(...groups: L[][]): L[] {
  return [...new Map(groups.flat().map((l) => [l.email, l])).values()];
}
