import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://khanomcenter.vercel.app";

// Optimized font weights for fast first load
const arabicFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "800"],
  variable: "--font-arabic",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "مجمع خانم - أزياء وكوزمتكس",
    template: "%s | مجمع خانم",
  },
  description: "المعرض الرقمي لمنتجات مجمع خانم - ملابس نسائية وأطفال ومستحضرات تجميل مع الأسعار والتفاصيل",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "مجمع خانم",
  },
  openGraph: {
    siteName: "مجمع خانم للأزياء والكوزمتكس",
    locale: "ar_IQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${arabicFont.variable} h-full antialiased`}>
      <head>
        {/* Preconnect to Cloudflare R2 for instant image delivery on first load */}
        <link rel="preconnect" href="https://pub-57b2de64f9154f7bbe89467ccbc4dedd.r2.dev" />
        <link rel="dns-prefetch" href="https://pub-57b2de64f9154f7bbe89467ccbc4dedd.r2.dev" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 pb-[env(safe-area-inset-bottom)] select-none">
        {children}
      </body>
    </html>
  );
}
