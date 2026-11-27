import { EditorShell } from "@/components/blog-editor-frame";

export default function LoadingAgent() {
  return (
    <EditorShell>
      <p className="eyebrow">Private</p>
      <h1>Agentic Lab</h1>
      <p role="status">Checking the editor session.</p>
    </EditorShell>
  );
}
