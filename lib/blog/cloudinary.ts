import { createHash } from "node:crypto";
import { detectImageKind, imageContentType, parseStoredImageUrl } from "./images.ts";

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadError";
  }
}

export function cloudinaryConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME?.trim() && env.CLOUDINARY_API_KEY?.trim() && env.CLOUDINARY_API_SECRET?.trim());
}

export function signCloudinaryParams(params: Record<string, string>, apiSecret: string): string {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

export async function uploadBlogImage(bytes: Uint8Array, env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
  const apiKey = env.CLOUDINARY_API_KEY?.trim() ?? "";
  const apiSecret = env.CLOUDINARY_API_SECRET?.trim() ?? "";
  if (!/^[a-z0-9_-]+$/i.test(cloudName) || !apiKey || !apiSecret) {
    throw new ImageUploadError("Image upload is not configured.");
  }
  const kind = detectImageKind(bytes);
  if (!kind) throw new ImageUploadError("Choose a JPEG, PNG, WebP or GIF under 5 MB.");

  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { folder: "alex-blog", timestamp };
  const body = new FormData();
  body.append("file", new Blob([Buffer.from(bytes)], { type: imageContentType(kind) }), "image");
  body.append("api_key", apiKey);
  body.append("timestamp", timestamp);
  body.append("signature", signCloudinaryParams(params, apiSecret));
  body.append("folder", "alex-blog");

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new ImageUploadError("The image host did not respond. Try again.");
  }

  const payload = (await response.json().catch(() => null)) as { secure_url?: unknown } | null;
  const url = typeof payload?.secure_url === "string" ? parseStoredImageUrl(payload.secure_url) : null;
  if (!response.ok || !url || !url.startsWith("https://res.cloudinary.com/")) {
    throw new ImageUploadError("The image could not be uploaded.");
  }
  return url;
}
