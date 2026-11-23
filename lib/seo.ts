import type { Metadata } from "next";
import type { SiteLocale } from "@/lib/i18n/locales";

export const siteUrl = "https://www.alexgarulli.org.uk";

export const siteTitle = "Alex Garulli | Senior Frontend Engineer in London";

export const siteDescription =
  "Senior Frontend Engineer in London specialising in React, TypeScript, Next.js and Contentful. Explore projects, experience and technical expertise.";

export const shareImage = {
  url: "/brand/og.jpg",
  width: 1200,
  height: 627,
  alt: "Illustration of Beta and Kamome with cherry blossoms, a torii, Mount Fuji and Tokyo Tower.",
  type: "image/jpeg",
} as const;

const localeSeo = {
  en: {
    title: siteTitle,
    description: siteDescription,
    openGraphLocale: "en_GB",
  },
  it: {
    title: "Alex Garulli | Ingegnere frontend senior a Londra",
    description:
      "Ingegnere frontend senior a Londra, specializzato in React, TypeScript, Next.js e Contentful. Progetti, esperienza e competenze tecniche.",
    openGraphLocale: "it_IT",
  },
  ja: {
    title: "Alex Garulli | ロンドンのシニアフロントエンドエンジニア",
    description:
      "ロンドン在住のシニアフロントエンドエンジニア。React、TypeScript、Next.js、Contentfulを中心に、プロジェクト、経歴、技術的な専門性を紹介しています。",
    openGraphLocale: "ja_JP",
  },
} as const;

export function canonicalUrl(locale: SiteLocale): string {
  return locale === "en" ? `${siteUrl}/` : `${siteUrl}/${locale}`;
}

export function localeMetadata(locale: SiteLocale): Metadata {
  const copy = localeSeo[locale];
  return {
    metadataBase: new URL(siteUrl),
    title: copy.title,
    description: copy.description,
    openGraph: {
      title: copy.title,
      description: copy.description,
      siteName: "Alex Garulli",
      type: "website",
      locale: copy.openGraphLocale,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [shareImage],
    },
  };
}
