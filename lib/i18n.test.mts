import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localizedFields, translationCatalog, type ContentTypeId } from "./i18n/catalog.ts";
import { isUnknownLocaleError, portfolioRequest, PORTFOLIO_QUERY } from "./contentful/query.ts";
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
