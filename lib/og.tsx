import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared poster-left / text-right card used by every generated Open Graph image. */
export function posterCard(opts: { poster: string | null; kicker: string; title: string; sub: string; badge?: string | null }) {
  const { poster, kicker, title, sub, badge } = opts;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg,#0b0d13 0%,#161b28 70%,#2a2550 100%)", color: "#e8ecf5", fontFamily: "sans-serif" }}>
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
          {badge && <div style={{ marginTop: 28, alignSelf: "flex-start", padding: "10px 20px", borderRadius: 12, background: "#ffc857", color: "#0b0d13", fontSize: 28, fontWeight: 800 }}>{badge}</div>}
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 800 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ff4d6d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22 }}>A</div>
            {site.name}
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
