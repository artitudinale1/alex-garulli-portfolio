import { editorGate } from "@/lib/blog/editor-api";
import { cloudinaryConfigured, ImageUploadError, unexpectedUploadLog, uploadBlogImage } from "@/lib/blog/cloudinary";
import { listBlogImages } from "@/lib/blog/cloudinary-library";
import { ImageLibraryError, imageLibraryDenied, parseLibraryCursor } from "@/lib/blog/image-library";
import { imageUploadError, MAX_IMAGE_BYTES } from "@/lib/blog/images";

function libraryJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const gate = await editorGate();
  const denied = imageLibraryDenied(gate.state);
  if (denied) return libraryJson({ error: denied.error }, denied.status);

  let cursorValue: string | null = null;
  try {
    cursorValue = new URL(request.url).searchParams.get("cursor");
  } catch {
    return libraryJson({ error: "That page of the library could not be read." }, 400);
  }
  const cursor = parseLibraryCursor(cursorValue);
  if (!cursor.ok) return libraryJson({ error: "That page of the library could not be read." }, 400);
  if (!cloudinaryConfigured()) return libraryJson({ error: "The image library is not configured." }, 503);

  try {
    const page = await listBlogImages(cursor.cursor);
    return libraryJson(page);
  } catch (error) {
    if (!(error instanceof ImageLibraryError)) console.error("Blog image library failed", unexpectedUploadLog(error));
    const message = error instanceof ImageLibraryError ? error.message : "The image library could not be loaded.";
    const status = error instanceof ImageLibraryError ? error.status : 502;
    return libraryJson({ error: message }, status);
  }
}

export async function POST(request: Request) {
  const gate = await editorGate();
  if (gate.state === "forbidden") {
    return Response.json({ error: "This GitHub account cannot upload images." }, { status: 403 });
  }
  if (gate.state !== "editor") {
    return Response.json({ error: "Sign in to upload images." }, { status: 401 });
  }
  if (!cloudinaryConfigured()) {
    return Response.json({ error: "Image upload is not configured." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "The image could not be read." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Choose a JPEG, PNG, WebP or GIF under 5 MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = imageUploadError(bytes);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  try {
    const url = await uploadBlogImage(bytes);
    return Response.json({ url });
  } catch (error) {
    if (!(error instanceof ImageUploadError)) console.error("Blog image upload failed", unexpectedUploadLog(error));
    const message = error instanceof ImageUploadError ? error.message : "The image could not be uploaded.";
    return Response.json({ error: message }, { status: 502 });
  }
}
