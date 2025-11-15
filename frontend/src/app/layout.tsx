import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NEXT_PUBLIC_SITE_URL } from "@/config/env";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Swordfish: Futures Dashboard",
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
    title: "Swordfish: Futures Dashboard",
    description: "Futures. Focused. Fast",
    url: "/",
    siteName: "Swordfish",
    images: [
      {
        url: "/assets/images/fishLogo.png",
        width: 1200,
        height: 630,
        alt: "Swordfish Futures Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Swordfish: Futures Dashboard",
    description: "Futures. Focused. Fast",
    creator: "@devDawi",
    images: ["/assets/images/fishLogo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png" }],
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
