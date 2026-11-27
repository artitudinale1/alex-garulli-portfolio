import Link from "next/link";
import { editorGate } from "@/lib/blog/editor-api";

export function EditorShell({
  children,
  section = "editor",
  administrator = false,
}: {
  children: React.ReactNode;
  section?: "editor" | "agent";
  administrator?: boolean;
}) {
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
            <Link href="/admin/blog" aria-current={administrator && section === "agent" ? undefined : "page"}>
              Editor
            </Link>
            {administrator ? (
              <Link href="/admin/agent" aria-current={section === "agent" ? "page" : undefined}>
                Agentic Lab
              </Link>
            ) : null}
          </nav>
        </div>
      </header>
      <main id="content" className="blog-main">
        {children}
      </main>
    </>
  );
}

export async function EditorFrame({
  children,
  section = "editor",
}: {
  children: React.ReactNode;
  section?: "editor" | "agent";
}) {
  const administrator = (await editorGate()).state === "editor";
  return (
    <EditorShell section={section} administrator={administrator}>
      {children}
    </EditorShell>
  );
}
