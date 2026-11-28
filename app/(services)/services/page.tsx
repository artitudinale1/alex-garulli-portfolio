import type { Metadata } from "next";
import { ServicesPage, ServicesUnavailable } from "@/components/services-page";
import { getServicePage, type ServicePageContent } from "@/lib/contentful/services";
import { siteUrl } from "@/lib/seo";

const title = "Services | Alex Garulli";
const description =
  "Website and application development, and legacy frontend modernisation, by a senior frontend engineer in London.";

export const metadata: Metadata = {
  title: "Services",
  description,
  alternates: { canonical: `${siteUrl}/services` },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/services`,
    type: "website",
  },
};

export default async function Page() {
  let content: ServicePageContent | null = null;
  try {
    content = await getServicePage();
  } catch {
    content = null;
  }
  if (!content) return <ServicesUnavailable />;
  return <ServicesPage content={content} />;
}
