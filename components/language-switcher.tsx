import { Furigana } from "@/components/furigana";
import { japaneseLanguageLabel } from "@/lib/i18n/messages";
import { localeChoices, type SiteLocale } from "@/lib/i18n/locales";

export function LanguageSwitcher({ locale, label }: { locale: SiteLocale; label: string }) {
  return (
    <nav aria-label={label}>
      <ul className="language-switcher">
        {localeChoices.map((choice) => (
          <li key={choice.locale}>
            <a
              href={choice.href}
              hrefLang={choice.htmlLang}
              aria-current={choice.locale === locale ? "page" : undefined}
            >
              {locale === "ja" && choice.locale === "ja" ? (
                <>
                  {"🇯🇵 "}
                  <Furigana text={japaneseLanguageLabel} />
                </>
              ) : (
                choice.label
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
