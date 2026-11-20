import type { Profile } from "@/lib/contentful/types";
import { siteUrl } from "@/lib/seo";

function httpsUrl(value: string) {
  return value.startsWith("https://") ? value : null;
}

export function PersonJsonLd({ profile }: { profile: Profile }) {
  const sameAs = [profile.linkedin, profile.github]
    .map(httpsUrl)
    .filter((url) => url !== null);

  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    jobTitle: profile.role,
    url: `${siteUrl}/`,
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
