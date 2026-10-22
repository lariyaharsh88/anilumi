"use client";
import { useEffect, useState } from "react";

const KEY = "anilumi:hide-filler";

/** Hides [data-filler] rows inside #targetId; remembered per browser. */
export default function FillerToggle({ targetId }: { targetId: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => { try { setOn(localStorage.getItem(KEY) === "1"); } catch { /* storage blocked */ } }, []);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (el) el.toggleAttribute("data-hide-filler", on);
  }, [on, targetId]);
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/90">
      <input type="checkbox" checked={on} onChange={(e) => { setOn(e.target.checked); try { localStorage.setItem(KEY, e.target.checked ? "1" : "0"); } catch { /* storage blocked */ } }} className="accent-[#8b7cff]" />
      Hide filler episodes
    </label>
  );
}
