import { EditorShell } from "@/components/blog-editor-frame";

export default function LoadingEditor() {
  return (
    <EditorShell>
      <p className="eyebrow">Private</p>
      <h1>Blog editor</h1>
      <p role="status">Checking the editor session.</p>
    </EditorShell>
  );
}
