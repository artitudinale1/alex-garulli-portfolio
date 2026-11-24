"use client";

import Image from "next/image";
import { cloudinaryCoverLoader, parseStoredImageUrl } from "@/lib/blog/images";

export function CoverImage({ url, alt, sizes }: { url: string | null; alt: string; sizes: string }) {
  const stored = url ? parseStoredImageUrl(url) : null;
  if (!stored) return null;
  const hostname = new URL(stored).hostname;
  if (hostname === "res.cloudinary.com") {
    return (
      <span className="blog-cover-frame">
        <Image loader={cloudinaryCoverLoader} src={stored} alt={alt} fill sizes={sizes} />
      </span>
    );
  }
  return (
    // Validated https image from the article record. It is not proxied through another image service.
    // eslint-disable-next-line @next/next/no-img-element
    <img className="blog-external-cover" src={stored} alt={alt} />
  );
}
