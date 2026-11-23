export const siteLocales = ["en", "it", "ja"] as const;

export type SiteLocale = (typeof siteLocales)[number];

export const sourceContentLocale = "en-US";

export const contentLocales = {
  it: "it-IT",
  ja: "ja-JP",
} as const;

export function isSiteLocale(value: string): value is SiteLocale {
  return siteLocales.some((locale) => locale === value);
}

export function contentfulLocale(locale: SiteLocale): string | null {
  if (locale === "en") return null;
  return contentLocales[locale];
}

export function htmlLang(locale: SiteLocale): SiteLocale {
  return locale;
}

export function dateLocale(locale: SiteLocale): string {
  if (locale === "it") return "it-IT";
  if (locale === "ja") return "ja-JP";
  return "en-GB";
}

export const localeChoices = [
  { locale: "en", href: "/", htmlLang: "en", label: "🇬🇧 EN" },
  { locale: "it", href: "/it", htmlLang: "it", label: "🇮🇹 IT" },
  { locale: "ja", href: "/ja", htmlLang: "ja", label: "🇯🇵 日本語" },
] as const satisfies ReadonlyArray<{
  locale: SiteLocale;
  href: string;
  htmlLang: string;
  label: string;
}>;
