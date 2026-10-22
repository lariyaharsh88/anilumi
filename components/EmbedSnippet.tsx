"use client";
import { useState } from "react";

export default function EmbedSnippet({ slug, title }: { slug: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const code = `<iframe src="${origin}/embed/${slug}" width="360" height="130" style="border:0;border-radius:14px;max-width:100%" loading="lazy" title="${title.replace(/"/g, "")} countdown"></iframe>`;
  return (
    <div className="mt-6">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-sm text-violet hover:underline">{open ? "Hide embed code" : "Embed this countdown on your site or Discord"}</button>
      {open && (
        <div className="card mt-2 p-3">
          <iframe src={`/embed/${slug}`} width="360" height="130" style={{ border: 0, borderRadius: 14, maxWidth: "100%" }} title={`${title} countdown preview`} />
          <pre className="mt-3 overflow-x-auto rounded-lg bg-bg-2 p-3 text-xs text-ink/90">{code}</pre>
          <button type="button" className="btn-outline mt-2" onClick={() => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}>{copied ? "Copied" : "Copy code"}</button>
        </div>
      )}
    </div>
  );
}
