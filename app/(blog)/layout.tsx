import type { Metadata } from "next";
import { documentClassName } from "@/components/document";
import { japanese } from "@/lib/fonts";
import { siteUrl } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Blog | Alex Garulli",
    template: "%s | Alex Garulli",
  },
  description: "Notes from Alex Garulli on frontend engineering, Japanese and other work.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${documentClassName("en")} ${japanese.variable}`}>
      <body className="blog-page">{children}</body>
    </html>
  );
}
