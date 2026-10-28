/**
 * Inline scripts that run before first paint. They live outside the "use client" watchlist module:
 * a server component importing a constant from a client module gets a client reference, not the string.
 */
export const SHIELD_KEY = "anilumi:spoiler-shield";

/**
 * Runs before first paint (inline at the top of <body>): blurs spoiler-prone content for every show with
 * recorded progress, so nothing flashes before React decides which episodes are safe. It appends its own
 * <style> to <head> (React 19 skips unexpected head nodes during hydration; filling a React-rendered
 * <style> would be a hydration mismatch). Ids are digit-checked before going into CSS.
 */
export const SPOILER_PREPAINT = `(function(){try{if(localStorage.getItem('${SHIELD_KEY}')==='off')return;var l=JSON.parse(localStorage.getItem('anilumi:watchlist:v1')||'[]'),c='';for(var i=0;i<l.length;i++){var t=l[i];if(t&&typeof t.progress==='number'&&/^\\d+$/.test(t.id))c+='[data-sp="'+t.id+'"] [data-sp-body]:not([data-sp-ok]){filter:blur(8px);user-select:none}';}if(c){var s=document.createElement('style');s.id='sp-style';s.textContent=c;document.head.appendChild(s);}}catch(e){}})();`;

/** Colour theme: dark by default (the site is designed dark-first); a saved choice wins. */
export type Theme = "dark" | "light";
export const THEME_KEY = "anilumi:theme";
export const THEME_COLOR: Record<Theme, string> = { dark: "#0b0d13", light: "#f5f6fa" };

/** Inline, runs before first paint so a light-mode visitor never sees a dark flash. */
export const THEME_PREPAINT = `(function(){try{if(localStorage.getItem('${THEME_KEY}')==='light'){document.documentElement.dataset.theme='light';var m=document.querySelector('meta[name="theme-color"]');if(m)m.content='${THEME_COLOR.light}';}}catch(e){}})();`;
