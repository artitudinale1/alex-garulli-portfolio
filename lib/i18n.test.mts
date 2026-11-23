import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localizedFields, translationCatalog, type CatalogItem, type ContentTypeId } from "./i18n/catalog.ts";
import { applyCatalogTranslations } from "./i18n/fallback.ts";
import { isUnknownLocaleError, portfolioRequest, PORTFOLIO_QUERY } from "./contentful/query.ts";
import type { Portfolio } from "./contentful/types.ts";
import { canonicalUrl, siteDescription, siteTitle } from "./seo.ts";
import { messagesFor } from "./i18n/messages.ts";
import { contentfulLocale, localeChoices } from "./i18n/locales.ts";
import { planTranslations, type EntrySnapshot, type TranslationSnapshot } from "./i18n/plan.ts";

function readySnapshot(): TranslationSnapshot {
  const contentTypes = (Object.keys(localizedFields) as ContentTypeId[]).map((id) => {
    const localized = {
      ...Object.fromEntries(localizedFields[id].map((field) => [field, false])),
      company: false,
    };
    return { id, version: 2, currentLocalized: localized, publishedLocalized: { ...localized } };
  });
  const entries: EntrySnapshot[] = translationCatalog.map((item, index) => ({
    id: `entry-${index}`,
    contentType: item.contentType,
    version: 3,
    pendingChanges: false,
    values: Object.fromEntries(
      Object.entries({ ...item.match, ...item.source }).map(([field, value]) => [field, { "en-US": value }]),
    ),
  }));
  return {
    locales: [{ code: "en-US", fallbackCode: null, optional: false }],
    contentTypes,
    entries,
  };
}

describe("locale routes", () => {
  it("keeps English at the canonical trailing-slash URL", () => {
    assert.equal(canonicalUrl("en"), "https://www.alexgarulli.org.uk/");
    assert.equal(canonicalUrl("it"), "https://www.alexgarulli.org.uk/it");
    assert.equal(canonicalUrl("ja"), "https://www.alexgarulli.org.uk/ja");
    assert.deepEqual(
      localeChoices.map((choice) => choice.label),
      ["🇬🇧 EN", "🇮🇹 IT", "🇯🇵 日本語"],
    );
  });

  it("keeps the English title and description", () => {
    assert.equal(siteTitle, "Alex Garulli | Senior Frontend Engineer in London");
    assert.equal(
      siteDescription,
      "Senior Frontend Engineer in London specialising in React, TypeScript, Next.js and Contentful. Explore projects, experience and technical expertise.",
    );
  });

  it("maps Italian and Japanese to Contentful locales and leaves English on the default query", () => {
    assert.equal(contentfulLocale("en"), null);
    assert.equal(contentfulLocale("it"), "it-IT");
    assert.equal(contentfulLocale("ja"), "ja-JP");
    assert.deepEqual(portfolioRequest(null), { query: PORTFOLIO_QUERY });
    assert.equal(portfolioRequest("it-IT").variables?.locale, "it-IT");
    assert.equal(portfolioRequest(null).query.includes("locale"), false);
  });
});

describe("interface copy", () => {
  it("uses the same message keys for every locale", () => {
    assert.deepEqual(Object.keys(messagesFor("it")), Object.keys(messagesFor("en")));
    assert.deepEqual(Object.keys(messagesFor("ja")), Object.keys(messagesFor("en")));
    assert.equal(messagesFor("en").present, "Present");
    assert.notEqual(messagesFor("ja").expertiseHeading, messagesFor("en").expertiseHeading);
  });
});

describe("translation plan", () => {
  it("plans optional locales, localized fields and entry writes without touching English", () => {
    const plan = planTranslations(readySnapshot());
    assert.equal(plan.blocked, false);
    assert.deepEqual(
      plan.localeCreates.map((locale) => locale.code),
      ["it-IT", "ja-JP"],
    );
    assert.equal(plan.localeCreates.every((locale) => locale.optional && locale.fallbackCode === "en-US"), true);
    assert.deepEqual(
      plan.contentTypeUpdates.map((update) => update.fields),
      [["role", "bio"], ["role", "description"], ["description"]],
    );
    assert.equal(plan.entryWrites.length, 40);
    assert.equal(plan.entryWrites.some((write) => write.locale === "en-US"), false);
    assert.equal(plan.entryWrites.some((write) => write.field === "company" || write.field === "title"), false);
  });

  it("refuses to overwrite drifted English or an existing different translation", () => {
    const drifted = readySnapshot();
    drifted.entries[0].values.role["en-US"] = "Changed role";
    const driftedPlan = planTranslations(drifted);
    assert.equal(driftedPlan.blocked, true);
    assert.equal(driftedPlan.entryWrites.some((write) => write.id === "entry-0"), false);

    const edited = readySnapshot();
    edited.entries[0].values.role["it-IT"] = "Traduzione esistente";
    const editedPlan = planTranslations(edited);
    assert.equal(editedPlan.blocked, true);
    assert.equal(
      editedPlan.entryWrites.some((write) => write.id === "entry-0" && write.field === "role" && write.locale === "it-IT"),
      false,
    );
  });

  it("skips a translation that is already stored", () => {
    const snapshot = readySnapshot();
    const item = translationCatalog[0];
    snapshot.entries[0].values.role["ja-JP"] = item.translations["ja-JP"].role;
    const plan = planTranslations(snapshot);
    assert.equal(plan.skipped.includes("entry-0 role ja-JP"), true);
    assert.equal(
      plan.entryWrites.some((write) => write.id === "entry-0" && write.field === "role" && write.locale === "ja-JP"),
      false,
    );
  });

  it("recognises an unknown Contentful locale error", () => {
    assert.equal(isUnknownLocaleError([{ message: "Unknown locale: it-IT" }]), true);
    assert.equal(isUnknownLocaleError([{ message: "Contentful request failed" }]), false);
  });
});

