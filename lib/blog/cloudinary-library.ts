import { sanitizeUploadMessage } from "./cloudinary.ts";
import {
  ImageLibraryError,
  blogLibrarySearchBody,
  describeCloudinaryLibrary,
  isLibraryCursor,
  type LibraryPage,
} from "./image-library.ts";

const LIBRARY_LOG = "Blog image library failed";

export function describeLibraryFailure(
  status: number,
  payload: unknown,
  secrets: readonly string[],
): { status: number; reason: "http" | "non-json"; cloudinaryMessage?: string } {
  if (!payload || typeof payload !== "object") return { status, reason: "non-json" };
  const error = (payload as { error?: unknown }).error;
  const message = typeof error === "string" ? error : error && typeof error === "object" && "message" in error ? error.message : undefined;
  const cloudinaryMessage = sanitizeUploadMessage(message, secrets);
  const log: { status: number; reason: "http"; cloudinaryMessage?: string } = { status, reason: "http" };
  if (cloudinaryMessage) log.cloudinaryMessage = cloudinaryMessage;
  return log;
}

export async function listBlogImages(cursor: string | null, env: NodeJS.ProcessEnv = process.env): Promise<LibraryPage> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
  const apiKey = env.CLOUDINARY_API_KEY?.trim() ?? "";
  const apiSecret = env.CLOUDINARY_API_SECRET?.trim() ?? "";
  if (!/^[a-z0-9_-]+$/i.test(cloudName) || !apiKey || !apiSecret) {
    throw new ImageLibraryError("The image library is not configured.", 503);
  }
  if (cursor != null && !isLibraryCursor(cursor)) {
    throw new ImageLibraryError("That page of the library could not be read.", 400);
  }

  const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const secrets = [apiKey, apiSecret, authorization];
  let response: Response;
  try {
    // The search method is documented as GET, but its parameters are a JSON body.
    // Node fetch refuses a GET body, and Cloudinary accepts this same body via POST.
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${authorization}`,
      },
      body: JSON.stringify(blogLibrarySearchBody(cursor)),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error(LIBRARY_LOG, { reason: "network", name: error instanceof Error ? error.name : "Error" });
    throw new ImageLibraryError("The image host did not respond. Try again.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    console.error(LIBRARY_LOG, describeLibraryFailure(response.status, payload, secrets));
    throw new ImageLibraryError("The image library could not be loaded.");
  }

  const page = describeCloudinaryLibrary(payload);
  if ("error" in page) {
    console.error(LIBRARY_LOG, { status: response.status, reason: "invalid" });
    throw new ImageLibraryError("The image library could not be loaded.");
  }
  return page;
}
