import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { describeLibraryFailure, listBlogImages } from "./blog/cloudinary-library.ts";
import { EDITOR_GITHUB_ID } from "./blog/editor-auth.ts";
import {
  ImageLibraryError,
  LIBRARY_ALT_MESSAGE,
  LIBRARY_PAGE_SIZE,
  applyLibrarySelection,
  blogLibrarySearchBody,
  describeCloudinaryLibrary,
  imageAltText,
  imageLibraryDenied,
  parseLibraryCursor,
  parseLibraryPage,
} from "./blog/image-library.ts";

const secret = "super-secret-value";
const apiKey = "123456789012345";
const env = {
  CLOUDINARY_CLOUD_NAME: "demo",
  CLOUDINARY_API_KEY: apiKey,
  CLOUDINARY_API_SECRET: secret,
} as NodeJS.ProcessEnv;
const catUrl = "https://res.cloudinary.com/demo/image/upload/v1/alex-blog/nested/cat.jpg";
const photoUrl = "https://res.cloudinary.com/demo/image/upload/v1/alex-blog/%E7%8C%AB.jpg";

describe("image library authentication", () => {
  it("keeps browsing behind the existing Auth.js editor gate", () => {
    const route = readFileSync(new URL("../app/api/admin/blog/images/route.ts", import.meta.url), "utf8");
    const gate = readFileSync(new URL("./blog/editor-api.ts", import.meta.url), "utf8");
    assert.equal(EDITOR_GITHUB_ID, "4562699");
    assert.match(gate, /await auth\(\)/);
    assert.match(gate, /isEditorGithubId\(id\)/);
    assert.ok(route.indexOf("editorGate") < route.indexOf("listBlogImages"));
    assert.equal(route.includes("CLOUDINARY_API_SECRET"), false);
    assert.equal(route.includes("CLOUDINARY_API_KEY"), false);
    assert.deepEqual(imageLibraryDenied("anonymous"), { status: 401, error: "Sign in to browse images." });
    assert.deepEqual(imageLibraryDenied("unconfigured"), { status: 401, error: "Sign in to browse images." });
    assert.deepEqual(imageLibraryDenied("forbidden"), { status: 403, error: "This GitHub account cannot browse images." });
    assert.equal(imageLibraryDenied("editor"), null);
    assert.deepEqual(parseLibraryCursor(null), { ok: true, cursor: null });
    assert.deepEqual(parseLibraryCursor("page2cursor"), { ok: true, cursor: "page2cursor" });
    assert.deepEqual(parseLibraryCursor("folder=other"), { ok: false });
  });

  it("sends the admin search with server credentials and returns no secrets", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const logs: unknown[][] = [];
    const originalFetch = globalThis.fetch;
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logs.push(args);
    };
    globalThis.fetch = async (input, init) => {
      calls.push({ url: String(input), init: init ?? {} });
      const body = JSON.parse(String(init?.body));
      if (!body.next_cursor) {
        return Response.json({
          resources: [
            {
              public_id: "alex-blog/nested/cat",
              secure_url: catUrl,
              width: 800,
              height: 600,
              filename: "猫",
              folder: "alex-blog/nested",
              resource_type: "image",
              type: "upload",
              etag: secret,
              tags: ["hidden"],
            },
            { public_id: "other/nope", secure_url: "https://res.cloudinary.com/demo/image/upload/v1/other/nope.jpg", width: 10, height: 10 },
          ],
          next_cursor: "page2cursor",
        });
      }
      return Response.json({ resources: [] });
    };

    try {
      const page = await listBlogImages(null, env);
      assert.equal(calls.length, 1);
      assert.equal(calls[0]?.url, "https://api.cloudinary.com/v1_1/demo/resources/search");
      assert.equal(calls[0]?.url.includes(secret), false);
      assert.equal(calls[0]?.init.method, "POST");
      assert.equal(calls[0]?.init.redirect, "error");
      const authorization = Buffer.from(`${apiKey}:${secret}`).toString("base64");
      assert.equal(new Headers(calls[0]?.init.headers).get("authorization"), `Basic ${authorization}`);
      assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), blogLibrarySearchBody(null));
      assert.equal(JSON.stringify(calls[0]?.init.body).includes(secret), false);
      assert.deepEqual(page, {
        images: [{ publicId: "alex-blog/nested/cat", url: catUrl, width: 800, height: 600, filename: "猫" }],
        nextCursor: "page2cursor",
      });
      assert.equal(JSON.stringify(page).includes(secret), false);
      assert.equal(JSON.stringify(page).includes("hidden"), false);

      const next = await listBlogImages(page.nextCursor, env);
      assert.equal(calls.length, 2);
      assert.deepEqual(JSON.parse(String(calls[1]?.init.body)), blogLibrarySearchBody("page2cursor"));
      assert.deepEqual(next, { images: [], nextCursor: null });

      calls.length = 0;
      globalThis.fetch = async () => Response.json({ error: { message: `Invalid key ${apiKey} secret ${secret}` } }, { status: 401 });
      await assert.rejects(() => listBlogImages(null, env), (error: unknown) => {
        assert.ok(error instanceof ImageLibraryError);
        assert.equal(error.message, "The image library could not be loaded.");
        assert.equal(error.message.includes(secret), false);
        return true;
      });
      assert.equal(JSON.stringify(logs).includes(secret), false);
      assert.equal(JSON.stringify(logs).includes(apiKey), false);
    } finally {
      globalThis.fetch = originalFetch;
      console.error = originalError;
    }
  });
});

