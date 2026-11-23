import type { SiteLocale } from "@/lib/i18n/locales";
import type { Profile } from "@/lib/contentful/types";
import { canonicalUrl } from "@/lib/seo";

function httpsUrl(value: string) {
  return value.startsWith("https://") ? value : null;
}

export function PersonJsonLd({ profile, locale }: { profile: Profile; locale: SiteLocale }) {
  const sameAs = [profile.linkedin, profile.github]
    .map(httpsUrl)
    .filter((url) => url !== null);

  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    jobTitle: profile.role,
    url: canonicalUrl(locale),
    ...(profile.location
      ? { homeLocation: { "@type": "Place", name: profile.location } }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
