import { editorGate } from "@/lib/blog/editor-api";
import { cloudinaryConfigured, ImageUploadError, unexpectedUploadLog, uploadBlogImage } from "@/lib/blog/cloudinary";
import { imageUploadError, MAX_IMAGE_BYTES } from "@/lib/blog/images";

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
