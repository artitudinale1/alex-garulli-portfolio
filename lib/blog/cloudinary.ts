import { createHash } from "node:crypto";
import { BLOG_LIBRARY_FOLDER } from "./image-library.ts";
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

export type CloudinaryFailureLog = {
  status: number;
  reason: "http" | "non-json" | "missing-secure-url" | "rejected-url";
  cloudinaryMessage?: string;
  secureUrlHost?: string;
};

const UPLOAD_LOG = "Blog image upload failed";

export function describeCloudinaryUpload(
  status: number,
  payload: unknown,
  secrets: readonly string[],
): { url: string } | CloudinaryFailureLog {
  if (payload === null || typeof payload !== "object") return { status, reason: "non-json" };

  const record = payload as { secure_url?: unknown; error?: unknown };
  const cloudinaryMessage = sanitizeUploadMessage(cloudinaryErrorMessage(record.error), secrets);
  const rawUrl = typeof record.secure_url === "string" ? record.secure_url : "";
  const url = rawUrl ? parseStoredImageUrl(rawUrl) : null;
  if (status >= 200 && status < 300 && url?.startsWith("https://res.cloudinary.com/")) return { url };

  const log: CloudinaryFailureLog = {
    status,
    reason: status < 200 || status >= 300 ? "http" : rawUrl ? "rejected-url" : "missing-secure-url",
  };
  if (cloudinaryMessage) log.cloudinaryMessage = cloudinaryMessage;
  const host = hostnameOf(rawUrl);
  if (host) log.secureUrlHost = host;
  return log;
}

export function unexpectedUploadLog(
  error: unknown,
  env: NodeJS.ProcessEnv = process.env,
): { reason: "unexpected"; name: string; message: string } {
  const secrets = [
    env.CLOUDINARY_API_KEY,
    env.CLOUDINARY_API_SECRET,
    env.EDITOR_AUTH_SECRET,
    env.AUTH_SECRET,
    env.AUTH_GITHUB_SECRET,
  ].filter((value): value is string => typeof value === "string");
  return {
    reason: "unexpected",
    name: error instanceof Error ? error.name : "Unknown",
    message: sanitizeUploadMessage(error instanceof Error ? error.message : "unknown", secrets) ?? "unknown",
  };
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
  const params = { folder: BLOG_LIBRARY_FOLDER, timestamp };
  const signature = signCloudinaryParams(params, apiSecret);
  const body = new FormData();
  body.append("file", new Blob([Buffer.from(bytes)], { type: imageContentType(kind) }), "image");
  body.append("api_key", apiKey);
  body.append("timestamp", timestamp);
  body.append("signature", signature);
  body.append("folder", BLOG_LIBRARY_FOLDER);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    console.error(UPLOAD_LOG, { reason: "network", name: error instanceof Error ? error.name : "Error" });
    throw new ImageUploadError("The image host did not respond. Try again.");
  }

  const payload = await response.json().catch(() => null);
  const result = describeCloudinaryUpload(response.status, payload, [apiKey, apiSecret, signature]);
  if ("url" in result) return result.url;
  console.error(UPLOAD_LOG, result);
  throw new ImageUploadError("The image could not be uploaded.");
}

function cloudinaryErrorMessage(error: unknown): unknown {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) return error.message;
  return undefined;
}

export function sanitizeUploadMessage(value: unknown, secrets: readonly string[]): string | undefined {
  if (typeof value !== "string") return undefined;
  let message = value.replace(/\s+/g, " ").trim();
  if (!message) return undefined;
  for (const secret of secrets) {
    if (secret.length < 8 || !message.includes(secret)) continue;
    message = message.split(secret).join("[redacted]");
  }
  return message.length > 180 ? `${message.slice(0, 179)}…` : message;
}

function hostnameOf(value: string): string | undefined {
  if (!value) return undefined;
  try {
    const host = new URL(value).hostname;
    return host ? host.slice(0, 253) : undefined;
  } catch {
    return undefined;
  }
}
