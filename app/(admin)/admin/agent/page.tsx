import { connection } from "next/server";
import { signIn, signOut } from "@/auth";
import { AgentLab } from "@/components/agent-lab";
import { EditorFrame } from "@/components/blog-editor-frame";
import { editorGate } from "@/lib/blog/editor-api";

async function signInWithGitHub() {
  "use server";
  await signIn("github", { redirectTo: "/admin/agent" });
}

async function signOutOfLab() {
  "use server";
  await signOut({ redirectTo: "/admin/agent" });
}

function SignIn({ failed }: { failed: boolean }) {
  return (
    <EditorFrame>
      <p className="eyebrow">Private</p>
      <h1>Agentic Lab</h1>
      <p>Sign in with GitHub to prepare a draft with the publishing agent.</p>
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
      <h1>Agentic Lab</h1>
      <p className="editor-error" role="alert">
        This GitHub account cannot use the agent.
      </p>
      <form className="editor-sign-in" action={signOutOfLab}>
        <button type="submit">Sign out</button>
      </form>
    </EditorFrame>
  );
}

function Unconfigured() {
  return (
    <EditorFrame>
      <p className="eyebrow">Private</p>
      <h1>Agentic Lab</h1>
      <p role="alert">
        The editor is not configured. Add <code>AUTH_SECRET</code>, <code>AUTH_GITHUB_ID</code>, <code>AUTH_GITHUB_SECRET</code>, and <code>EDITOR_AUTH_SECRET</code> on the server.
      </p>
    </EditorFrame>
  );
}

export default async function AdminAgentPage({
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
    <EditorFrame section="agent">
      <AgentLab />
    </EditorFrame>
  );
}
