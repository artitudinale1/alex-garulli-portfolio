const IMAGE_EXTENSION = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
const CLOUDINARY_IMAGE = /^\/[^/]+\/image\/(upload|fetch|private|authenticated)\//i;
const MAX_URL_LENGTH = 2048;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_UPLOAD_MESSAGE = "Choose a JPEG, PNG, WebP or GIF under 5 MB.";

export type ImageKind = "jpeg" | "png" | "webp" | "gif";

export function detectImageKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.byteLength >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes.byteLength >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.byteLength >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "gif";
  }
  if (
    bytes.byteLength >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export function imageUploadError(bytes: Uint8Array): string | null {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES || !detectImageKind(bytes)) return IMAGE_UPLOAD_MESSAGE;
  return null;
}

export function imageContentType(kind: ImageKind): string {
  if (kind === "jpeg") return "image/jpeg";
  if (kind === "png") return "image/png";
  if (kind === "gif") return "image/gif";
  return "image/webp";
}

export function parseStoredImageUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const cloudinary = url.hostname === "res.cloudinary.com" && CLOUDINARY_IMAGE.test(url.pathname);
  if (!cloudinary && !IMAGE_EXTENSION.test(url.pathname)) return null;
  return trimmed;
}

export function safeHttpsUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function cloudinaryDisplayUrl(value: string, width: number): string {
  const safeWidth = Math.min(2000, Math.max(1, Math.round(width)));
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return value;
  const match = url.pathname.match(/^(\/[^/]+\/image\/upload)\/(.*)$/i);
  if (!match) return value;
  const rest = match[2] ?? "";
  if (/(^|\/)f_auto[,/]/.test(rest)) return value;
  url.pathname = `${match[1]}/f_auto,q_auto,w_${safeWidth}/${rest}`;
  return url.toString();
}

export function cloudinaryCoverLoader({ src, width }: { src: string; width: number }): string {
  return cloudinaryDisplayUrl(src, width);
}
