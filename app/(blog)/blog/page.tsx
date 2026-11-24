import type { Metadata } from "next";
import { BlogIndex, BlogUnavailable } from "@/components/blog-pages";
import { getPublishedPosts } from "@/lib/blog/posts";
import type { BlogPost } from "@/lib/blog/schema";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes from Alex Garulli on frontend engineering, Japanese and other work.",
  alternates: { canonical: `${siteUrl}/blog` },
  openGraph: {
    title: "Blog | Alex Garulli",
    description: "Notes from Alex Garulli on frontend engineering, Japanese and other work.",
    url: `${siteUrl}/blog`,
    type: "website",
  },
};

export default async function BlogPage() {
  let posts: BlogPost[] | null = null;
  try {
    posts = await getPublishedPosts();
  } catch {
    posts = null;
  }
  if (!posts) return <BlogUnavailable />;
  return <BlogIndex posts={posts} />;
}
