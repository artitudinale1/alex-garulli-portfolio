import { cacheLife, cacheTag } from "next/cache";
import { safeEmail } from "@/lib/format";
import { PortfolioContentError } from "./portfolio";
import { selectListedServices } from "./service-list";

export type Service = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  features: string[];
  displayOrder: number;
};

export type ServicePageContent = {
  services: Service[];
  email: string | null;
  fullName: string;
};

type ContentfulResponse = {
  data?: {
    profileCollection?: { items?: Array<{ fullName?: string | null; email?: string | null } | null> | null };
    serviceCollection?: { items?: Array<Partial<Service> | null> | null };
  };
  errors?: Array<{ message?: string }>;
};

const SERVICE_QUERY = `
  query Services {
    profileCollection(limit: 1) {
      items {
        fullName
        email
      }
    }
    serviceCollection(limit: 20) {
      items {
        title
        slug
        tagline
        description
        features
        displayOrder
      }
    }
  }
`;

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

function mapServices(items: Array<Partial<Service> | null> | null | undefined): Service[] {
  const services = (items ?? []).flatMap((item) => {
    if (!item?.title || !item.slug || typeof item.displayOrder !== "number") return [];
    return [
      {
        title: item.title.trim(),
        slug: item.slug.trim(),
        tagline: item.tagline?.trim() ?? "",
        description: item.description?.trim() ?? "",
        features: textList(item.features),
        displayOrder: item.displayOrder,
      },
    ];
  });
  return selectListedServices(services);
}

async function requestServicePage(): Promise<ServicePageContent> {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const environment = process.env.CONTENTFUL_ENVIRONMENT;
  const token = process.env.CONTENTFUL_DELIVERY_TOKEN;
  if (!spaceId || !environment || !token) {
    throw new PortfolioContentError("Contentful delivery configuration is incomplete.");
  }

  let response: Response;
  try {
    response = await fetch(
      `https://graphql.contentful.com/content/v1/spaces/${spaceId}/environments/${environment}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: SERVICE_QUERY }),
      },
    );
  } catch {
    throw new PortfolioContentError("Contentful could not be reached.");
  }

  if (!response.ok) {
    throw new PortfolioContentError(`Contentful request failed with status ${response.status}.`);
  }

  const body = (await response.json()) as ContentfulResponse;
  if (body.errors?.length) {
    throw new PortfolioContentError("Contentful returned an error for the services query.");
  }

  const profile = body.data?.profileCollection?.items?.find((item) => item?.fullName);
  if (!profile?.fullName) throw new PortfolioContentError("Contentful did not return a profile.");
  const services = mapServices(body.data?.serviceCollection?.items);
  if (services.length === 0) {
    throw new PortfolioContentError("Contentful did not return the listed services.");
  }

  return {
    services,
    email: safeEmail(typeof profile.email === "string" ? profile.email : ""),
    fullName: profile.fullName.trim(),
  };
}

export async function getServicePage(): Promise<ServicePageContent> {
  "use cache";
  cacheLife("minutes");
  cacheTag("contentful-services");
  return requestServicePage();
}
