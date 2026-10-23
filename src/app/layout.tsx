import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const arabicFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "مجمع خانم - أزياء وكوزمتكس",
  description: "المعرض الرقمي لمنتجات مجمع خانم - ملابس نسائية وأطفال ومستحضرات تجميل",
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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 pb-[env(safe-area-inset-bottom)] select-none">
        {children}
      </body>
    </html>
  );
}
