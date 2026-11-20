import type { Metadata } from "next";
import { Newsreader, Outfit } from "next/font/google";
import { shareImage, siteDescription, siteTitle, siteUrl } from "@/lib/seo";
import "./globals.css";

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "Alex Garulli",
    type: "website",
    locale: "en_GB",
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [shareImage],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <head>
        <link rel="canonical" href={`${siteUrl}/`} />
        <meta property="og:url" content={`${siteUrl}/`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
