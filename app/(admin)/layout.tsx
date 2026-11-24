import type { Metadata } from "next";
import { documentClassName } from "@/components/document";
import { japanese } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Blog editor | Alex Garulli",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${documentClassName("en")} ${japanese.variable}`}>
      <body className="blog-page">{children}</body>
    </html>
  );
}
