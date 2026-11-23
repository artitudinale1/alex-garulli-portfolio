import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "contentful-management";
import type { EntryProps } from "contentful-management";
import { localizedFields, type ContentTypeId } from "../lib/i18n/catalog.ts";
import {
  formatTranslationPlan,
  planTranslations,
  sourceLocale,
  type ContentTypeSnapshot,
  type EntrySnapshot,
  type EntryWrite,
  type LocaleSnapshot,
  type TranslationPlan,
  type TranslationSnapshot,
} from "../lib/i18n/plan.ts";

const contentTypes = Object.keys(localizedFields) as ContentTypeId[];

function redact(text: string): string {
  return text.replace(/CFPAT-[A-Za-z0-9_-]+/g, "[redacted]").replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}

function fail(message: string): never {
  console.error(redact(message));
  process.exit(1);
}

function parseMode(args: string[]): "dry-run" | "apply" {
  const unknown = args.filter((arg) => arg !== "--dry-run" && arg !== "--apply");
  if (unknown.length > 0) fail(`Unknown argument: ${unknown.join(", ")}. Use --dry-run or --apply.`);
  if (args.includes("--dry-run") && args.includes("--apply")) {
    fail("Pass only one of --dry-run or --apply.");
  }
  return args.includes("--apply") ? "apply" : "dry-run";
}

function loadConfig() {
  const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  const values = new Map<string, string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const separator = line.indexOf("=");
    values.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }
  const accessToken = values.get("CONTENTFUL_MANAGEMENT_TOKEN");
  const spaceId = values.get("CONTENTFUL_SPACE_ID");
  const environmentId = values.get("CONTENTFUL_ENVIRONMENT");
  if (!accessToken || !spaceId || !environmentId) {
    fail("Missing CONTENTFUL_MANAGEMENT_TOKEN, CONTENTFUL_SPACE_ID or CONTENTFUL_ENVIRONMENT.");
  }
  return { accessToken, spaceId, environmentId };
}

