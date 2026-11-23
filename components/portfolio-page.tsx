import { HomePage, Unavailable } from "@/components/home-page";
import { PersonJsonLd } from "@/components/person-json-ld";
import { getPortfolio, PortfolioContentError } from "@/lib/contentful/portfolio";
import type { SiteLocale } from "@/lib/i18n/locales";

export async function PortfolioPage({ locale }: { locale: SiteLocale }) {
  const portfolio = await getPortfolio(locale).catch((error: unknown) => {
    if (!(error instanceof PortfolioContentError)) {
      console.error("Portfolio content could not be loaded.");
    }
    return null;
  });

  if (!portfolio) return <Unavailable locale={locale} />;
  return (
    <>
      <PersonJsonLd profile={portfolio.profile} locale={locale} />
      <HomePage portfolio={portfolio} locale={locale} />
    </>
  );
}
