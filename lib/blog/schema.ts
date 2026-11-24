export const blogCategories = ["CODE", "JAPANESE", "CATS", "COOKING"] as const;

export type BlogCategory = (typeof blogCategories)[number];

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  category: BlogCategory;
  tags: string[];
  publishedAt: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isBlogSlug(value: string): boolean {
  return slugPattern.test(value);
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function category(value: unknown): BlogCategory | null {
  return blogCategories.find((item) => item === value) ?? null;
}

export function parsePost(value: unknown): BlogPost | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = text(record.id);
  const title = text(record.title);
  const slug = text(record.slug);
  const excerpt = text(record.excerpt);
  const contentMarkdown = text(record.contentMarkdown);
  const postCategory = category(record.category);
  const publishedAt = text(record.publishedAt);
  if (!id || !title || !slug || !excerpt || !contentMarkdown || !postCategory || !publishedAt) return null;
  if (!isBlogSlug(slug) || Number.isNaN(Date.parse(publishedAt))) return null;
  if (!Array.isArray(record.tags) || record.tags.some((tag) => typeof tag !== "string" || tag.trim() === "")) {
    return null;
  }
  return {
    id,
    title,
    slug,
    excerpt,
    contentMarkdown,
    category: postCategory,
    tags: record.tags.map((tag) => tag.trim()),
    publishedAt,
  };
}

export function parsePosts(value: unknown): BlogPost[] {
  if (!Array.isArray(value)) {
    throw new Error("Blog posts payload is not a list.");
  }
  return value.flatMap((item) => {
    const post = parsePost(item);
    return post ? [post] : [];
  });
}

export function categoryLabel(category: BlogCategory): string {
  if (category === "CODE") return "Code";
  if (category === "JAPANESE") return "Japanese";
  if (category === "CATS") return "Cats";
  return "Cooking";
}
