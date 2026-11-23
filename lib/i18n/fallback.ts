import type { Experience, Portfolio, Profile, Project } from "../contentful/types";
import { translationCatalog, type CatalogItem, type TargetLocale } from "./catalog.ts";
import type { SiteLocale } from "./locales";

const catalogLocale = {
  it: "it-IT",
  ja: "ja-JP",
} as const satisfies Record<Exclude<SiteLocale, "en">, TargetLocale>;

function dateKey(value: string): string {
  return /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? value;
}

function sameIdentity(field: string, actual: string, expected: string): boolean {
  return field.toLowerCase().includes("date") ? dateKey(actual) === dateKey(expected) : actual === expected;
}

function translatedField(current: string, source: string | undefined, translation: string | undefined): string {
  if (!source || !translation || current !== source) return current;
  return translation;
}

function uniqueMatches<T>(
  entries: readonly T[],
  candidates: (entry: T) => CatalogItem[],
): Map<T, CatalogItem> {
  const found = entries.map((entry) => ({ entry, matches: candidates(entry) }));
  const claims = new Map<CatalogItem, number>();
  for (const item of found) {
    if (item.matches.length !== 1) continue;
    claims.set(item.matches[0], (claims.get(item.matches[0]) ?? 0) + 1);
  }
  const pairs = new Map<T, CatalogItem>();
  for (const item of found) {
    const match = item.matches.length === 1 ? item.matches[0] : null;
    if (match && claims.get(match) === 1) pairs.set(item.entry, match);
  }
  return pairs;
}

function translateProfile(profile: Profile, locale: TargetLocale): Profile {
  const match = uniqueMatches([profile], (entry) =>
    translationCatalog.filter(
      (item) => item.contentType === "profile" && sameIdentity("fullName", entry.fullName, item.match.fullName ?? ""),
    ),
  ).get(profile);
  if (!match) return profile;
  return {
    ...profile,
    role: translatedField(profile.role, match.source.role, match.translations[locale].role),
    bio: translatedField(profile.bio, match.source.bio, match.translations[locale].bio),
  };
}

function experienceCandidates(experience: Experience, locale: TargetLocale): CatalogItem[] {
  return translationCatalog.filter((item) => {
    if (item.contentType !== "experience") return false;
    if (!sameIdentity("company", experience.company, item.match.company ?? "")) return false;
    if (!sameIdentity("startDate", experience.startDate, item.match.startDate ?? "")) return false;
    const translatedRole = item.translations[locale].role;
    return experience.role === item.source.role || experience.role === translatedRole;
  });
}

function translateExperience(experience: Experience, locale: TargetLocale, match: CatalogItem | undefined): Experience {
  if (!match) return experience;
  return {
    ...experience,
    role: translatedField(experience.role, match.source.role, match.translations[locale].role),
    description: translatedField(
      experience.description,
      match.source.description,
      match.translations[locale].description,
    ),
  };
}

function translateProject(project: Project, locale: TargetLocale, match: CatalogItem | undefined): Project {
  if (!match) return project;
  return {
    ...project,
    description: translatedField(project.description, match.source.description, match.translations[locale].description),
  };
}

export function applyCatalogTranslations(portfolio: Portfolio, locale: SiteLocale): Portfolio {
  if (locale === "en") return portfolio;
  const target = catalogLocale[locale];
  const experiences = uniqueMatches(portfolio.experiences, (entry) => experienceCandidates(entry, target));
  const projects = uniqueMatches(portfolio.projects, (entry) =>
    translationCatalog.filter(
      (item) => item.contentType === "project" && sameIdentity("title", entry.title, item.match.title ?? ""),
    ),
  );

  return {
    profile: locale === "it" ? portfolio.profile : translateProfile(portfolio.profile, target),
    experiences: portfolio.experiences.map((experience) =>
      translateExperience(experience, target, experiences.get(experience)),
    ),
    projects: portfolio.projects.map((project) => translateProject(project, target, projects.get(project))),
  };
}
