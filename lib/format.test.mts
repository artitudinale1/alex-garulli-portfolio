import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDateRange, paragraphs, safeEmail } from "./format.ts";

describe("portfolio formatting", () => {
  it("formats an open role as present", () => {
    assert.equal(formatDateRange("2023-07-01T00:00:00.000Z", null), "Jul 2023 – Present");
  });

  it("splits the profile bio into paragraphs", () => {
    assert.deepEqual(paragraphs("First paragraph.\n\nSecond paragraph."), [
      "First paragraph.",
      "Second paragraph.",
    ]);
  });

  it("formats Italian and Japanese dates without changing the English range", () => {
    assert.equal(formatDateRange("2023-07-01T00:00:00.000Z", null, "Presente", "it-IT"), "lug 2023 – Presente");
    assert.equal(formatDateRange("2023-07-01T00:00:00.000Z", "2024-01-01T00:00:00.000Z", "現在", "ja-JP"), "2023年7月 – 2024年1月");
  });

  it("accepts a plain email address", () => {
    assert.equal(safeEmail("alex.garulli@gmail.com"), "alex.garulli@gmail.com");
    assert.equal(safeEmail("not an email"), null);
  });
});
