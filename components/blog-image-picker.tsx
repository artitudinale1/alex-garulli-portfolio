"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { cloudinaryCoverLoader } from "@/lib/blog/images";
import { parseLibraryPage, type LibraryImage } from "@/lib/blog/image-library";

type BlogImagePickerProps = {
  accessibleName: string;
  title: string;
  disabled: boolean;
  onBeforeOpen?: () => boolean;
  onSelect: (image: LibraryImage) => void;
};

export function BlogImagePicker({ accessibleName, title, disabled, onBeforeOpen, onSelect }: BlogImagePickerProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const requestRef = useRef(0);
  const loadingRef = useRef(false);
  const loadedRef = useRef(false);
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    if (onBeforeOpen && !onBeforeOpen()) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    if (!loadedRef.current && !loadingRef.current) void fetchPage(null, true);
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function fetchPage(cursor: string | null, replace: boolean) {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      const response = await fetch(`/api/admin/blog/images${query}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => null);
      if (requestRef.current !== requestId) return;
      if (!response.ok) {
        setError(messageFrom(payload));
        return;
      }
      const page = parseLibraryPage(payload);
      if (!page) {
        setError("The image library could not be loaded.");
        return;
      }
      setImages((current) => dedupeImages(replace ? page.images : [...current, ...page.images]));
      setNextCursor(page.nextCursor);
      loadedRef.current = true;
      setLoaded(true);
    } catch {
      if (requestRef.current !== requestId) return;
      setError("The image library could not be loaded.");
    } finally {
      if (requestRef.current === requestId) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="editor-file-button"
        aria-haspopup="dialog"
        aria-label={accessibleName}
        disabled={disabled}
        onClick={openDialog}
      >
        Choose from library
      </button>
      <dialog
        ref={dialogRef}
        className="editor-library"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={loading}
        onClose={() => triggerRef.current?.focus()}
      >
        <div className="editor-library-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="editor-file-button" onClick={closeDialog}>
            Close
          </button>
        </div>
        <p className="editor-hint">Recently uploaded images can take a few seconds to appear.</p>
        {loading && images.length === 0 ? <p role="status">Loading images.</p> : null}
        {error ? (
          <p className="editor-error" role="alert">
            {error}
          </p>
        ) : null}
        {loaded && !loading && images.length === 0 && !error ? (
          <p role="status">{nextCursor ? "No matching images on this page." : "No images in the library yet."}</p>
        ) : null}
        {images.length > 0 ? (
          <ul className="editor-library-grid" aria-label="Images in the blog library">
            {images.map((image) => {
              const label = image.filename || image.publicId.split("/").pop() || image.publicId;
              return (
                <li key={image.publicId}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onSelect(image);
                      closeDialog();
                    }}
                  >
                    <span className="editor-library-thumb">
                      <Image loader={cloudinaryCoverLoader} src={image.url} alt="" fill sizes="160px" />
                    </span>
                    <span className="editor-library-name">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {error || nextCursor ? (
          <div className="editor-library-actions">
            {error ? (
              <button
                type="button"
                className="editor-file-button"
                disabled={loading}
                onClick={() => void fetchPage(images.length > 0 ? nextCursor : null, images.length === 0)}
              >
                Try again
              </button>
            ) : (
              <button type="button" className="editor-file-button" disabled={loading} onClick={() => void fetchPage(nextCursor, false)}>
                {loading ? "Loading images" : "Load more images"}
              </button>
            )}
          </div>
        ) : null}
      </dialog>
    </>
  );
}

function dedupeImages(images: LibraryImage[]): LibraryImage[] {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (seen.has(image.publicId)) return false;
    seen.add(image.publicId);
    return true;
  });
}

function messageFrom(payload: unknown): string {
  if (!payload || typeof payload !== "object" || !("error" in payload) || typeof payload.error !== "string") {
    return "The image library could not be loaded.";
  }
  const message = payload.error.replace(/\s+/g, " ").trim();
  if (!message || message.length > 200) return "The image library could not be loaded.";
  return message;
}