describe("image library pagination", () => {
  it("requests one fixed page of the blog folder, including nested public ids", () => {
    assert.equal(LIBRARY_PAGE_SIZE, 24);
    const first = blogLibrarySearchBody(null);
    assert.deepEqual(first, {
      expression: "resource_type:image AND type:upload AND public_id:alex-blog/*",
      sort_by: [{ created_at: "desc" }],
      max_results: 24,
    });
    assert.equal(blogLibrarySearchBody("page2cursor").next_cursor, "page2cursor");
    assert.equal(blogLibrarySearchBody("page2cursor").expression, first.expression);
  });

  it("keeps blog images, drops everything else, and stops when the cursor is absent", () => {
    const page = describeCloudinaryLibrary({
      resources: [
        { public_id: "alex-blog/nested/cat", secure_url: catUrl, width: 800, height: 600, filename: "猫", folder: "alex-blog/nested" },
        { public_id: "alex-blog/猫", secure_url: photoUrl, width: 40, height: 50, folder: "alex-blog" },
        { public_id: "alex-blog/plain", secure_url: "https://res.cloudinary.com/demo/image/upload/v1/alex-blog/plain.jpg", folder: "alex-blog" },
        { public_id: "alex-blog-other/cat", secure_url: "https://res.cloudinary.com/demo/image/upload/v1/alex-blog-other/cat.jpg", width: 10, height: 10 },
        { public_id: "alex-blog/../secret", secure_url: catUrl, width: 10, height: 10 },
        { public_id: "alex-blog/video", secure_url: catUrl, width: 10, height: 10, resource_type: "video" },
        { public_id: "alex-blog/elsewhere", secure_url: "https://res.cloudinary.com/demo/image/upload/v1/other/cat.jpg", width: 10, height: 10 },
        { public_id: "alex-blog/wrong-folder", secure_url: catUrl, width: 10, height: 10, folder: "archive" },
      ],
      next_cursor: "not a cursor",
    });
    assert.deepEqual(page, {
      images: [
        { publicId: "alex-blog/nested/cat", url: catUrl, width: 800, height: 600, filename: "猫" },
        { publicId: "alex-blog/猫", url: photoUrl, width: 40, height: 50 },
        { publicId: "alex-blog/plain", url: "https://res.cloudinary.com/demo/image/upload/v1/alex-blog/plain.jpg" },
      ],
      nextCursor: null,
    });
    assert.deepEqual(describeCloudinaryLibrary({ resources: [] }), { images: [], nextCursor: null });
    assert.deepEqual(describeCloudinaryLibrary({}), { error: "invalid" });

    const client = parseLibraryPage({
      images: [
        { publicId: "alex-blog/nested/cat", url: catUrl, width: 800, height: 600, filename: "猫", etag: secret },
        { publicId: "other/nope", url: "https://res.cloudinary.com/demo/image/upload/v1/other/nope.jpg" },
      ],
      nextCursor: "page2cursor",
    });
    assert.deepEqual(client, {
      images: [{ publicId: "alex-blog/nested/cat", url: catUrl, width: 800, height: 600, filename: "猫" }],
      nextCursor: "page2cursor",
    });
  });

  it("does not call Cloudinary for a bad cursor, a missing secret, or a network failure", async () => {
    const calls: string[] = [];
    const logs: unknown[][] = [];
    const originalFetch = globalThis.fetch;
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logs.push(args);
    };
    globalThis.fetch = async (input) => {
      calls.push(String(input));
      throw new TypeError(`connect ECONNREFUSED ${secret}`);
    };
    try {
      await assert.rejects(() => listBlogImages("bad cursor", env), (error: unknown) => {
        assert.ok(error instanceof ImageLibraryError);
        assert.equal(error.status, 400);
        return true;
      });
      await assert.rejects(() => listBlogImages(null, {} as NodeJS.ProcessEnv), (error: unknown) => {
        assert.ok(error instanceof ImageLibraryError);
        assert.equal(error.status, 503);
        return true;
      });
      assert.equal(calls.length, 0);

      await assert.rejects(() => listBlogImages(null, env), /The image host did not respond/);
      assert.deepEqual(logs[0], ["Blog image library failed", { reason: "network", name: "TypeError" }]);
      assert.equal(JSON.stringify(logs).includes(secret), false);

      const failure = describeLibraryFailure(401, { error: { message: `secret ${secret} key ${apiKey}` } }, [apiKey, secret]);
      assert.equal(JSON.stringify(failure).includes(secret), false);
      assert.equal(JSON.stringify(failure).includes(apiKey), false);
      assert.equal(failure.cloudinaryMessage, "secret [redacted] key [redacted]");
    } finally {
      globalThis.fetch = originalFetch;
      console.error = originalError;
    }
  });
});

