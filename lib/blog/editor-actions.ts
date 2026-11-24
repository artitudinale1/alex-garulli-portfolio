"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getPublishedPosts } from "@/lib/blog/posts";
import { isBlogSlug } from "@/lib/blog/schema";
import { parseEditorInput, type EditorPost } from "@/lib/blog/editor";
import {
  EditorApiError,
  createEditorPost,
  publishEditorPost,
  readEditorPost,
  unpublishEditorPost,
  updateEditorPost,
} from "@/lib/blog/editor-api";

export type EditorActionResult =
  | { ok: true; notice: string; post: EditorPost }
  | { ok: false; message: string; post?: EditorPost };

function failure(error: unknown): EditorActionResult {
  if (error instanceof EditorApiError) return { ok: false, message: error.message };
  return { ok: false, message: "The editor could not complete that request." };
}

async function refreshPublicBlog(slugs: string[]): Promise<void> {
  updateTag("blog-posts");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  for (const slug of new Set(slugs)) {
    if (isBlogSlug(slug)) revalidatePath(`/blog/${slug}`);
  }
  try {
    await getPublishedPosts();
  } catch {
    // The write succeeded. The next public request can fill the cache.
  }
}

async function write(input: unknown, intent: "draft" | "publish" | "unpublish"): Promise<EditorActionResult> {
  const parsed = parseEditorInput(input);
  if (!parsed.ok) return parsed;
  try {
    const existing = parsed.id ? await readEditorPost(parsed.id) : null;
    if (parsed.id && !existing) return { ok: false, message: "That article could not be found." };
    if (intent === "unpublish" && !existing) return { ok: false, message: "Save the article before unpublishing it." };

    let post = existing ? await updateEditorPost(existing.id, parsed.draft) : await createEditorPost(parsed.draft);
    const publicSlugs = [existing?.slug ?? "", post.slug];
    let changedPublic = existing?.status === "PUBLISHED";
    let notice = "Draft saved.";
    try {
      if (intent === "publish") {
        post = await publishEditorPost(post.id);
        notice = "Published. It is now on the public blog.";
        changedPublic = true;
      } else if (intent === "unpublish" || (intent === "draft" && existing?.status === "PUBLISHED")) {
        post = await unpublishEditorPost(post.id);
        notice =
          intent === "draft"
            ? "Saved as a draft and removed from the public blog."
            : "Unpublished. It is no longer on the public blog.";
        changedPublic = true;
      }
    } catch (error) {
      if (changedPublic) await refreshPublicBlog(publicSlugs);
      const result = failure(error);
      return { ...result, post };
    }

    if (changedPublic || post.status === "PUBLISHED") await refreshPublicBlog([...publicSlugs, post.slug]);
    return { ok: true, notice, post };
  } catch (error) {
    return failure(error);
  }
}

export async function saveDraft(input: unknown): Promise<EditorActionResult> {
  return write(input, "draft");
}

export async function publishArticle(input: unknown): Promise<EditorActionResult> {
  return write(input, "publish");
}

export async function unpublishArticle(input: unknown): Promise<EditorActionResult> {
  return write(input, "unpublish");
}
