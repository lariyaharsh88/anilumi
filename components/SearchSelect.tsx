"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Bolds the first match of `q` in `label` (accent- and case-insensitive). */
function Highlight({ label, q }: { label: string; q: string }) {
  const i = q ? fold(label).indexOf(fold(q)) : -1;
  if (i < 0) return <>{label}</>;
  return <>{label.slice(0, i)}<mark className="rounded-sm bg-violet/25 text-ink">{label.slice(i, i + q.length)}</mark>{label.slice(i + q.length)}</>;
}

/**
 * Styled replacement for <select>: a button that opens a listbox with a type-to-filter search box (shown when there
 * are more than `searchFrom` options). Keyboard: arrows, Home/End, Enter, Escape; typing on the closed button opens
 * it with that text. With `name` it carries its value in a hidden input, so plain forms (GET or FormData) keep working;
 * `submitOnChange` submits the surrounding form after a pick.
 */
export default function SearchSelect({
  options, value, defaultValue, onChange, name, placeholder = "Choose one", label, searchFrom = 6, submitOnChange, size = "md", className = "",
}: {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  name?: string;
  placeholder?: string;
  label?: string;
  searchFrom?: number;
  submitOnChange?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [right, setRight] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const searchable = options.length > searchFrom;

  const shown = useMemo(() => (q ? options.filter((o) => fold(o.label).includes(fold(q))) : options), [options, q]);
  const selected = options.find((o) => o.value === current);

  const show = (seed = "") => {
    const r = button.current?.getBoundingClientRect();
    setUp(!!r && window.innerHeight - r.bottom < 320 && r.top > window.innerHeight - r.bottom);
    setRight(!!r && r.left + Math.max(r.width, 224) > window.innerWidth - 8); // 224px = min-w-[14rem]
    setQ(seed);
    setActive(Math.max(0, seed ? 0 : options.findIndex((o) => o.value === current)));
    setOpen(true);
  };
  const close = (refocus = true) => { setOpen(false); if (refocus) button.current?.focus(); };
  const pick = (o: SelectOption) => {
    close();
    if (o.value === current) return;
    if (value === undefined) setInner(o.value);
    onChange?.(o.value);
    if (submitOnChange && hidden.current) {
      hidden.current.value = o.value; // before React re-renders, so the submitted form sees the new value
      hidden.current.form?.requestSubmit();
    }
  };

  useEffect(() => {
    if (!open) return;
    (searchable ? search.current : list.current)?.focus();
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) close(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, searchable]);
  useEffect(() => { if (open) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" }); }, [open, active, shown]);

  const keys = (e: React.KeyboardEvent) => {
    const last = shown.length - 1;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(last, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home" && !searchable) { e.preventDefault(); setActive(0); }
    else if (e.key === "End" && !searchable) { e.preventDefault(); setActive(last); }
    else if (e.key === "Enter" || (e.key === " " && !searchable)) { e.preventDefault(); if (shown[active]) pick(shown[active]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") close(false);
  };
  const opener = (e: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); show(); }
    else if (searchable && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); show(e.key); }
  };

  const pad = size === "sm" ? "py-1 pl-2.5 pr-7 text-xs" : "py-2 pl-3 pr-9 text-sm";
  const activeId = shown[active] ? `${id}-o${active}` : undefined;

  return (
    <div ref={root} className={`relative ${size === "sm" ? "inline-block" : "block w-full"} ${className}`}>
      {name && <input ref={hidden} type="hidden" name={name} value={current} />}
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={label ? `${label}: ${selected?.label ?? placeholder}` : undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={opener}
        className={`relative w-full rounded-lg border bg-bg-2 text-left text-ink transition-colors hover:border-violet/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet/30 ${open ? "border-violet ring-2 ring-violet/30" : "border-line"} ${pad}`}
      >
        <span className={`block truncate ${selected ? "" : "text-muted"}`}>{selected?.label ?? placeholder}</span>
        <svg aria-hidden viewBox="0 0 20 20" className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted transition-transform ${size === "sm" ? "right-2 h-3.5 w-3.5" : "right-3 h-4 w-4"} ${open ? "rotate-180" : ""}`}>
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className={`absolute z-50 w-full min-w-[14rem] max-w-[calc(100vw-2rem)] ${right ? "right-0" : "left-0"} overflow-hidden rounded-xl border border-line bg-card shadow-2xl shadow-black/40 ${up ? "bottom-full mb-1.5" : "top-full mt-1.5"}`}>
          {searchable && (
            <div className="relative border-b border-line p-2">
              <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted">
                <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={search}
                type="text"
                role="combobox"
                aria-expanded
                aria-controls={`${id}-list`}
                aria-activedescendant={activeId}
                aria-autocomplete="list"
                aria-label={`Search ${label || "options"}`}
                placeholder="Search…"
                value={q}
                onChange={(e) => { e.stopPropagation(); setQ(e.target.value); setActive(0); }} // keep typing from reaching a form onChange
                onKeyDown={keys}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-md border border-line bg-bg-2 py-1.5 pl-8 pr-2 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none"
              />
            </div>
          )}
          <ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            aria-activedescendant={searchable ? undefined : activeId}
            onKeyDown={searchable ? undefined : keys}
            className="max-h-64 overflow-y-auto overscroll-contain p-1 focus:outline-none"
          >
            {shown.map((o, i) => {
              const on = o.value === current;
              return (
                <li
                  key={o.value}
                  id={`${id}-o${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={on}
                  onPointerMove={() => setActive(i)}
                  onClick={() => pick(o)}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm ${i === active ? "bg-violet/15 text-ink" : "text-ink/85"} ${on ? "font-semibold" : ""}`}
                >
                  <span className="min-w-0 flex-1 truncate"><Highlight label={o.label} q={q} /></span>
                  {on && <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-violet"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </li>
              );
            })}
            {!shown.length && <li className="px-2.5 py-3 text-center text-sm text-muted">No matches for “{q}”</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
