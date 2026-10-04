import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Pamuk Haber — Sadece iç ısıtan haberler",
    template: "%s · Pamuk Haber",
  },
  description:
    "Kötü haberlerden yorulanlar için: dünyadan ve Türkiye'den yalnızca güzel, umut veren, iç ısıtan haberler. Kaydır, gülümse.",
  applicationName: "Pamuk Haber",
  appleWebApp: { capable: true, title: "Pamuk Haber", statusBarStyle: "black-translucent" },
  openGraph: { siteName: "Pamuk Haber", locale: "tr_TR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf5" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1820" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
