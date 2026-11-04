"use client";
import { useEffect, useState } from "react";
import { send } from "@/lib/community-client";
import { track } from "@/lib/track";
import { VAPID_PUBLIC_KEY } from "@/lib/push";

const STORE = "al_push";
const followed = (): string[] => { try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { return []; } };
const remember = (topic: string, on: boolean) => {
  try { localStorage.setItem(STORE, JSON.stringify(on ? [...new Set([...followed(), topic])] : followed().filter((t) => t !== topic))); } catch {}
};
const keyBytes = (b64: string) => Uint8Array.from(atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function subscription(): Promise<PushSubscription> {
  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  return (await reg.pushManager.getSubscription()) || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY!) });
}

type State = "hidden" | "ios" | "off" | "busy" | "on" | "denied";

/**
 * "🔔 Alert me" for one topic (a new episode of an anime, a character's birthday): asks for notification
 * permission, subscribes this browser and tells /api/push. Hidden where web push isn't available; on iPhone it
 * explains that alerts need the home-screen app. Server pages render it only when the database is on.
 */
export default function PushButton({ topic, label, onLabel, source, className = "" }: { topic: string; label: string; onLabel: string; source: string; className?: string }) {
  const [state, setState] = useState<State>("hidden");
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) setState("ios");
      return;
    }
    setState(Notification.permission === "denied" ? "denied" : Notification.permission === "granted" && followed().includes(topic) ? "on" : "off");
  }, [topic]);

  const toggle = async () => {
    const on = state !== "on";
    setState("busy"); setErr("");
    try {
      if (on && (await Notification.requestPermission()) !== "granted") { setState("denied"); return; }
      const sub = await subscription();
      const r = await send<{ ok: boolean }>("/api/push", { sub: sub.toJSON(), topic, on });
      if (r.error) { setErr(r.error); setState(on ? "off" : "on"); return; }
      remember(topic, on);
      track(on ? "push_on" : "push_off", { source, topic });
      setState(on ? "on" : "off");
    } catch {
      setErr("Couldn't turn on alerts in this browser.");
      setState("off");
    }
  };

  if (state === "hidden") return null;
  if (state === "ios") return <p className={`text-xs text-muted ${className}`}>🔔 On iPhone, add AniLumi to your Home Screen (Share → Add to Home Screen) to get alerts.</p>;
  if (state === "denied") return <p className={`text-xs text-muted ${className}`}>🔕 Notifications are blocked for this site. Allow them in your browser settings to get alerts.</p>;
  return (
    <div className={className}>
      <button type="button" onClick={toggle} disabled={state === "busy"} aria-pressed={state === "on"}
        className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${state === "on" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15" : "border-violet/40 bg-violet/10 text-ink hover:bg-violet/20"} disabled:opacity-60`}>
        <span aria-hidden>{state === "on" ? "✓" : "🔔"}</span>
        {state === "busy" ? "One moment…" : state === "on" ? onLabel : label}
      </button>
      {state === "on" && <span className="ml-2 text-xs text-muted">Tap again to turn off.</span>}
      {err && <p className="mt-1 text-xs text-rose-300" role="alert">{err}</p>}
    </div>
  );
}
