import { randomInt } from "crypto";
import type { Post } from "../services/postService.js";

export interface FormatOptions {
  fallbackCommentCount?: number;
}

function toSlug(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return slug || fallback;
}

function firstSentence(text: string): string {
  if (!text) return "";
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/.*?(?:[.!?](?=\s|$)|$)/);
  return (match?.[0] ?? normalized).trim();
}

function truncateWithEllipsis(text: string, maxLength = 200): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function toParagraphs(content?: string | null, fallback?: string): string[] {
  const source = content && content.trim().length > 0 ? content : fallback ?? "";
  if (!source) return [];
  return source
    .split(/\n{2,}|\r?\n\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function normalizeHashtags(tags?: string[]): string[] {
  if (!tags) return [];
  return tags
    .map((tag) => (tag ?? "").trim())
    .filter(Boolean);
}

export function formatPostForFrontend(
  post: Post,
  options?: FormatOptions
) {
  const summaryText = (post.summary ?? "").trim();
  const hashtags = normalizeHashtags(post.hashtags);
  const lede = firstSentence(summaryText);
  const feedText = truncateWithEllipsis(summaryText, 100);
  const body = toParagraphs(post.content, summaryText);
  const glossary = post.glossary ?? [];

  const fallbackComments = options?.fallbackCommentCount ?? randomInt(0, 100);

  return {
    id: post.id,
    key: toSlug(post.title, `post-${post.id}`),
    image: post.image ?? null,
    feed: {
      name: post.title,
      time: post.createdAt,
      text: feedText,
      comments: post.comments ?? fallbackComments,
    },
    article: {
      title: post.title,
      time: post.createdAt,
      lede,
      kidsSummary: post.kids_summary ?? summaryText,
      hashtags,
      glossary,
      body,
    },
  };
}

export function formatPostsForFrontend(
  posts: Post[],
  options?: FormatOptions
) {
  return posts.map((post) => formatPostForFrontend(post, options));
}
