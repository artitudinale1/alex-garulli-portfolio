"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishArticle, saveDraft, unpublishArticle, type EditorActionResult } from "@/lib/blog/editor-actions";
import { parseEditorInput, type EditorPost, type EditorStatus } from "@/lib/blog/editor";
import { renderMarkdown } from "@/lib/blog/markdown";
import { blogCategories, categoryLabel, type BlogCategory } from "@/lib/blog/schema";
import { formatMonthYear } from "@/lib/format";

type FormState = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  contentMarkdown: string;
  category: BlogCategory;
  status: EditorStatus | "NEW";
  publishedAt: string | null;
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
        {pendingLabel ? (
          <p role="status">
            {pendingLabel}. If the API is asleep, this can take about a minute.
          </p>
        ) : null}
        {notice ? <p className="editor-notice" role="status">{notice}</p> : null}
        {error ? <p className="editor-error" role="alert">{error}</p> : null}
        {preview ? (
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(form.contentMarkdown || "Nothing to preview yet.") }} />
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
            <label>
              Content
              <textarea value={form.contentMarkdown} maxLength={100000} rows={16} onChange={(event) => update({ contentMarkdown: event.target.value })} required />
            </label>
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
