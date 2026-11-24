import { EditorFrame } from "@/components/blog-editor-frame";

export default function LoadingEditor() {
  return (
    <EditorFrame>
      <p className="eyebrow">Private</p>
      <h1>Blog editor</h1>
      <p role="status">Checking the editor session.</p>
    </EditorFrame>
  );
}
