import { parseStoredImageUrl } from "./images.ts";

export const BLOG_LIBRARY_FOLDER = "alex-blog";
export const LIBRARY_PAGE_SIZE = 24;
export const LIBRARY_ALT_MESSAGE = "Add a short description before inserting an image into the article.";

const LIBRARY_CURSOR = /^[A-Za-z0-9_-]{1,512}$/;
const LIBRARY_SEARCH = `resource_type:image AND type:upload AND public_id:${BLOG_LIBRARY_FOLDER}/*`;

export type EditorAccess = "unconfigured" | "anonymous" | "forbidden" | "editor";

export type LibraryImage = {
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  filename?: string;
};

export type LibraryPage = {
  images: LibraryImage[];
  nextCursor: string | null;
};

export type LibrarySearchBody = {
  expression: string;
  sort_by: { created_at: "desc" }[];
  max_results: number;
  next_cursor?: string;
};

export class ImageLibraryError extends Error {
  readonly status: 400 | 502 | 503;

  constructor(message: string, status: 400 | 502 | 503 = 502) {
    super(message);
    this.name = "ImageLibraryError";
    this.status = status;
  }
}

export function imageLibraryDenied(state: EditorAccess): { status: 401 | 403; error: string } | null {
  if (state === "forbidden") return { status: 403, error: "This GitHub account cannot browse images." };
  if (state === "editor") return null;
  return { status: 401, error: "Sign in to browse images." };
}

export function isLibraryCursor(value: string): boolean {
  return LIBRARY_CURSOR.test(value);
}

export function parseLibraryCursor(value: string | null): { ok: true; cursor: string | null } | { ok: false } {
  if (value == null || value === "") return { ok: true, cursor: null };
  if (!isLibraryCursor(value)) return { ok: false };
  return { ok: true, cursor: value };
}

export function blogLibrarySearchBody(cursor: string | null): LibrarySearchBody {
  const body: LibrarySearchBody = {
    expression: LIBRARY_SEARCH,
    sort_by: [{ created_at: "desc" }],
    max_results: LIBRARY_PAGE_SIZE,
  };
  if (cursor) body.next_cursor = cursor;
  return body;
}

export function imageAltText(value: string): string {
  return value.replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim();
}

export function applyLibrarySelection(input: {
  target: "cover" | "inline";
  image: { url: string };
  alt?: string;
  contentMarkdown?: string;
  selectionStart?: number | null;
  selectionEnd?: number | null;
}):
  | { ok: true; value: { target: "cover"; coverImageUrl: string } | { target: "inline"; contentMarkdown: string } }
  | { ok: false; message: string } {
  const url = parseStoredImageUrl(input.image.url);
  if (!url || !urlInBlogFolder(url)) return { ok: false, message: "That image cannot be used." };
  if (input.target === "cover") return { ok: true, value: { target: "cover", coverImageUrl: url } };

  const alt = imageAltText(input.alt ?? "");
  if (!alt) return { ok: false, message: LIBRARY_ALT_MESSAGE };
  const content = input.contentMarkdown ?? "";
  const start = clampIndex(input.selectionStart, content.length, content.length);
  const end = clampIndex(input.selectionEnd, content.length, start);
  const markdown = `![${alt}](${url})`;
  return {
    ok: true,
    value: {
      target: "inline",
      contentMarkdown: `${content.slice(0, start)}${markdown}${content.slice(Math.max(start, end))}`,
    },
  };
}

export function describeCloudinaryLibrary(payload: unknown): LibraryPage | { error: "invalid" } {
  if (!payload || typeof payload !== "object") return { error: "invalid" };
  const record = payload as { resources?: unknown; next_cursor?: unknown };
  if (!Array.isArray(record.resources) || record.resources.length > 500) return { error: "invalid" };

  const images: LibraryImage[] = [];
  for (const resource of record.resources) {
    const image = libraryImageFromCloudinary(resource);
    if (image) images.push(image);
  }

  const nextCursor =
    typeof record.next_cursor === "string" && record.next_cursor && isLibraryCursor(record.next_cursor)
      ? record.next_cursor
      : null;
  return { images, nextCursor };
}

export function parseLibraryPage(payload: unknown): LibraryPage | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { images?: unknown; nextCursor?: unknown };
  if (!Array.isArray(record.images)) return null;
  const images: LibraryImage[] = [];
  for (const item of record.images) {
    const image = libraryImageFromClient(item);
    if (image) images.push(image);
  }
  const nextCursor = typeof record.nextCursor === "string" && isLibraryCursor(record.nextCursor) ? record.nextCursor : null;
  return { images, nextCursor };
}

export function isBlogPublicId(publicId: string): boolean {
  if (!publicId.startsWith(`${BLOG_LIBRARY_FOLDER}/`) || publicId.length > 400) return false;
  const parts = publicId.split("/");
  return parts.every((part, index) => {
    if (part === "" || part === "." || part === "..") return false;
    if (index === 0) return part === BLOG_LIBRARY_FOLDER;
    return !/[\u0000-\u001f\u007f]/.test(part);
  });
}

function libraryImageFromCloudinary(value: unknown): LibraryImage | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.resource_type != null && record.resource_type !== "image") return null;
  if (record.type != null && record.type !== "upload") return null;
  if (typeof record.public_id !== "string" || !isBlogPublicId(record.public_id)) return null;
  if (record.folder != null && record.folder !== "" && (typeof record.folder !== "string" || !isBlogFolder(record.folder))) return null;
  if (typeof record.secure_url !== "string") return null;
  const url = parseStoredImageUrl(record.secure_url);
  if (!url || !urlInBlogFolder(url)) return null;
  return cleanImage(record.public_id, url, record.width, record.height, record.filename);
}

function libraryImageFromClient(value: unknown): LibraryImage | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.publicId !== "string" || !isBlogPublicId(record.publicId)) return null;
  if (typeof record.url !== "string") return null;
  const url = parseStoredImageUrl(record.url);
  if (!url || url !== record.url || !urlInBlogFolder(url)) return null;
  return cleanImage(record.publicId, url, record.width, record.height, record.filename);
}

function cleanImage(publicId: string, url: string, width: unknown, height: unknown, filename: unknown): LibraryImage | null {
  const parsedWidth = optionalDimension(width);
  const parsedHeight = optionalDimension(height);
  if (parsedWidth === null || parsedHeight === null) return null;
  const image: LibraryImage = { publicId, url };
  if (parsedWidth !== undefined) image.width = parsedWidth;
  if (parsedHeight !== undefined) image.height = parsedHeight;
  const parsedFilename = optionalFilename(filename);
  if (parsedFilename) image.filename = parsedFilename;
  return image;
}

function optionalDimension(value: unknown): number | undefined | null {
  if (value == null || value === "") return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0 || value > 20000) return null;
  return value;
}

function optionalFilename(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") return undefined;
  const filename = value.replace(/\s+/g, " ").trim();
  if (!filename || filename.length > 180 || /[\u0000-\u001f\u007f]/.test(filename)) return undefined;
  return filename;
}

function isBlogFolder(folder: string): boolean {
  return folder === BLOG_LIBRARY_FOLDER || folder.startsWith(`${BLOG_LIBRARY_FOLDER}/`);
}

function urlInBlogFolder(url: string): boolean {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    return path.includes(`/${BLOG_LIBRARY_FOLDER}/`);
  } catch {
    return false;
  }
}

function clampIndex(value: number | null | undefined, length: number, fallback: number): number {
  if (value == null || !Number.isFinite(value)) return fallback;
  return Math.min(length, Math.max(0, Math.trunc(value)));
}
