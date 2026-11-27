import { blogCategories, type BlogCategory } from "../blog/schema.ts";

export const MAX_AGENT_BYTES = 4 * 1024 * 1024;
export const MAX_AGENT_IMAGES = 5;

const LENGTHS = ["short", "medium", "long"] as const;
const TARGETS = ["mock", "live"] as const;

export type AgentLength = (typeof LENGTHS)[number];
export type AgentTarget = (typeof TARGETS)[number];

export type AgentImageInput = {
  filename: string;
  bytes: Uint8Array;
  description?: string;
};

export type AgentRequestInput =
  | {
      mode: "existing";
      instructions: string;
      body: string;
      context?: string;
      category?: BlogCategory;
    }
  | {
      mode: "generate";
      prompt: string;
      length: AgentLength;
      context?: string;
      category?: BlogCategory;
    };

export type AgentSubmission = {
  architecture: "function-calling";
  target: AgentTarget;
  request: AgentRequestInput;
  cover?: AgentImageInput;
  images: AgentImageInput[];
};

export type AgentTextFields = {
  mode: string;
  instructions: string;
  body: string;
  prompt: string;
  length: string;
  context: string;
  category: string;
  target: string;
  architecture: string;
};

export type AgentFileFields = {
  cover: AgentImageInput | null;
  images: AgentImageInput[];
};

export function assessAgentSubmission(
  text: AgentTextFields,
  files: AgentFileFields,
): { ok: true; value: AgentSubmission } | { ok: false; error: string } {
  if (text.architecture === "code-mode") {
    return { ok: false, error: "Code Mode is not available yet." };
  }
  if (text.architecture !== "" && text.architecture !== "function-calling") {
    return { ok: false, error: "Choose Traditional Function Calling." };
  }

  const target = text.target === "" ? "mock" : text.target;
  if (!isTarget(target)) return { ok: false, error: "Choose a mock or live target." };

  const category = text.category.trim();
  if (category && !isCategory(category)) return { ok: false, error: "Choose a blog category." };
  const context = text.context.trim();
  const shared = {
    ...(context ? { context } : {}),
    ...(category && isCategory(category) ? { category } : {}),
  };

  let request: AgentRequestInput;
  if (text.mode === "existing") {
    const instructions = text.instructions.trim();
    const body = text.body.trim();
    if (!instructions) return { ok: false, error: "Add publishing instructions for the existing article." };
    if (!body) return { ok: false, error: "Add the article Markdown." };
    request = { mode: "existing", instructions, body, ...shared };
  } else if (text.mode === "generate") {
    const prompt = text.prompt.trim();
    const length = text.length === "" ? "medium" : text.length;
    if (!prompt) return { ok: false, error: "Add an editorial prompt." };
    if (!isLength(length)) return { ok: false, error: "Choose a short, medium, or long article." };
    request = { mode: "generate", prompt, length, ...shared };
  } else {
    return { ok: false, error: "Choose an existing article or a generated article." };
  }

  if (files.images.length > MAX_AGENT_IMAGES) {
    return { ok: false, error: "Choose at most five inline images." };
  }

  const images: AgentImageInput[] = [];
  for (const [index, image] of files.images.entries()) {
    const checked = checkImage(image, `Inline image ${index + 1}`);
    if (!checked.ok) return checked;
    if (request.mode === "generate" && !image.description?.trim()) {
      return { ok: false, error: `Add a description for inline image ${index + 1}.` };
    }
    const description = image.description?.trim();
    images.push({ filename: checked.filename, bytes: image.bytes, ...(description ? { description } : {}) });
  }

  let cover: AgentImageInput | undefined;
  if (files.cover) {
    const checked = checkImage(files.cover, "Cover image");
    if (!checked.ok) return checked;
    cover = { filename: checked.filename, bytes: files.cover.bytes };
  }

  const total = textBytes(text) + (cover?.bytes.byteLength ?? 0) + images.reduce((sum, image) => sum + image.bytes.byteLength, 0);
  if (total > MAX_AGENT_BYTES) {
    return { ok: false, error: "The article and images together must be 4 MB or smaller." };
  }

  return {
    ok: true,
    value: {
      architecture: "function-calling",
      target,
      request,
      images,
      ...(cover ? { cover } : {}),
    },
  };
}

export async function submissionFromForm(form: FormData): Promise<{ ok: true; value: AgentSubmission } | { ok: false; error: string }> {
  const images: AgentImageInput[] = [];
  for (let index = 0; index < MAX_AGENT_IMAGES + 1; index += 1) {
    const file = form.get(`image-${index}`);
    if (!(file instanceof File) || file.size === 0) continue;
    images.push({
      filename: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
      description: stringField(form.get(`image-description-${index}`)),
    });
  }

  const coverFile = form.get("cover");
  const cover =
    coverFile instanceof File && coverFile.size > 0
      ? { filename: coverFile.name, bytes: new Uint8Array(await coverFile.arrayBuffer()) }
      : null;

  return assessAgentSubmission(
    {
      mode: stringField(form.get("mode")),
      instructions: stringField(form.get("instructions")),
      body: stringField(form.get("body")),
      prompt: stringField(form.get("prompt")),
      length: stringField(form.get("length")),
      context: stringField(form.get("context")),
      category: stringField(form.get("category")),
      target: stringField(form.get("target")),
      architecture: stringField(form.get("architecture")),
    },
    { cover, images },
  );
}

export function contentLengthError(header: string | null): string | null {
  if (!header) return null;
  const length = Number(header);
  if (!Number.isFinite(length) || length < 0) return "The request could not be read.";
  if (length > MAX_AGENT_BYTES) return "The article and images together must be 4 MB or smaller.";
  return null;
}

function checkImage(
  image: AgentImageInput,
  label: string,
): { ok: true; filename: string } | { ok: false; error: string } {
  if (image.bytes.byteLength === 0) return { ok: false, error: `${label} is empty.` };
  const filename = safeFilename(image.filename);
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const detected = detectImage(image.bytes);
  if (detected === "image/jpeg" && (extension === ".jpg" || extension === ".jpeg")) return { ok: true, filename };
  if (detected === "image/png" && extension === ".png") return { ok: true, filename };
  if (detected === "image/webp" && extension === ".webp") return { ok: true, filename };
  return { ok: false, error: `${label} must be a JPEG, PNG, or WebP file.` };
}

function detectImage(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  return null;
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end));
}

function safeFilename(value: string): string {
  const base = value.split(/[/\\]/).pop()?.trim() || "image";
  return base.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

function textBytes(text: AgentTextFields): number {
  return new TextEncoder().encode(Object.values(text).join("\n")).byteLength;
}

function stringField(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function isCategory(value: string): value is BlogCategory {
  return (blogCategories as readonly string[]).includes(value);
}

function isLength(value: string): value is AgentLength {
  return (LENGTHS as readonly string[]).includes(value);
}

function isTarget(value: string): value is AgentTarget {
  return (TARGETS as readonly string[]).includes(value);
}
