import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog/posts";
import { siteLocales, type SiteLocale } from "@/lib/i18n/locales";
import { canonicalUrl, siteUrl } from "@/lib/seo";

const languages = Object.fromEntries(siteLocales.map((locale) => [locale, canonicalUrl(locale)])) as Record<
  SiteLocale,
  string
>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const portfolio = siteLocales.map((locale) => ({
    url: canonicalUrl(locale),
    changeFrequency: "monthly" as const,
    priority: locale === "en" ? 1 : 0.8,
    alternates: {
      languages: { ...languages, "x-default": canonicalUrl("en") },
    },
  }));
  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  try {
    posts = await getPublishedPosts();
  } catch {
    posts = [];
  }
  return [
    ...portfolio,
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
