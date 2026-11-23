import { cacheLife, cacheTag } from "next/cache";
import { applyCatalogTranslations } from "@/lib/i18n/fallback";
import { contentfulLocale, type SiteLocale } from "@/lib/i18n/locales";
import { isUnknownLocaleError, portfolioRequest } from "./query";
import type { Experience, Portfolio, Profile, Project } from "./types";

type ContentfulResponse = {
  data?: {
    profileCollection?: { items?: Array<Partial<Profile> | null> | null };
    experienceCollection?: { items?: Array<Partial<Experience> | null> | null };
    projectCollection?: { items?: Array<Partial<Project> | null> | null };
  };
  errors?: Array<{ message?: string }>;
};

export class PortfolioContentError extends Error {
  readonly code?: "unknown-locale";

  constructor(message: string, code?: "unknown-locale") {
    super(message);
    this.name = "PortfolioContentError";
    this.code = code;
  }
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new PortfolioContentError(`Contentful response is missing ${label}.`);
  }
  return value.trim();
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

function optionalUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function byDisplayOrder<T extends { displayOrder: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.displayOrder - right.displayOrder);
}

function mapProfile(items: Array<Partial<Profile> | null> | null | undefined): Profile {
  const item = items?.find((entry) => entry?.fullName);
  if (!item) throw new PortfolioContentError("Contentful did not return a profile.");
  return {
    fullName: requiredText(item.fullName, "profile name"),
    role: requiredText(item.role, "profile role"),
    bio: requiredText(item.bio, "profile bio"),
    location: typeof item.location === "string" ? item.location.trim() : "",
    email: typeof item.email === "string" ? item.email.trim() : "",
    linkedin: optionalUrl(item.linkedin) ?? "",
    github: optionalUrl(item.github) ?? "",
  };
}

function mapExperiences(items: Array<Partial<Experience> | null> | null | undefined): Experience[] {
  const experiences = (items ?? []).flatMap((item) => {
    if (!item?.company || !item.role || !item.startDate || typeof item.displayOrder !== "number") {
      return [];
    }
    return [
      {
        company: item.company.trim(),
        role: item.role.trim(),
        startDate: item.startDate,
        endDate: item.endDate ?? null,
        description: item.description?.trim() ?? "",
        technologies: textList(item.technologies),
        displayOrder: item.displayOrder,
      },
    ];
  });
  if (experiences.length === 0) {
    throw new PortfolioContentError("Contentful did not return any experience entries.");
  }
  return byDisplayOrder(experiences);
}

function mapProjects(items: Array<Partial<Project> | null> | null | undefined): Project[] {
  const projects = (items ?? []).flatMap((item) => {
    if (!item?.title || typeof item.displayOrder !== "number") return [];
    return [
      {
        title: item.title.trim(),
        description: item.description?.trim() ?? "",
        technologies: textList(item.technologies),
        repositoryUrl: optionalUrl(item.repositoryUrl),
        demoUrl: optionalUrl(item.demoUrl),
        displayOrder: item.displayOrder,
      },
    ];
  });
  if (projects.length === 0) {
    throw new PortfolioContentError("Contentful did not return any project entries.");
  }
  return byDisplayOrder(projects);
}

async function requestPortfolio(contentfulCode: string | null): Promise<Portfolio> {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const environment = process.env.CONTENTFUL_ENVIRONMENT;
  const token = process.env.CONTENTFUL_DELIVERY_TOKEN;
  if (!spaceId || !environment || !token) {
    throw new PortfolioContentError("Contentful delivery configuration is incomplete.");
  }

  const request = portfolioRequest(contentfulCode);
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
        body: JSON.stringify(request.variables ? request : { query: request.query }),
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
    throw new PortfolioContentError(
      "Contentful returned an error for the portfolio query.",
      isUnknownLocaleError(body.errors) ? "unknown-locale" : undefined,
    );
  }

  return {
    profile: mapProfile(body.data?.profileCollection?.items),
    experiences: mapExperiences(body.data?.experienceCollection?.items),
    projects: mapProjects(body.data?.projectCollection?.items),
  };
}

export async function getPortfolio(locale: SiteLocale = "en"): Promise<Portfolio> {
  "use cache";
  cacheLife("minutes");
  cacheTag("contentful-portfolio", `contentful-portfolio-${locale}`);

  try {
    return applyCatalogTranslations(await requestPortfolio(contentfulLocale(locale)), locale);
  } catch (error) {
    if (
      locale !== "en" &&
      error instanceof PortfolioContentError &&
      error.code === "unknown-locale"
    ) {
      return applyCatalogTranslations(await requestPortfolio(null), locale);
    }
    throw error;
  }
}