describe("library selection and Markdown insertion", () => {
  it("selects a cover without disturbing article text", () => {
    const selected = applyLibrarySelection({ target: "cover", image: { url: catUrl }, contentMarkdown: "<ruby>猫<rt>ねこ</rt></ruby>" });
    assert.deepEqual(selected, { ok: true, value: { target: "cover", coverImageUrl: catUrl } });
    assert.equal(applyLibrarySelection({ target: "cover", image: { url: "javascript:alert(1)" } }).ok, false);
    assert.equal(applyLibrarySelection({ target: "cover", image: { url: "https://example.com/cat.jpg" } }).ok, false);
  });

  it("inserts an image at the cursor and preserves Japanese text and furigana", () => {
    assert.equal(imageAltText("  猫（ねこ）  "), "猫（ねこ）");
    assert.equal(imageAltText("a[b]c"), "abc");
    const content = "前文 <ruby>猫<rt>ねこ</rt></ruby> OLD 後文";
    const start = content.indexOf("OLD");
    const selected = applyLibrarySelection({
      target: "inline",
      image: { url: catUrl },
      alt: "  猫（ねこ）  ",
      contentMarkdown: content,
      selectionStart: start,
      selectionEnd: start + "OLD".length,
    });
    assert.deepEqual(selected, {
      ok: true,
      value: {
        target: "inline",
        contentMarkdown: `前文 <ruby>猫<rt>ねこ</rt></ruby> ![猫（ねこ）](${catUrl}) 後文`,
      },
    });

    const ruby = "<ruby>猫<rt>ねこ</rt></ruby>\n本文";
    const appended = applyLibrarySelection({
      target: "inline",
      image: { url: photoUrl },
      alt: "<ruby>図<rt>ず</rt></ruby>",
      contentMarkdown: ruby,
      selectionStart: null,
      selectionEnd: null,
    });
    assert.deepEqual(appended, {
      ok: true,
      value: { target: "inline", contentMarkdown: `${ruby}![<ruby>図<rt>ず</rt></ruby>](${photoUrl})` },
    });
    assert.deepEqual(
      applyLibrarySelection({ target: "inline", image: { url: catUrl }, alt: " [ ] ", contentMarkdown: ruby }),
      { ok: false, message: LIBRARY_ALT_MESSAGE },
    );
  });

  it("wires the picker into cover and article images without exposing Cloudinary credentials", () => {
    const editor = readFileSync(new URL("../components/blog-editor.tsx", import.meta.url), "utf8");
    const picker = readFileSync(new URL("../components/blog-image-picker.tsx", import.meta.url), "utf8");
    assert.equal((editor.match(/<BlogImagePicker/g) ?? []).length, 2);
    assert.match(editor, /applyImage\("cover"/);
    assert.match(editor, /applyImage\("inline"/);
    assert.match(editor, /Replace cover/);
    assert.match(editor, /Remove cover/);
    assert.match(editor, /Upload image/);
    assert.match(picker, /Choose from library/);
    assert.match(picker, /Load more images/);
    assert.match(picker, /Loading images/);
    assert.match(picker, /No images in the library yet/);
    assert.match(picker, /cloudinaryCoverLoader/);
    assert.match(picker, /role="alert"/);
    assert.match(picker, /role="status"/);
    assert.equal(picker.includes("CLOUDINARY"), false);
    assert.equal(picker.includes("api_secret"), false);
  });
});
