import { createHmac } from "node:crypto";

export const EDITOR_GITHUB_ID = "4562699";
export const EDITOR_TOKEN_TTL_SECONDS = 300;
const MIN_SECRET_LENGTH = 32;

export function githubIdFromProfile(profileId: unknown, providerAccountId: unknown): string | null {
  for (const candidate of [profileId, providerAccountId]) {
    if (typeof candidate === "number" && Number.isSafeInteger(candidate) && candidate > 0) return String(candidate);
    if (typeof candidate === "string" && /^[0-9]+$/.test(candidate)) return candidate;
  }
  return null;
}

export function isEditorGithubId(id: string): boolean {
  return id === EDITOR_GITHUB_ID;
}

export function editorSecretsConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const authSecret = env.AUTH_SECRET?.trim() ?? "";
  const githubId = env.AUTH_GITHUB_ID?.trim() ?? "";
  const githubSecret = env.AUTH_GITHUB_SECRET?.trim() ?? "";
  const editorSecret = env.EDITOR_AUTH_SECRET?.trim() ?? "";
  return (
    authSecret.length >= MIN_SECRET_LENGTH &&
    githubId.length > 0 &&
    githubSecret.length > 0 &&
    editorSecret.length >= MIN_SECRET_LENGTH
  );
}

export function signEditorToken(secret: string, githubUserId: string, now = Date.now()): string {
  if (secret.trim().length < MIN_SECRET_LENGTH) throw new Error("Editor authentication is not configured.");
  if (!/^[0-9]+$/.test(githubUserId)) throw new Error("GitHub user id must be numeric.");
  const iat = Math.floor(now / 1000);
  const exp = iat + EDITOR_TOKEN_TTL_SECONDS;
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: githubUserId, iat, exp })).toString("base64url");
  const data = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}
