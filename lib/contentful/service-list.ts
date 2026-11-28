export const listedServiceSlugs = [
  "website-and-application-development",
  "legacy-frontend-modernisation",
] as const;

export function selectListedServices<T extends { slug: string; displayOrder: number }>(services: T[]): T[] {
  const allowed = new Set<string>(listedServiceSlugs);
  return services
    .filter((service) => allowed.has(service.slug))
    .sort((left, right) => left.displayOrder - right.displayOrder || left.slug.localeCompare(right.slug));
}
