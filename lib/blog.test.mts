import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderMarkdown } from "./blog/markdown.ts";
import { isBlogSlug, parsePost, parsePosts } from "./blog/schema.ts";

const sample = {
  id: "post-1",
  title: "日本語: cats and katakana",
  slug: "japanese-cats-and-katakana",
  excerpt: "A small Japanese-language test post.",
  contentMarkdown: "# 日本語の勉強\n\n猫（ねこ） means cat.",
  category: "JAPANESE",
  tags: ["Japanese", "Katakana"],
  publishedAt: "2026-11-24T09:41:48.135Z",
};

describe("blog markdown", () => {
  it("renders Japanese text and ruby without executing markup", () => {
    const html = renderMarkdown(
      "# 日本語の勉強\n\n猫（ねこ） means cat.\n\n<ruby>猫<rt>ねこ</rt></ruby>\n\n<script>alert(1)</script>",
    );
    assert.match(html, /<h2>日本語の勉強<\/h2>/);
    assert.match(html, /<ruby>猫<rt>ねこ<\/rt><\/ruby>/);
    assert.equal(html.includes("<script>"), false);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  });

  it("allows http links and drops unsafe urls", () => {
    const html = renderMarkdown(
      "[site](https://www.alexgarulli.org.uk/)\n\n[bad](javascript:alert(1))\n\n[data](data:text/html,hi)",
    );
    assert.match(html, /<a href="https:\/\/www\.alexgarulli\.org\.uk\/" rel="noopener noreferrer">site<\/a>/);
    assert.equal(html.includes("javascript:"), false);
    assert.equal(html.includes("data:text"), false);
    assert.match(html, />bad</);
  });

  it("escapes code blocks", () => {
    const html = renderMarkdown("```\n<img src=x onerror=alert(1)>\n```");
    assert.match(html, /<pre><code>&lt;img src=x onerror=alert\(1\)&gt;<\/code><\/pre>/);
  });
});

describe("blog posts", () => {
  it("accepts a published post and rejects unsafe slugs", () => {
    assert.deepEqual(parsePost(sample)?.title, sample.title);
    assert.equal(isBlogSlug("building-a-graphql-blog-api"), true);
    assert.equal(isBlogSlug("../admin"), false);
    assert.equal(parsePost({ ...sample, slug: "<script>" }), null);
    assert.equal(parsePost({ ...sample, tags: ["ok", 1] }), null);
  });

  it("keeps valid posts when one item is malformed", () => {
    assert.deepEqual(
      parsePosts([sample, { title: "Missing fields" }]).map((post) => post.slug),
      ["japanese-cats-and-katakana"],
    );
    assert.throws(() => parsePosts({ posts: [] }), /not a list/);
  });
});
