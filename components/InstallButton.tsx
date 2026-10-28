"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/track";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/** "Install app" button; only appears when the browser offers installation (Chrome, Edge, Android). */
export default function InstallButton({ className = "btn-outline" }: { className?: string }) {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    const done = () => setEvt(null);
    window.addEventListener("beforeinstallprompt", on);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", on); window.removeEventListener("appinstalled", done); };
  }, []);
  if (!evt) return null;
  return (
    <button type="button" className={className} onClick={async () => {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      track("app_install", { outcome });
      setEvt(null);
    }}>📲 Install the app</button>
  );
}
