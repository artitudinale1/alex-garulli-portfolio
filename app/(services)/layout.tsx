import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { documentClassName } from "@/components/document";
import { siteUrl } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Services | Alex Garulli",
    template: "%s | Alex Garulli",
  },
  description:
    "Website and application development, and legacy frontend modernisation, by a senior frontend engineer in London.",
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${documentClassName("en")} services-page`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
