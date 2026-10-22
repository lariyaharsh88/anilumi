import { redirect } from "next/navigation";
import { seasonOf } from "@/lib/kitsu";

export default function SeasonIndex() {
  const { season, year } = seasonOf();
  redirect(`/season/${year}/${season}`);
}
