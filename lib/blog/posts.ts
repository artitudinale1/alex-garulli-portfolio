import { cacheLife, cacheTag } from "next/cache";
import { parsePosts, type BlogPost } from "./schema";

export const blogGraphqlUrl = "https://alex-blog-api-dhho.onrender.com/graphql";

const POSTS_QUERY = `
  query PublishedPosts {
    posts(limit: 20) {
      id
      title
      slug
      excerpt
      contentMarkdown
      category
      tags
      publishedAt
    }
  }
`;

const BUILD_TIMEOUT_MS = 70_000;
const REQUEST_TIMEOUT_MS = 4_000;

function requestTimeout(): number {
  return process.env.NEXT_PHASE === "phase-production-build" ? BUILD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
}

async function requestPublishedPosts(): Promise<BlogPost[]> {
  let response: Response;
  try {
    response = await fetch(blogGraphqlUrl, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ query: POSTS_QUERY }),
      signal: AbortSignal.timeout(requestTimeout()),
    });
  } catch {
    throw new Error("Blog API could not be reached.");
  }

  if (!response.ok) throw new Error(`Blog API request failed with status ${response.status}.`);
  const body = (await response.json()) as { data?: { posts?: unknown }; errors?: unknown[] };
  if (body.errors?.length) throw new Error("Blog API returned an error.");
  return parsePosts(body.data?.posts);
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  "use cache";
  cacheLife("days");
  cacheTag("blog-posts");
  return requestPublishedPosts();
}