function stringLocales(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function pendingChanges(version: number, publishedVersion: number | undefined): boolean {
  return typeof publishedVersion !== "number" || version > publishedVersion + 1;
}

async function readSnapshot(
  client: ReturnType<typeof createClient>,
  config: { accessToken: string; spaceId: string; environmentId: string },
): Promise<TranslationSnapshot> {
  const scope = { spaceId: config.spaceId, environmentId: config.environmentId };
  const locales = await client.locale.getMany({ ...scope, query: { limit: 100 } });
  const localeSnapshots: LocaleSnapshot[] = locales.items.map((locale) => ({
    code: locale.code,
    fallbackCode: locale.fallbackCode ?? null,
    optional: locale.optional,
  }));

  const contentTypeSnapshots: ContentTypeSnapshot[] = [];
  for (const id of contentTypes) {
    const current = await client.contentType.get({ ...scope, contentTypeId: id });
    const publishedResponse = await fetch(
      `https://api.contentful.com/spaces/${config.spaceId}/environments/${config.environmentId}/content_types/${id}/published`,
      { headers: { Authorization: `Bearer ${config.accessToken}` } },
    );
    if (!publishedResponse.ok) fail(`Could not read the published ${id} content type.`);
    const published = (await publishedResponse.json()) as { fields?: Array<{ id: string; localized?: boolean }> };
    const flags = (fields: Array<{ id: string; localized?: boolean }> | undefined) =>
      Object.fromEntries((fields ?? []).map((field) => [field.id, Boolean(field.localized)]));
    contentTypeSnapshots.push({
      id,
      version: current.sys.version,
      currentLocalized: flags(current.fields),
      publishedLocalized: flags(published.fields),
    });
  }

  const entries: EntrySnapshot[] = [];
  let skip = 0;
  for (;;) {
    const page = await client.entry.getMany({ ...scope, query: { limit: 100, skip } });
    for (const entry of page.items) {
      const contentType = entry.sys.contentType.sys.id;
      if (!contentTypes.includes(contentType as ContentTypeId)) continue;
      const values: Record<string, Record<string, string>> = {};
      for (const [field, value] of Object.entries(entry.fields)) values[field] = stringLocales(value);
      entries.push({
        id: entry.sys.id,
        contentType: contentType as ContentTypeId,
        version: entry.sys.version,
        pendingChanges: pendingChanges(entry.sys.version, entry.sys.publishedVersion),
        values,
      });
    }
    skip += page.items.length;
    if (page.items.length === 0 || skip >= page.total) break;
  }

  return { locales: localeSnapshots, contentTypes: contentTypeSnapshots, entries };
}

function samePlan(left: TranslationPlan, right: TranslationPlan): boolean {
  return JSON.stringify({
    blocked: left.blocked,
    reasons: left.reasons,
    creates: left.localeCreates,
    types: left.contentTypeUpdates,
    writes: left.entryWrites,
  }) === JSON.stringify({
    blocked: right.blocked,
    reasons: right.reasons,
    creates: right.localeCreates,
    types: right.contentTypeUpdates,
    writes: right.entryWrites,
  });
}

async function applyPlan(
  client: ReturnType<typeof createClient>,
  config: { spaceId: string; environmentId: string },
  plan: TranslationPlan,
) {
  const scope = { spaceId: config.spaceId, environmentId: config.environmentId };
  for (const locale of plan.localeCreates) {
    await client.locale.create(
      scope,
      {
        name: locale.name,
        code: locale.code,
        fallbackCode: locale.fallbackCode,
        optional: true,
        contentDeliveryApi: true,
        contentManagementApi: true,
      },
    );
    console.log(`Created optional locale ${locale.code}. It was not used to publish entries.`);
  }

  for (const update of plan.contentTypeUpdates) {
    const contentType = await client.contentType.get({ ...scope, contentTypeId: update.id });
    if (contentType.sys.version !== update.version) {
      fail(`Refusing to update ${update.id} because its version changed.`);
    }
    for (const field of contentType.fields) {
      if (update.fields.includes(field.id)) field.localized = true;
    }
    await client.contentType.update({ ...scope, contentTypeId: update.id }, contentType);
    console.log(`Enabled localization on ${update.id} (${update.fields.join(", ")}). The content type was not published.`);
  }

  const writesByEntry = new Map<string, EntryWrite[]>();
  for (const write of plan.entryWrites) {
    writesByEntry.set(write.id, [...(writesByEntry.get(write.id) ?? []), write]);
  }
  for (const [entryId, writes] of writesByEntry) {
    const entry = await client.entry.get({ ...scope, entryId });
    if (entry.sys.version !== writes[0].version) {
      fail(`Refusing to update entry ${entryId} because its version changed.`);
    }
    for (const write of writes) {
      const current = entry.fields[write.field];
      const localized =
        current && typeof current === "object" && !Array.isArray(current)
          ? { ...(current as Record<string, unknown>) }
          : {};
      if (write.locale === sourceLocale) fail("Refusing to write the English locale.");
      localized[write.locale] = write.value;
      entry.fields[write.field] = localized;
    }
    await client.entry.update({ ...scope, entryId }, entry as EntryProps);
    console.log(`Saved unpublished translations on entry ${entryId}.`);
  }
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const config = loadConfig();
  const client = createClient({ accessToken: config.accessToken, application: "alex-portfolio-next/i18n" }, { type: "plain" });
  const snapshot = await readSnapshot(client, config);
  const plan = planTranslations(snapshot);
  console.log(formatTranslationPlan(plan));

  if (mode === "dry-run") {
    console.log("\nDry run complete. No Contentful locales, content types or entries were changed.");
    if (plan.blocked) process.exitCode = 1;
    return;
  }
  if (plan.blocked) fail("\nApply aborted because the translation plan is blocked. No write was performed.");
  if (plan.localeCreates.length === 0 && plan.contentTypeUpdates.length === 0 && plan.entryWrites.length === 0) {
    console.log("\nNothing to write.");
    return;
  }

  const confirmation = planTranslations(await readSnapshot(client, config));
  if (!samePlan(plan, confirmation)) {
    fail("Apply aborted because the Contentful state changed before the write. No write was performed.");
  }
  await applyPlan(client, config, plan);
  console.log("\nApply saved drafts only. Nothing was published.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  fail(message);
});
