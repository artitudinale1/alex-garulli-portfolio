"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishArticle, saveDraft, unpublishArticle, type EditorActionResult } from "@/lib/blog/editor-actions";
import { parseEditorInput, type EditorPost, type EditorStatus } from "@/lib/blog/editor";
import { renderMarkdown } from "@/lib/blog/markdown";
import { blogCategories, categoryLabel, type BlogCategory } from "@/lib/blog/schema";
import { formatMonthYear } from "@/lib/format";
import { CoverImage } from "@/components/blog-cover";
import { BlogImagePicker } from "@/components/blog-image-picker";
import { LIBRARY_ALT_MESSAGE, applyLibrarySelection, imageAltText } from "@/lib/blog/image-library";

type FormState = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  category: BlogCategory;
  status: EditorStatus | "NEW";
  publishedAt: string | null;
  coverImageUrl: string | null;
};

const emptyForm: FormState = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  contentMarkdown: "",
  category: "CODE",
  status: "NEW",
  publishedAt: null,
  coverImageUrl: null,
};

function fromPost(post: EditorPost): FormState {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    contentMarkdown: post.contentMarkdown,
    category: post.category,
    status: post.status,
    publishedAt: post.publishedAt,
    coverImageUrl: post.coverImageUrl,
  };
}

