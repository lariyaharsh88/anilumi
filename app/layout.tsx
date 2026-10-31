import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import Analytics from "@/components/Analytics";
import MotionProvider from "@/components/MotionProvider";
import Toaster from "@/components/Toaster";
import ServiceWorker from "@/components/ServiceWorker";
import StickyLeadBar from "@/components/StickyLeadBar";
import { dbEnabled } from "@/lib/db";
import { SPOILER_PREPAINT, THEME_PREPAINT } from "@/lib/prepaint";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} – ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image", site: site.twitter },
  // Large image previews make pages eligible for Google Discover and image-rich results; full-length snippets.
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  manifest: "/manifest.webmanifest",
  alternates: { types: { "application/rss+xml": [{ url: "/feed.xml", title: `${site.name} – this week's episodes` }] } },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
};

export const viewport: Viewport = { themeColor: "#0b0d13", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        {/* Theme + spoiler shield: run synchronously before any content paints (see lib/prepaint.ts). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_PREPAINT + SPOILER_PREPAINT }} />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name,
            url: site.url,
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: `${site.url}/search?q={search_term_string}` },
              "query-input": "required name=search_term_string",
            },
          }}
        />
        <Analytics />
        <MotionProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <Toaster />
          <ServiceWorker />
          {dbEnabled() && <StickyLeadBar />}
        </MotionProvider>
      </body>
    </html>
  );
}
