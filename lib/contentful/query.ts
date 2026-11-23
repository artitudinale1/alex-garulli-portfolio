export const PORTFOLIO_QUERY = `
  query Portfolio {
    profileCollection(limit: 5) {
      items {
        fullName
        role
        bio
        location
        email
        linkedin
        github
      }
    }
    experienceCollection(limit: 20) {
      items {
        company
        role
        startDate
        endDate
        description
        technologies
        displayOrder
      }
    }
    projectCollection(limit: 20) {
      items {
        title
        description
        technologies
        repositoryUrl
        demoUrl
        displayOrder
      }
    }
  }
`;

const PORTFOLIO_LOCALE_QUERY = `
  query Portfolio($locale: String!) {
    profileCollection(limit: 5, locale: $locale) {
      items {
        fullName
        role
        bio
        location
        email
        linkedin
        github
      }
    }
    experienceCollection(limit: 20, locale: $locale) {
      items {
        company
        role
        startDate
        endDate
        description
        technologies
        displayOrder
      }
    }
    projectCollection(limit: 20, locale: $locale) {
      items {
        title
        description
        technologies
        repositoryUrl
        demoUrl
        displayOrder
      }
    }
  }
`;

export type PortfolioRequest = {
  query: string;
  variables?: { locale: string };
};

export function portfolioRequest(contentfulLocale: string | null): PortfolioRequest {
  if (!contentfulLocale) return { query: PORTFOLIO_QUERY };
  return { query: PORTFOLIO_LOCALE_QUERY, variables: { locale: contentfulLocale } };
}

export function isUnknownLocaleError(errors: Array<{ message?: string }> | undefined): boolean {
  return (errors ?? []).some((error) =>
    /unknown locale|requested locale|locale .+ (does not exist|is invalid|not found)/i.test(
      error.message ?? "",
    ),
  );
}
