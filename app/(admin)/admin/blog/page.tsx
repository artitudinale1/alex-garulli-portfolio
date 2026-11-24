import { connection } from "next/server";
import { Suspense } from "react";
import { signIn, signOut } from "@/auth";
import { BlogEditor } from "@/components/blog-editor";
import { EditorFrame } from "@/components/blog-editor-frame";
import { EditorApiError, editorGate, listEditorPosts } from "@/lib/blog/editor-api";

async function signInWithGitHub() {
  "use server";
  await signIn("github", { redirectTo: "/admin/blog" });
}

async function signOutOfEditor() {
  "use server";
  await signOut({ redirectTo: "/admin/blog" });
}

function SignIn({ failed }: { failed: boolean }) {
  return (
    <EditorFrame>
      <p className="eyebrow">Private</p>
      <h1>Blog editor</h1>
      <p>Sign in with GitHub to edit drafts and published articles.</p>
      {failed ? (
        <p className="editor-error" role="alert">
          GitHub sign-in did not complete. Try again.
        </p>
      ) : null}
      <form className="editor-sign-in" action={signInWithGitHub}>
        <button type="submit">Sign in with GitHub</button>
      </form>
    </EditorFrame>
  );
}

function Forbidden() {
  return (
    <EditorFrame>
      <p className="eyebrow">Private</p>
      <h1>Blog editor</h1>
      <p className="editor-error" role="alert">
        This GitHub account cannot edit the blog.
      </p>
      <form className="editor-sign-in" action={signOutOfEditor}>
        <button type="submit">Sign out</button>
      </form>
    </EditorFrame>
  );
}

function Unconfigured() {
  return (
    <EditorFrame>
      <p className="eyebrow">Private</p>
      <h1>Blog editor</h1>
      <p role="alert">
        The editor is not configured. Add <code>AUTH_SECRET</code>, <code>AUTH_GITHUB_ID</code>, <code>AUTH_GITHUB_SECRET</code>, and <code>EDITOR_AUTH_SECRET</code> on the server.
      </p>
    </EditorFrame>
  );
}

async function EditorArticles() {
  let posts = null;
  let error: string | null = null;
  try {
    posts = await listEditorPosts();
  } catch (cause) {
    error = cause instanceof EditorApiError ? cause.message : "The articles could not be loaded.";
  }
  if (!posts) return <BlogEditor posts={[]} initialError={error} />;
  return <BlogEditor posts={posts} initialError={error} />;
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const gate = await editorGate();
  if (gate.state === "unconfigured") return <Unconfigured />;
  if (gate.state === "forbidden") return <Forbidden />;
  if (gate.state === "anonymous") return <SignIn failed={Boolean(params.error)} />;
  return (
    <EditorFrame>
      <Suspense fallback={<p role="status">Loading articles. The API can take about a minute to wake.</p>}>
        <EditorArticles />
      </Suspense>
    </EditorFrame>
  );
}
