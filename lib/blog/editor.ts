import { parseStoredImageUrl } from "./images.ts";
import { blogCategories, isBlogSlug, type BlogCategory } from "./schema.ts";

export type EditorStatus = "DRAFT" | "PUBLISHED";

export type EditorPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  category: BlogCategory;
  tags: string[];
  status: EditorStatus;
  publishedAt: string | null;
  coverImageUrl: string | null;
};

export type PostDraft = {
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  category: BlogCategory;
  coverImageUrl: string | null;
};

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export function isEditorPostId(value: string): boolean {
  return OBJECT_ID.test(value);
}

function text(value: unknown, label: string, max: number): string | { message: string } {
  if (typeof value !== "string") return { message: `${label} is required.` };
  const trimmed = value.trim();
  if (!trimmed) return { message: `${label} is required.` };
  if (trimmed.length > max) return { message: `${label} is too long.` };
  return trimmed;
}

export function validateDraft(input: Record<string, unknown>): { ok: true; value: PostDraft } | { ok: false; message: string } {
  const title = text(input.title, "Title", 160);
  if (typeof title !== "string") return { ok: false, message: title.message };
  const slug = text(input.slug, "Slug", 80);
  if (typeof slug !== "string") return { ok: false, message: slug.message };
  if (!isBlogSlug(slug)) return { ok: false, message: "Slug must be lowercase words separated by hyphens." };
  const excerpt = text(input.excerpt, "Excerpt", 300);
  if (typeof excerpt !== "string") return { ok: false, message: excerpt.message };
  const contentMarkdown = text(input.contentMarkdown, "Content", 100_000);
  if (typeof contentMarkdown !== "string") return { ok: false, message: contentMarkdown.message };
  const category = blogCategories.find((item) => item === input.category);
  if (!category) return { ok: false, message: "Category is invalid." };
  let coverImageUrl: string | null = null;
  if (input.coverImageUrl != null && input.coverImageUrl !== "") {
    if (typeof input.coverImageUrl !== "string") return { ok: false, message: "Cover image must be an https image URL." };
    const cover = parseStoredImageUrl(input.coverImageUrl);
    if (!cover) return { ok: false, message: "Cover image must be an https image URL." };
    coverImageUrl = cover;
  }
  return { ok: true, value: { title, slug, excerpt, contentMarkdown, category, coverImageUrl } };
}

export function parseEditorInput(
  value: unknown,
): { ok: true; id: string | null; draft: PostDraft } | { ok: false; message: string } {
  if (!value || typeof value !== "object") return { ok: false, message: "The article could not be read." };
  const record = value as Record<string, unknown>;
  let id: string | null = null;
  if (record.id != null && record.id !== "") {
    if (typeof record.id !== "string" || !isEditorPostId(record.id)) {
      return { ok: false, message: "That article could not be found." };
    }
    id = record.id;
  }
  const draft = validateDraft(record);
  if (!draft.ok) return draft;
  return { ok: true, id, draft: draft.value };
}

export function toPostInput(draft: PostDraft): PostDraft {
  return {
    title: draft.title,
    slug: draft.slug,
    excerpt: draft.excerpt,
    contentMarkdown: draft.contentMarkdown,
    category: draft.category,
    coverImageUrl: draft.coverImageUrl,
  };
}

export function parseEditorPost(value: unknown): EditorPost | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : "";
  if (!isEditorPostId(id)) return null;
  const coverImageUrl = typeof record.coverImageUrl === "string" ? parseStoredImageUrl(record.coverImageUrl) : null;
  const draft = validateDraft({ ...record, coverImageUrl });
  if (!draft.ok) return null;
  if (record.status !== "DRAFT" && record.status !== "PUBLISHED") return null;
  if (record.publishedAt !== null && (typeof record.publishedAt !== "string" || Number.isNaN(Date.parse(record.publishedAt)))) {
    return null;
  }
  if (!Array.isArray(record.tags) || record.tags.some((tag) => typeof tag !== "string" || tag.trim() === "")) return null;
  return {
    ...draft.value,
    id,
    tags: record.tags.map((tag) => tag.trim()),
    status: record.status,
    publishedAt: record.publishedAt,
  };
}

export function parseEditorPosts(value: unknown): EditorPost[] {
  if (!Array.isArray(value)) throw new Error("Editor posts payload is not a list.");
  return value.flatMap((item) => {
    const post = parseEditorPost(item);
    return post ? [post] : [];
  });
}