function catalogItems(contentType: ContentTypeId): CatalogItem[] {
  return translationCatalog.filter((item) => item.contentType === contentType);
}

function englishPortfolio(): Portfolio {
  const profile = catalogItems("profile")[0];
  return {
    profile: {
      fullName: profile.match.fullName,
      role: profile.source.role,
      bio: profile.source.bio,
      location: "London",
      email: "alex@example.com",
      linkedin: "https://www.linkedin.com/in/example",
      github: "https://github.com/example",
    },
    experiences: catalogItems("experience").map((item, index) => ({
      company: item.match.company,
      role: item.source.role,
      startDate: `${item.match.startDate}T00:00:00.000Z`,
      endDate: index === 0 ? null : "2023-06-01",
      description: item.source.description,
      technologies: ["TypeScript"],
      displayOrder: index,
    })),
    projects: catalogItems("project").map((item, index) => ({
      title: item.match.title,
      description: item.source.description,
      technologies: ["React"],
      repositoryUrl: "https://github.com/example/project",
      demoUrl: null,
      displayOrder: index,
    })),
  };
}

describe("catalog translation fallback", () => {
  it("leaves the English portfolio untouched", () => {
    const portfolio = englishPortfolio();
    assert.equal(applyCatalogTranslations(portfolio, "en"), portfolio);
  });

  it("keeps the Contentful Italian profile and translates experience and projects", () => {
    const portfolio = englishPortfolio();
    portfolio.profile = { ...portfolio.profile, role: "Ruolo pubblicato", bio: "Biografia pubblicata" };
    const translated = applyCatalogTranslations(portfolio, "it");

    assert.equal(translated.profile.role, "Ruolo pubblicato");
    assert.equal(translated.profile.bio, "Biografia pubblicata");
    assert.equal(translated.profile.location, "London");
    assert.equal(translated.experiences.length, 6);
    assert.equal(translated.projects.length, 6);
    for (const experience of translated.experiences) {
      const item = catalogItems("experience").find((entry) => entry.match.company === experience.company);
      assert.ok(item);
      assert.equal(experience.role, item.translations["it-IT"].role);
      assert.equal(experience.description, item.translations["it-IT"].description);
      assert.equal(experience.company, item.match.company);
      assert.equal(experience.startDate.endsWith("T00:00:00.000Z"), true);
      assert.deepEqual(experience.technologies, ["TypeScript"]);
    }
    for (const project of translated.projects) {
      const item = catalogItems("project").find((entry) => entry.match.title === project.title);
      assert.ok(item);
      assert.equal(project.title, item.match.title);
      assert.equal(project.description, item.translations["it-IT"].description);
      assert.equal(project.repositoryUrl, "https://github.com/example/project");
      assert.equal(project.demoUrl, null);
      assert.deepEqual(project.technologies, ["React"]);
    }
  });

  it("translates the Japanese profile, experiences and projects from English content", () => {
    const portfolio = englishPortfolio();
    const translated = applyCatalogTranslations(portfolio, "ja");
    const profile = catalogItems("profile")[0];

    assert.equal(translated.profile.fullName, "Alex Garulli");
    assert.equal(translated.profile.role, profile.translations["ja-JP"].role);
    assert.equal(translated.profile.bio, profile.translations["ja-JP"].bio);
    assert.equal(translated.profile.email, portfolio.profile.email);
    assert.equal(translated.profile.github, portfolio.profile.github);
    assert.equal(
      translated.experiences.every(
        (experience) =>
          experience.role ===
          catalogItems("experience").find((item) => item.match.company === experience.company)?.translations["ja-JP"]
            .role,
      ),
      true,
    );
    assert.equal(
      translated.projects.every(
        (project) =>
          project.description ===
          catalogItems("project").find((item) => item.match.title === project.title)?.translations["ja-JP"]
            .description,
      ),
      true,
    );
    assert.deepEqual(
      translated.projects.map((project) => project.title),
      portfolio.projects.map((project) => project.title),
    );
  });

  it("does not replace drifted prose or ambiguous entries", () => {
    const portfolio = englishPortfolio();
    portfolio.experiences[0] = { ...portfolio.experiences[0], description: "Changed English description" };
    portfolio.projects[1] = { ...portfolio.projects[1], title: "Untitled draft" };
    portfolio.experiences.push({ ...portfolio.experiences[2], displayOrder: 99 });

    const translated = applyCatalogTranslations(portfolio, "it");
    assert.equal(translated.experiences[0].description, "Changed English description");
    assert.equal(translated.experiences[0].role, catalogItems("experience")[0].translations["it-IT"].role);
    assert.equal(translated.projects[1].title, "Untitled draft");
    assert.equal(translated.projects[1].description, portfolio.projects[1].description);
    assert.equal(translated.experiences[2].role, portfolio.experiences[2].role);
    assert.equal(translated.experiences.at(-1)?.role, portfolio.experiences[2].role);
  });
});
