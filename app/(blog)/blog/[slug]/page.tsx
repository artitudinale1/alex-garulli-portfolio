import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle, BlogUnavailable } from "@/components/blog-pages";
import { getPublishedPosts } from "@/lib/blog/posts";
import { isBlogSlug, type BlogPost } from "@/lib/blog/schema";
import { shareImage, siteUrl } from "@/lib/seo";

export async function generateStaticParams() {
  try {
    const posts = await getPublishedPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isBlogSlug(slug)) return { title: "Post" };
  try {
    const post = (await getPublishedPosts()).find((item) => item.slug === slug);
    if (!post) return { title: "Post" };
    const url = `${siteUrl}/blog/${post.slug}`;
    const title = `${post.title} | Alex Garulli`;
    const image = post.coverImageUrl
      ? { url: post.coverImageUrl, alt: post.title }
      : {
          url: new URL(shareImage.url, siteUrl).href,
          alt: shareImage.alt,
          width: shareImage.width,
          height: shareImage.height,
          type: shareImage.type,
        };
    return {
      title: post.title,
      description: post.excerpt,
      alternates: { canonical: url },
      openGraph: {
        title,
        description: post.excerpt,
        url,
        type: "article",
        images: [image],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: post.excerpt,
        images: [image],
      },
    };
  } catch {
    return { title: "Post" };
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isBlogSlug(slug)) notFound();
  let post: BlogPost | null = null;
  let unavailable = false;
  try {
    post = (await getPublishedPosts()).find((item) => item.slug === slug) ?? null;
  } catch {
    unavailable = true;
  }
  if (unavailable) return <BlogUnavailable />;
  if (!post) notFound();
  return <BlogArticle post={post} />;
}
