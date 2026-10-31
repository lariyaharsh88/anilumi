import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { markDataUri, BRAND } from "./brand";

export const OG_SIZE = { width: 1200, height: 630 };

type OgFont = { name: string; data: ArrayBuffer | Buffer; weight: 500 | 800; style: "normal" };
let fontsP: Promise<OgFont[]> | null = null;

/**
 * A file from public/: through the Workers static-assets binding on Cloudflare (Workers have no file system),
 * from disk on Node.
 */
async function publicFile(path: string): Promise<ArrayBuffer | Buffer> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const res = await (env as unknown as { ASSETS: { fetch(u: URL): Promise<Response> } }).ASSETS.fetch(new URL(path, "https://assets.local"));
    if (res.ok) return res.arrayBuffer();
  } catch { /* not on Workers */ }
  return readFile(join(process.cwd(), "public", path));
}

/** Inter 500/800 from public/fonts (Satori's built-in font has no bold and no ★ glyph). */
export function ogFonts(): Promise<OgFont[]> {
  fontsP ??= Promise.all(([500, 800] as const).map(async (weight) => ({ name: "Inter", data: await publicFile(`/fonts/Inter-${weight}.ttf`), weight, style: "normal" as const })))
    .catch((err) => { fontsP = null; throw err; }); // retry on the next image
  return fontsP;
}

/** Mark + "AniLumi" wordmark, as in the site header. */
export function OgBrand({ size = 40 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.3, fontSize: size * 0.68, fontWeight: 800, letterSpacing: -0.5 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={markDataUri()} width={size} height={size} alt="" />
      <span style={{ color: "#ffffff" }}>Ani</span>
      <span style={{ marginLeft: -size * 0.3, backgroundImage: `linear-gradient(100deg, ${BRAND.pink}, ${BRAND.magenta} 55%, ${BRAND.violet})`, backgroundClip: "text", color: "transparent" }}>Lumi</span>
    </div>
  );
}

const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";
/** Badges may start with ★ or ⏱; draw those as SVG since no bundled font has the glyphs. */
function Badge({ text }: { text: string }) {
  const icon = text.startsWith("★") ? "star" : text.startsWith("⏱") ? "clock" : null;
  const label = icon ? text.slice(1).trim() : text;
  return (
    <div style={{ marginTop: 28, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderRadius: 12, background: "#ffc857", color: "#0b0d13", fontSize: 28, fontWeight: 800 }}>
      {icon === "star" && <svg width="26" height="26" viewBox="0 0 24 24"><path d={STAR} fill="#0b0d13" /></svg>}
      {icon === "clock" && <svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#0b0d13" strokeWidth="2.6" /><path d="M12 7v5l3.5 2" fill="none" stroke="#0b0d13" strokeWidth="2.6" strokeLinecap="round" /></svg>}
      {label}
    </div>
  );
}

/** Shared poster-left / text-right card used by every generated Open Graph image. */
export async function posterCard(opts: { poster: string | null; kicker: string; title: string; sub: string; badge?: string | null }) {
  const { poster, kicker, title, sub, badge } = opts;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg,#0b0d13 0%,#161b28 70%,#2a2550 100%)", color: "#e8ecf5", fontFamily: "Inter" }}>
        <div style={{ width: 380, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" width={300} height={450} style={{ objectFit: "cover", borderRadius: 16, border: "2px solid #242b3b" }} />
          ) : (
            <div style={{ width: 300, height: 450, borderRadius: 16, background: "#242b3b" }} />
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 60px 60px 10px" }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#ff4d6d", textTransform: "uppercase" }}>{kicker}</div>
          <div style={{ marginTop: 16, fontSize: title.length > 40 ? 48 : 60, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
          <div style={{ marginTop: 20, fontSize: 28, color: "#8f9ab3", lineHeight: 1.3 }}>{sub}</div>
          {badge && <Badge text={badge} />}
          <div style={{ marginTop: "auto", display: "flex" }}><OgBrand size={44} /></div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
