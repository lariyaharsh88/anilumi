import { getAnimeBySlug, posterUrl, fmtDate, animePath } from "@/lib/kitsu";
import { site, abs } from "@/lib/site";

export const revalidate = 1800;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Self-contained embeddable countdown card (iframe-able; no site chrome, no external scripts). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) return new Response("Not found", { status: 404 });
  const poster = posterUrl(a, "small") || "";
  const iso = a.status === "current" ? a.nextRelease : a.status === "upcoming" ? a.startDate : null;
  const when = iso ? fmtDate(iso, { weekday: "short", month: "short", day: "numeric", ...(iso.length > 10 ? { hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" } : {}) }) : null;
  const label = a.status === "current" ? "Next episode" : a.status === "upcoming" ? "Premieres" : "Finished";
  const link = abs(animePath(a));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(a.title)} countdown – ${site.name}</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0d13;color:#e8ecf5}
a{color:inherit;text-decoration:none}.card{display:flex;gap:12px;padding:12px;border:1px solid #242b3b;border-radius:14px;background:#161b28;min-height:96px}
img{width:56px;height:80px;object-fit:cover;border-radius:8px;background:#242b3b;flex:none}.t{font-weight:700;font-size:15px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.l{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8f9ab3;margin-top:4px}.w{font-size:12px;color:#ff7a8f;margin-top:2px}
.cd{display:flex;gap:6px;margin-top:6px}.cd span{background:#0b0d13;border-radius:8px;padding:4px 8px;min-width:44px;text-align:center}.cd b{display:block;font-size:18px;font-variant-numeric:tabular-nums}.cd i{font-style:normal;font-size:9px;color:#8f9ab3;text-transform:uppercase}
.by{margin-left:auto;align-self:flex-end;font-size:10px;color:#8f9ab3;white-space:nowrap}.by b{color:#ff4d6d}
</style></head><body>
<a class="card" href="${esc(link)}" target="_top" rel="noopener">
<img src="${esc(poster)}" alt="">
<div style="min-width:0;flex:1"><div class="t">${esc(a.title)}</div><div class="l">${label}</div>${when ? `<div class="w">${esc(when)}${iso && iso.length > 10 ? " JST" : ""}</div>` : ""}
${iso ? `<div class="cd" id="cd" data-t="${esc(iso.length > 10 ? iso : `${iso}T00:00:00+09:00`)}"><span><b>--</b><i>d</i></span><span><b>--</b><i>h</i></span><span><b>--</b><i>m</i></span><span><b>--</b><i>s</i></span></div>` : ""}</div>
<div class="by">by <b>${site.name}</b></div></a>
<script>(function(){var el=document.getElementById('cd');if(!el)return;var t=new Date(el.getAttribute('data-t')).getTime();var bs=el.querySelectorAll('b');function tick(){var d=Math.max(0,Math.floor((t-Date.now())/1000));var v=[Math.floor(d/86400),Math.floor(d%86400/3600),Math.floor(d%3600/60),d%60];for(var i=0;i<4;i++)bs[i].textContent=String(v[i]).padStart(2,'0');}tick();setInterval(tick,1000);})();</script>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600", "X-Robots-Tag": "noindex" } });
}
