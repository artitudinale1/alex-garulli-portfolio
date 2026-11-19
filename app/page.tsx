import { HomePage, Unavailable } from "@/components/home-page";
import { getPortfolio, PortfolioContentError } from "@/lib/contentful/portfolio";

export default async function Home() {
  const portfolio = await getPortfolio().catch((error: unknown) => {
    if (!(error instanceof PortfolioContentError)) {
      console.error("Portfolio content could not be loaded.");
    }
    return null;
  });

  if (!portfolio) return <Unavailable />;
  return <HomePage portfolio={portfolio} />;
}
