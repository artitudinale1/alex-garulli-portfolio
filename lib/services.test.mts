import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listedServiceSlugs, selectListedServices } from "./contentful/service-list.ts";

describe("listed services", () => {
  it("shows the two public services in display order and leaves AI unpublished on the page", () => {
    const selected = selectListedServices([
      { slug: "ai-integration-and-automation", displayOrder: 2, title: "AI Integration & Automation" },
      { slug: "legacy-frontend-modernisation", displayOrder: 1, title: "Legacy Frontend Modernisation" },
      { slug: "website-and-application-development", displayOrder: 0, title: "Website & Application Development" },
    ]);
    assert.deepEqual(
      selected.map((service) => service.slug),
      [...listedServiceSlugs],
    );
    assert.equal(
      selected.some((service) => service.slug === "ai-integration-and-automation"),
      false,
    );
  });
});
