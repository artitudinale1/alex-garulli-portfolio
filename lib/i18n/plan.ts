import {
  localizedFields,
  translationCatalog,
  type CatalogItem,
  type ContentTypeId,
  type TargetLocale,
} from "./catalog.ts";

export const sourceLocale = "en-US";

export const targetLocales: ReadonlyArray<{ code: TargetLocale; name: string }> = [
  { code: "it-IT", name: "Italian (Italy)" },
  { code: "ja-JP", name: "Japanese (Japan)" },
];

export type LocaleSnapshot = {
  code: string;
  fallbackCode: string | null;
  optional: boolean;
};

export type ContentTypeSnapshot = {
  id: ContentTypeId;
  version: number;
  currentLocalized: Record<string, boolean>;
  publishedLocalized: Record<string, boolean>;
};

export type EntrySnapshot = {
  id: string;
  contentType: ContentTypeId;
  version: number;
  pendingChanges: boolean;
  values: Record<string, Record<string, string>>;
};

export type TranslationSnapshot = {
  locales: LocaleSnapshot[];
  contentTypes: ContentTypeSnapshot[];
  entries: EntrySnapshot[];
};

export type LocaleCreate = { code: TargetLocale; name: string; fallbackCode: string; optional: true };

export type ContentTypeUpdate = { id: ContentTypeId; version: number; fields: string[] };

export type EntryWrite = {
  id: string;
  contentType: ContentTypeId;
  version: number;
  locale: TargetLocale;
  field: string;
  value: string;
};

export type TranslationPlan = {
  blocked: boolean;
  reasons: string[];
  notices: string[];
  localeCreates: LocaleCreate[];
  contentTypeUpdates: ContentTypeUpdate[];
  entryWrites: EntryWrite[];
  skipped: string[];
};

function sameKeys(left: Record<string, boolean>, right: Record<string, boolean>): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.join("|") === rightKeys.join("|") && leftKeys.every((key) => left[key] === right[key]);
}

function dateKey(value: string): string {
  return /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? value;
}

function matches(item: CatalogItem, entry: EntrySnapshot): boolean {
  return Object.entries(item.match).every(([field, expected]) => {
    const actual = entry.values[field]?.[sourceLocale];
    if (typeof actual !== "string") return false;
    return field.toLowerCase().includes("date") ? dateKey(actual) === dateKey(expected) : actual === expected;
  });
}

function fieldList(contentType: ContentTypeId): readonly string[] {
  return localizedFields[contentType];
}

export function planTranslations(
  snapshot: TranslationSnapshot,
  catalog: CatalogItem[] = translationCatalog,
): TranslationPlan {
  const reasons: string[] = [];
  const notices: string[] = [
    "English field values are left unchanged.",
    "Content types and entries are not published.",
  ];
  const localeCreates: LocaleCreate[] = [];
  const contentTypeUpdates: ContentTypeUpdate[] = [];
  const entryWrites: EntryWrite[] = [];
  const skipped: string[] = [];

  for (const target of targetLocales) {
    const existing = snapshot.locales.find((locale) => locale.code === target.code);
    if (!existing) {
      localeCreates.push({
        code: target.code,
        name: target.name,
        fallbackCode: sourceLocale,
        optional: true,
      });
      continue;
    }
    if (existing.fallbackCode !== sourceLocale || !existing.optional) {
      notices.push(
        `${target.code} already exists with fallback ${existing.fallbackCode ?? "none"} and optional ${existing.optional}. Its settings will not be changed.`,
      );
    }
  }

  for (const contentType of (Object.keys(localizedFields) as ContentTypeId[])) {
    const model = snapshot.contentTypes.find((item) => item.id === contentType);
    if (!model) {
      reasons.push(`Content type ${contentType} was not found.`);
      continue;
    }
    if (!sameKeys(model.currentLocalized, model.publishedLocalized)) {
      reasons.push(`Content type ${contentType} has unpublished field changes. It will not be modified.`);
      continue;
    }
    const missing = fieldList(contentType).filter((field) => !(field in model.currentLocalized));
    if (missing.length > 0) {
      reasons.push(`Content type ${contentType} is missing ${missing.join(", ")}.`);
      continue;
    }
    const enable = fieldList(contentType).filter((field) => !model.currentLocalized[field]);
    if (enable.length > 0) {
      contentTypeUpdates.push({ id: contentType, version: model.version, fields: enable });
    }
    const publishedGap = fieldList(contentType).filter((field) => !model.publishedLocalized[field]);
    if (enable.length === 0 && publishedGap.length > 0) {
      notices.push(
        `${contentType} localization is only in the draft content type. The Delivery API will not serve it until that draft is published.`,
      );
    }
  }

  for (const item of catalog) {
    const matchesFound = snapshot.entries.filter(
      (entry) => entry.contentType === item.contentType && matches(item, entry),
    );
    const label = `${item.contentType} ${Object.values(item.match).join(" / ")}`;
    if (matchesFound.length !== 1) {
      reasons.push(`${label} matched ${matchesFound.length} entries. No translation will be written.`);
      continue;
    }
    const entry = matchesFound[0];
    if (entry.pendingChanges) {
      reasons.push(`${label} (${entry.id}) has unpublished changes. No translation will be written.`);
      continue;
    }
    let sourceMatches = true;
    for (const field of fieldList(item.contentType)) {
      const actual = entry.values[field]?.[sourceLocale];
      if (actual !== item.source[field]) {
        sourceMatches = false;
        reasons.push(`${label} field ${field} no longer matches the English source. It will not be overwritten.`);
      }
    }
    if (!sourceMatches) continue;

    for (const target of targetLocales) {
      for (const field of fieldList(item.contentType)) {
        const next = item.translations[target.code][field];
        const current = entry.values[field]?.[target.code];
        if (current === next) {
          skipped.push(`${entry.id} ${field} ${target.code}`);
          continue;
        }
        if (typeof current === "string" && current !== next) {
          reasons.push(
            `${label} (${entry.id}) already has a different ${target.code} value for ${field}. It will not be overwritten.`,
          );
          continue;
        }
        entryWrites.push({
          id: entry.id,
          contentType: item.contentType,
          version: entry.version,
          locale: target.code,
          field,
          value: next,
        });
      }
    }
  }

  return {
    blocked: reasons.length > 0,
    reasons,
    notices,
    localeCreates,
    contentTypeUpdates,
    entryWrites,
    skipped,
  };
}

export function formatTranslationPlan(plan: TranslationPlan): string {
  const lines = [
    plan.blocked ? "Translation plan is blocked. Apply will not write." : "Translation plan is ready.",
    ...plan.notices.map((notice) => `Notice: ${notice}`),
    ...plan.reasons.map((reason) => `Blocked: ${reason}`),
    `Locales to create: ${plan.localeCreates.map((locale) => locale.code).join(", ") || "none"}`,
    ...plan.contentTypeUpdates.map(
      (update) => `Localize ${update.id} v${update.version}: ${update.fields.join(", ")}`,
    ),
    `Entry fields to write: ${plan.entryWrites.length}`,
    ...plan.entryWrites.map(
      (write) => `${write.contentType} ${write.id} ${write.field} [${write.locale}] ${write.value}`,
    ),
    `Already present: ${plan.skipped.length}`,
  ];
  return lines.join("\n");
}
