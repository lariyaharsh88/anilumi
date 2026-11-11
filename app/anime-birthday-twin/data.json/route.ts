import { twinDays } from "@/lib/birthdaytwin";

export const revalidate = 86400;

/** Every day's birthday twins, fetched by the tool on first use. */
export function GET() {
  return Response.json(twinDays(), { headers: { "cache-control": "public, max-age=86400" } });
}
