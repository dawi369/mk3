import { NEXT_PUBLIC_SITE_URL } from "@/config/env";
import { RootProvider } from "@/providers/root-provider";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Swordfish: Futures Intelligence",
    template: "%s | Swordfish",
  },
  description: "Futures. Focused. Fast",
  keywords: [
    "Trading",
    "Futures",
    "Swordfish",
    "Real-time market data",
    "Technical indicators",
  ],
  authors: [{ name: "David Erwin", url: "/" }],
  creator: "David Erwin",
  publisher: "Swordfish",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://swordfish.trade",
    title: "Swordfish: Futures Terminal",
    description:
      "Next-generation futures trading terminal. Sub-millisecond latency, institutional-grade data, and intelligent insights for professional traders.",
    siteName: "Swordfish",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Swordfish Futures Terminal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swordfish: Futures Terminal",
    description: "Futures. Focused. Fast",
    creator: "@devDawi",
    images: ["/assets/images/fishLogo.png"],
  },
  icons: {
    icon: [
      // Light mode
      {
        url: "/mk3Logo.svg",
        type: "image/svg+xml",
        sizes: "any",
        media: "(prefers-color-scheme: light)",
      },
      // Dark mode
      {
        url: "/mk3LogoTransparent.svg",
        type: "image/svg+xml",
        sizes: "any",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Swordfish",
  },
  verification: {
    // Add these when you get them from Google/Bing
    // google: "your-google-site-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
