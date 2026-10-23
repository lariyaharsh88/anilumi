import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#0b0d13 0%,#161b28 60%,#2a2550 100%)", color: "#e8ecf5", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 800 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "#ff4d6d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>A</div>
          {site.name}
        </div>
        <div style={{ marginTop: 40, fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>Anime schedule, release dates & where to watch</div>
        <div style={{ marginTop: 24, fontSize: 28, color: "#8f9ab3" }}>Watch orders · binge planner · countdowns · seasonal charts</div>
      </div>
    ),
    size,
  );
}
