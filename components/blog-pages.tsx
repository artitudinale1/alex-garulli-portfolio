import Link from "next/link";
import { CoverImage } from "@/components/blog-cover";
import { categoryLabel, type BlogPost } from "@/lib/blog/schema";
import { renderMarkdown } from "@/lib/blog/markdown";
import { formatMonthYear } from "@/lib/format";

function BlogHeader({ current }: { current: boolean }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="wordmark" href="/">
          Alex Garulli
        </Link>
        <nav aria-label="Site">
          <Link href="/">Portfolio</Link>
          <Link href="/blog" aria-current={current ? "page" : undefined}>
            Blog
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function BlogUnavailable() {
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <BlogHeader current />
      <main id="content" className="blog-main">
        <p className="eyebrow">Blog</p>
        <h1>Posts are temporarily unavailable</h1>
        <p>The published articles could not be loaded. Please try again shortly.</p>
        <p>
          <Link href="/">Back to the portfolio</Link>
        </p>
      </main>
    </>
  );
}

export function BlogIndex({ posts }: { posts: BlogPost[] }) {
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <BlogHeader current />
      <main id="content" className="blog-main">
        <p className="eyebrow">Alex Garulli</p>
        <h1>Blog</h1>
        <p className="lead">Notes on engineering, Japanese and other work.</p>
        {posts.length === 0 ? <p>No published posts yet.</p> : null}
        <div className="project-grid">
          {posts.map((post) => (
            <article className="project blog-card" key={post.id}>
              <CoverImage url={post.coverImageUrl} alt={post.title} sizes="(min-width: 768px) 32rem, calc(100vw - 2.5rem)" />
              <p className="eyebrow">
                {categoryLabel(post.category)} · {formatMonthYear(post.publishedAt)}
              </p>
              <h2>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{post.excerpt}</p>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export function BlogArticle({ post }: { post: BlogPost }) {
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <BlogHeader current={false} />
      <main id="content" className="blog-main">
        <article className="blog-article">
          <p className="eyebrow">
            {categoryLabel(post.category)} · {formatMonthYear(post.publishedAt)}
          </p>
          <h1>{post.title}</h1>
          <p className="lead">{post.excerpt}</p>
          <CoverImage url={post.coverImageUrl} alt={post.title} sizes="(min-width: 768px) 46rem, calc(100vw - 2.5rem)" />
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.contentMarkdown) }} />
          {post.tags.length > 0 ? (
            <ul className="technologies">
              {post.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}
          <p className="blog-return">
            <Link href="/blog">All posts</Link>
            <Link href="/">Back to the portfolio</Link>
          </p>
        </article>
      </main>
    </>
  );
}