export function BlogEditor({ posts, initialError }: { posts: EditorPost[]; initialError: string | null }) {
  const router = useRouter();
  const [items, setItems] = useState(posts);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [pending, startTransition] = useTransition();
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"cover" | "inline" | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function applyPost(post: EditorPost) {
    setForm(fromPost(post));
    setItems((current) => {
      const index = current.findIndex((item) => item.id === post.id);
      if (index === -1) return [post, ...current];
      const next = current.slice();
      next[index] = post;
      return next;
    });
  }

  function select(post: EditorPost) {
    setForm(fromPost(post));
    setPreview(false);
    setNotice(null);
    setError(null);
  }

  function update(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
    setNotice(null);
  }

  async function uploadFile(file: File): Promise<string | null> {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/blog/images", { method: "POST", body });
    const payload = (await response.json().catch(() => null)) as { url?: unknown; error?: unknown } | null;
    if (!response.ok || typeof payload?.url !== "string" || !payload.url.startsWith("https://")) {
      setError(typeof payload?.error === "string" ? payload.error : "The image could not be uploaded.");
      return null;
    }
    return payload.url;
  }

  function applyImage(target: "cover" | "inline", url: string) {
    const area = contentRef.current;
    const selected = applyLibrarySelection({
      target,
      image: { url },
      alt: imageAlt,
      contentMarkdown: form.contentMarkdown,
      selectionStart: area?.selectionStart,
      selectionEnd: area?.selectionEnd,
    });
    if (!selected.ok) {
      setError(selected.message);
      return;
    }
    setError(null);
    if (selected.value.target === "cover") {
      update({ coverImageUrl: selected.value.coverImageUrl });
      return;
    }
    update({ contentMarkdown: selected.value.contentMarkdown });
    setImageAlt("");
  }

  async function onCoverSelected(file: File | null) {
    if (!file) return;
    setError(null);
    setNotice(null);
    setUploading("cover");
    try {
      const url = await uploadFile(file);
      if (url) applyImage("cover", url);
    } catch {
      setError("The image could not be uploaded.");
    } finally {
      setUploading(null);
    }
  }

  async function onInlineSelected(file: File | null) {
    if (!file) return;
    if (!imageAltText(imageAlt)) {
      setError("Add a short description before uploading an image into the article.");
      return;
    }
    setError(null);
    setNotice(null);
    setUploading("inline");
    try {
      const url = await uploadFile(file);
      if (url) applyImage("inline", url);
    } catch {
      setError("The image could not be uploaded.");
    } finally {
      setUploading(null);
    }
  }

  function run(action: "draft" | "publish" | "unpublish") {
    const parsed = parseEditorInput(form);
    if (!parsed.ok) {
      setError(parsed.message);
      setNotice(null);
      return;
    }
    const operation = action === "draft" ? saveDraft : action === "publish" ? publishArticle : unpublishArticle;
    setPendingLabel(action === "draft" ? "Saving draft" : action === "publish" ? "Publishing" : "Unpublishing");
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result: EditorActionResult = await operation(form);
      setPendingLabel(null);
      if (!result.ok) {
        setError(result.message);
        if (result.post) applyPost(result.post);
        return;
      }
      applyPost(result.post);
      setNotice(result.notice);
      router.refresh();
    });
  }

  const statusLabel = form.status === "PUBLISHED" ? "Published" : form.status === "DRAFT" ? "Draft" : "New article";

  return (
    <div className="editor-workspace">
      <section className="editor-list" aria-label="Articles">
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setPreview(false);
            setNotice(null);
            setError(null);
          }}
        >
          New article
        </button>
        {items.length === 0 ? <p>No articles yet.</p> : null}
        <ul>
          {items.map((post) => (
            <li key={post.id}>
              <button type="button" onClick={() => select(post)} aria-current={form.id === post.id ? "true" : undefined}>
                <span className="eyebrow">{post.status === "PUBLISHED" ? "Published" : "Draft"}</span>
                {post.title}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <form
        className="editor-form"
        onSubmit={(event) => {
          event.preventDefault();
          run("draft");
        }}
      >
        <p className="eyebrow">
          {statusLabel}
          {form.publishedAt ? ` · ${formatMonthYear(form.publishedAt)}` : ""}
        </p>
        <h1>{form.title.trim() || "Blog editor"}</h1>
        {uploading ? <p role="status">Uploading image. This stays on the server.</p> : null}
        {pendingLabel ? (
          <p role="status">
            {pendingLabel}. If the API is asleep, this can take about a minute.
          </p>
        ) : null}
        {notice ? <p className="editor-notice" role="status">{notice}</p> : null}
        {error ? <p className="editor-error" role="alert">{error}</p> : null}
        {preview ? (
          <>
            <CoverImage url={form.coverImageUrl} alt={form.title.trim() || "Cover preview"} sizes="(min-width: 768px) 42rem, 100vw" />
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(form.contentMarkdown || "Nothing to preview yet.") }} />
          </>
        ) : (
          <>
            <label>
              Title
              <input value={form.title} maxLength={160} onChange={(event) => update({ title: event.target.value })} required />
            </label>
            <label>
              Slug
              <input value={form.slug} maxLength={80} onChange={(event) => update({ slug: event.target.value })} required spellCheck={false} />
            </label>
            <label>
              Category
              <select value={form.category} onChange={(event) => update({ category: event.target.value as BlogCategory })}>
                {blogCategories.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Excerpt
              <textarea value={form.excerpt} maxLength={300} rows={3} onChange={(event) => update({ excerpt: event.target.value })} required />
            </label>
            <fieldset className="editor-cover-field">
              <legend>Cover image</legend>
              <CoverImage url={form.coverImageUrl} alt={form.title.trim() || "Cover preview"} sizes="16rem" />
              <div className="editor-upload">
                <label className="editor-file-button">
                  {uploading === "cover" ? "Uploading cover" : form.coverImageUrl ? "Replace cover" : "Upload cover"}
                  <input
                    className="editor-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={pending || uploading !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = "";
                      void onCoverSelected(file);
                    }}
                  />
                </label>
                <BlogImagePicker
                  title="Choose a cover image"
                  accessibleName="Choose from library for the cover"
                  disabled={pending || uploading !== null}
                  onSelect={(image) => applyImage("cover", image.url)}
                />
                {form.coverImageUrl ? (
                  <button type="button" data-secondary disabled={pending || uploading !== null} onClick={() => update({ coverImageUrl: null })}>
                    Remove cover
                  </button>
                ) : null}
              </div>
            </fieldset>
            <label>
              Content
              <textarea
                ref={contentRef}
                value={form.contentMarkdown}
                maxLength={100000}
                rows={16}
                onChange={(event) => update({ contentMarkdown: event.target.value })}
                required
              />
            </label>
            <div className="editor-upload">
              <label>
                Image description
                <input value={imageAlt} maxLength={120} onChange={(event) => setImageAlt(event.target.value)} />
              </label>
              <label className="editor-file-button">
                {uploading === "inline" ? "Uploading image" : "Upload image"}
                <input
                  className="editor-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={pending || uploading !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    void onInlineSelected(file);
                  }}
                />
              </label>
              <BlogImagePicker
                title="Choose an article image"
                accessibleName="Choose from library for the article"
                disabled={pending || uploading !== null}
                onBeforeOpen={() => {
                  if (imageAltText(imageAlt)) {
                    setError(null);
                    return true;
                  }
                  setError(LIBRARY_ALT_MESSAGE);
                  setNotice(null);
                  return false;
                }}
                onSelect={(image) => applyImage("inline", image.url)}
              />
            </div>
            <p className="editor-hint">
              Furigana stays in the Markdown, for example <code>{"<ruby>猫<rt>ねこ</rt></ruby>"}</code>.
            </p>
          </>
        )}
        <div className="editor-actions">
          <button type="submit" disabled={pending}>
            Save draft
          </button>
          <button type="button" data-secondary disabled={pending} onClick={() => setPreview((current) => !current)}>
            {preview ? "Edit" : "Preview"}
          </button>
          <button type="button" disabled={pending} onClick={() => run("publish")}>
            Publish
          </button>
          {form.status === "PUBLISHED" ? (
            <button type="button" data-secondary disabled={pending} onClick={() => run("unpublish")}>
              Unpublish
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
