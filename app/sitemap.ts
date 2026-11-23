import type { MetadataRoute } from "next";
import { siteLocales, type SiteLocale } from "@/lib/i18n/locales";
import { canonicalUrl } from "@/lib/seo";

const languages = Object.fromEntries(siteLocales.map((locale) => [locale, canonicalUrl(locale)])) as Record<
  SiteLocale,
  string
>;

export default function sitemap(): MetadataRoute.Sitemap {
  return siteLocales.map((locale) => ({
    url: canonicalUrl(locale),
    changeFrequency: "monthly",
    priority: locale === "en" ? 1 : 0.8,
    alternates: {
      languages: { ...languages, "x-default": canonicalUrl("en") },
    },
  }));
}
