import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  EDITOR_GITHUB_ID,
  editorSecretsConfigured,
  githubIdFromProfile,
  isEditorGithubId,
  signEditorToken,
} from "./blog/editor-auth.ts";
import { parseEditorInput, parseEditorPost, parseEditorPosts, toPostInput } from "./blog/editor.ts";

const secret = "test-editor-secret-test-editor-secret";
const draft = {
  id: "6742c0a1b2c3d4e5f6071829",
  title: "日本語: cats and katakana",
  slug: "japanese-cats-and-katakana",
  excerpt: "抜粋",
  contentMarkdown: "<ruby>猫<rt>ねこ</rt></ruby>",
  category: "JAPANESE",
  tags: ["Japanese"],
  status: "DRAFT",
  publishedAt: null,
};

describe("editor authentication", () => {
  it("signs a five-minute HS256 token for the numeric GitHub id", () => {
    const now = Date.UTC(2026, 10, 24, 12, 0, 0);
    const token = signEditorToken(secret, EDITOR_GITHUB_ID, now);
    const [headerPart, payloadPart, signature] = token.split(".");
    assert.deepEqual(JSON.parse(Buffer.from(headerPart, "base64url").toString()), { alg: "HS256", typ: "JWT" });
    const claims = JSON.parse(Buffer.from(payloadPart, "base64url").toString()) as { sub: string; iat: number; exp: number };
    assert.deepEqual(Object.keys(claims), ["sub", "iat", "exp"]);
    assert.equal(claims.sub, "4562699");
    assert.equal(claims.exp - claims.iat, 300);
    const expected = createHmac("sha256", secret).update(`${headerPart}.${payloadPart}`).digest("base64url");
    assert.equal(signature, expected);
  });

  it("uses the numeric profile id and ignores a login or email", () => {
    assert.equal(githubIdFromProfile(4562699, "artitudinale1"), "4562699");
    assert.equal(githubIdFromProfile(undefined, "4562699"), "4562699");
    assert.equal(githubIdFromProfile("artitudinale1", "user@example.com"), null);
    assert.equal(isEditorGithubId("4562699"), true);
    assert.equal(isEditorGithubId("4562698"), false);
    assert.throws(() => signEditorToken(secret, "artitudinale1"));
  });

  it("requires the server secrets without treating them as interchangeable", () => {
    const env = {
      AUTH_SECRET: secret,
      AUTH_GITHUB_ID: "client",
      AUTH_GITHUB_SECRET: "client-secret",
      EDITOR_AUTH_SECRET: secret,
    } as NodeJS.ProcessEnv;
    assert.equal(editorSecretsConfigured(env), true);
    assert.equal(editorSecretsConfigured({ ...env, EDITOR_AUTH_SECRET: "too-short" }), false);
    assert.equal(editorSecretsConfigured({ ...env, AUTH_SECRET: "" }), false);
  });
});

describe("editor articles", () => {
  it("keeps Japanese text and ruby and drops client-supplied identity", () => {
    const parsed = parseEditorInput({
      ...draft,
      id: "",
      githubId: "1",
      login: "artitudinale1",
      email: "person@example.com",
      tags: ["injected"],
      status: "PUBLISHED",
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.id, null);
    assert.equal(parsed.draft.title, "日本語: cats and katakana");
    assert.equal(parsed.draft.contentMarkdown, "<ruby>猫<rt>ねこ</rt></ruby>");
    assert.equal("tags" in parsed.draft, false);
    assert.deepEqual(toPostInput(parsed.draft), parsed.draft);
  });

  it("rejects an unsafe slug and accepts a draft with no publication date", () => {
    assert.equal(parseEditorInput({ ...draft, slug: "../admin" }).ok, false);
    const post = parseEditorPost(draft);
    assert.equal(post?.status, "DRAFT");
    assert.equal(post?.publishedAt, null);
    assert.equal(parseEditorPost({ ...draft, id: "<script>" }), null);
    assert.throws(() => parseEditorPosts({ posts: [draft] }));
    assert.equal(parseEditorPosts([draft, { ...draft, slug: "Bad Slug" }]).length, 1);
  });
});
