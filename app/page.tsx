import { HomePage, Unavailable } from "@/components/home-page";
import { PersonJsonLd } from "@/components/person-json-ld";
import { getPortfolio, PortfolioContentError } from "@/lib/contentful/portfolio";

export default async function Home() {
  const portfolio = await getPortfolio().catch((error: unknown) => {
    if (!(error instanceof PortfolioContentError)) {
      console.error("Portfolio content could not be loaded.");
    }
    return null;
  });

  if (!portfolio) return <Unavailable />;
  return (
    <>
      <PersonJsonLd profile={portfolio.profile} />
      <HomePage portfolio={portfolio} />
    </>
  );
}
