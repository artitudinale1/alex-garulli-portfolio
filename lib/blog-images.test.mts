import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { describeCloudinaryUpload, signCloudinaryParams, unexpectedUploadLog, uploadBlogImage } from "./blog/cloudinary.ts";
import {
  IMAGE_UPLOAD_MESSAGE,
  MAX_IMAGE_BYTES,
  cloudinaryDisplayUrl,
  detectImageKind,
  imageUploadError,
  parseStoredImageUrl,
  safeHttpsUrl,
} from "./blog/images.ts";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);
const gif = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

describe("blog images", () => {
  it("recognises image signatures and rejects other files", () => {
    assert.equal(detectImageKind(png), "png");
    assert.equal(detectImageKind(jpeg), "jpeg");
    assert.equal(detectImageKind(gif), "gif");
    assert.equal(detectImageKind(webp), "webp");
    assert.equal(detectImageKind(Uint8Array.from([0x3c, 0x73, 0x76, 0x67])), null);
    assert.equal(imageUploadError(Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c])), IMAGE_UPLOAD_MESSAGE);
    assert.equal(imageUploadError(png), null);
    assert.equal(imageUploadError(new Uint8Array(MAX_IMAGE_BYTES + 1)), IMAGE_UPLOAD_MESSAGE);
  });

  it("signs Cloudinary parameters without sending the secret as a field", () => {
    const secret = "cloudinary-api-secret-value";
    const signature = signCloudinaryParams({ timestamp: "1700000000", folder: "alex-blog" }, secret);
    const expected = createHash("sha1").update(`folder=alex-blog&timestamp=1700000000${secret}`).digest("hex");
    assert.equal(signature, expected);
    assert.equal(signature.includes(secret), false);
  });

  it("accepts secure image URLs and optimises Cloudinary delivery", () => {
    const original = "https://res.cloudinary.com/demo/image/upload/v1/alex-blog/cat.jpg";
    assert.equal(parseStoredImageUrl(original), original);
    assert.equal(parseStoredImageUrl("http://res.cloudinary.com/demo/image/upload/v1/cat.jpg"), null);
    assert.equal(parseStoredImageUrl("javascript:alert(1)"), null);
    assert.equal(safeHttpsUrl("https://example.com/cat.jpg"), "https://example.com/cat.jpg");
    assert.equal(safeHttpsUrl("data:text/html,hi"), null);
    assert.equal(
      cloudinaryDisplayUrl(original, 800),
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/v1/alex-blog/cat.jpg",
    );
    assert.equal(cloudinaryDisplayUrl("https://example.com/cat.jpg", 800), "https://example.com/cat.jpg");
  });

  it("records a Cloudinary rejection without the API secret or signature", () => {
    const apiKey = "123456789012345";
    const apiSecret = "super-secret-value";
    const signature = "abcdef1234567890abcdef1234567890abcdef12";
    const failure = describeCloudinaryUpload(
      401,
      { error: { message: `Invalid Signature ${signature}. String to sign - 'folder=alex-blog&timestamp=1700000000'.` } },
      [apiKey, apiSecret, signature],
    );
    assert.equal("url" in failure, false);
    if ("url" in failure) return;
    assert.equal(failure.status, 401);
    assert.equal(failure.reason, "http");
    assert.equal(failure.cloudinaryMessage?.includes(apiSecret), false);
    assert.equal(failure.cloudinaryMessage?.includes(signature), false);
    assert.match(failure.cloudinaryMessage ?? "", /Invalid Signature \[redacted\]/);

    const leaked = describeCloudinaryUpload(400, { error: { message: `key ${apiKey} secret ${apiSecret}` } }, [apiKey, apiSecret, signature]);
    assert.equal(JSON.stringify(leaked).includes(apiKey), false);
    assert.equal(JSON.stringify(leaked).includes(apiSecret), false);
  });

  it("distinguishes a missing or non-Cloudinary delivery URL from the public response", () => {
    const accepted = describeCloudinaryUpload(
      200,
      { secure_url: "https://res.cloudinary.com/demo/image/upload/v1/alex-blog/cat.png" },
      [],
    );
    assert.deepEqual(accepted, { url: "https://res.cloudinary.com/demo/image/upload/v1/alex-blog/cat.png" });

    const missing = describeCloudinaryUpload(200, {}, []);
    assert.deepEqual(missing, { status: 200, reason: "missing-secure-url" });

    const rejected = describeCloudinaryUpload(200, { secure_url: "https://images.example.com/cat.png" }, []);
    assert.deepEqual(rejected, { status: 200, reason: "rejected-url", secureUrlHost: "images.example.com" });
    assert.equal(JSON.stringify(rejected).includes("cat.png"), false);
    assert.deepEqual(describeCloudinaryUpload(502, null, []), { status: 502, reason: "non-json" });
  });

  it("logs the upload failure and keeps the public error generic", async () => {
    const env = {
      CLOUDINARY_CLOUD_NAME: "demo",
      CLOUDINARY_API_KEY: "123456789012345",
      CLOUDINARY_API_SECRET: "super-secret-value",
    } as NodeJS.ProcessEnv;
    const logs: unknown[][] = [];
    const originalFetch = globalThis.fetch;
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logs.push(args);
    };
    globalThis.fetch = async () => Response.json({ error: { message: `Invalid Signature ${env.CLOUDINARY_API_SECRET}` } }, { status: 401 });
    try {
      await assert.rejects(() => uploadBlogImage(png, env), /The image could not be uploaded\./);
      assert.equal(logs.length, 1);
      assert.equal(logs[0]?.[0], "Blog image upload failed");
      assert.equal(JSON.stringify(logs).includes("super-secret-value"), false);
      const details = logs[0]?.[1] as { reason?: string; cloudinaryMessage?: string };
      assert.equal(details.reason, "http");
      assert.equal(details.cloudinaryMessage, "Invalid Signature [redacted]");

      logs.length = 0;
      globalThis.fetch = async () => {
        throw new TypeError("connect ECONNREFUSED https://api.cloudinary.com/v1_1/demo/image/upload");
      };
      await assert.rejects(() => uploadBlogImage(png, env), /The image host did not respond/);
      assert.deepEqual(logs[0], ["Blog image upload failed", { reason: "network", name: "TypeError" }]);

      const unexpected = unexpectedUploadLog(new Error(`token ${env.CLOUDINARY_API_SECRET}`), env);
      assert.equal(unexpected.message.includes("super-secret-value"), false);
      assert.equal(unexpected.reason, "unexpected");
    } finally {
      globalThis.fetch = originalFetch;
      console.error = originalError;
    }
  });
});
