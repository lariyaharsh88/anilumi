import { ImageResponse } from "next/og";
import { site } from "@/lib/site";
import { ogFonts, OgBrand } from "@/lib/og";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "radial-gradient(circle at 85% 15%, rgba(193,60,240,.35), transparent 45%), linear-gradient(135deg,#0b0d13 0%,#161b28 60%,#2a2550 100%)", color: "#e8ecf5", fontFamily: "Inter" }}>
        <OgBrand size={72} />
        <div style={{ marginTop: 44, fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 1000 }}>Anime schedule, release dates &amp; where to watch</div>
        <div style={{ marginTop: 24, fontSize: 30, fontWeight: 500, color: "#8f9ab3" }}>Watch orders · binge planner · countdowns · seasonal charts</div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
