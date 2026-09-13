import type { Metadata, Viewport } from "next";
import { Cormorant, Montserrat } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { SmoothScroll } from "@/lib/smooth-scroll";

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
  preload: true,
});

export const metadataBase = new URL("https://travel-agency-marketplace.com");

export const metadata: Metadata = {
  title: {
    default: "Travel Agency Marketplace",
    template: "%s | Travel Agency Marketplace",
  },
  metadataBase,
  description: "Ultra-premium multi-tenant travel marketplace platform for luxury travel agencies",
  keywords: ["luxury travel", "travel agency", "white-label", "multi-tenant", "booking", "destinations", "experiences"],
  authors: [{ name: "Travel Agency Marketplace" }],
  creator: "Travel Agency Marketplace",
  publisher: "Travel Agency Marketplace",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://travel-agency-marketplace.com",
    siteName: "Travel Agency Marketplace",
    title: "Travel Agency Marketplace | Premium Travel Platform",
    description: "Ultra-premium multi-tenant travel marketplace platform for luxury travel agencies",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Travel Agency Marketplace - Premium Travel Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Agency Marketplace | Premium Travel Platform",
    description: "Ultra-premium multi-tenant travel marketplace platform for luxury travel agencies",
    images: ["/og-image.png"],
    creator: "@travelagency",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="font-body antialiased">
        <SmoothScroll />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}