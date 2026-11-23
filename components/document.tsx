import { japanese, sans, serif } from "@/lib/fonts";
import type { SiteLocale } from "@/lib/i18n/locales";

export function documentClassName(locale: SiteLocale): string {
  return locale === "ja"
    ? `${sans.variable} ${serif.variable} ${japanese.variable}`
    : `${sans.variable} ${serif.variable}`;
}
