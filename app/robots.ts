import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/my/wrapped"], disallow: ["/search", "/my", "/api/", "/embed/", "/random", "/quiz/results"] }], sitemap: `${site.url}/sitemap.xml` };
}
