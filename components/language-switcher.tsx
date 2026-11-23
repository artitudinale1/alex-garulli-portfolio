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
              {choice.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
