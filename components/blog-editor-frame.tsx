import Link from "next/link";

export function EditorFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="wordmark" href="/">
            Alex Garulli
          </Link>
          <nav aria-label="Editor">
            <Link href="/">Portfolio</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/admin/blog" aria-current="page">
              Editor
            </Link>
          </nav>
        </div>
      </header>
      <main id="content" className="blog-main">
        {children}
      </main>
    </>
  );
}
