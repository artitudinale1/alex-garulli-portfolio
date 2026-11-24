import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { signCloudinaryParams } from "./blog/cloudinary.ts";
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
});
