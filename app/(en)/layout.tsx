import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { documentClassName } from "@/components/document";
import { localeChoices } from "@/lib/i18n/locales";
import { canonicalUrl, localeMetadata } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = localeMetadata("en");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={documentClassName("en")}>
      <head>
        <link rel="canonical" href={canonicalUrl("en")} />
        <meta property="og:url" content={canonicalUrl("en")} />
        {localeChoices.map((choice) => (
          <link key={choice.locale} rel="alternate" hrefLang={choice.htmlLang} href={canonicalUrl(choice.locale)} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={canonicalUrl("en")} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
