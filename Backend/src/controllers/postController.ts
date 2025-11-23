import type { Request, Response, NextFunction } from "express";
import { listPosts, type Post } from "../services/postService.js";
import { randomInt } from "crypto";

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

function formatPostForFrontend(post: Post) {
  const summaryText = (post.summary ?? "").trim();
  const hashtags = normalizeHashtags(post.hashtags);
  const lede = firstSentence(summaryText);
  const feedText = truncateWithEllipsis(summaryText, 100);
  const body = toParagraphs(post.content, summaryText);
  const glossary = post.glossary ?? [];
  
  return {
    id: post.id,
    key: toSlug(post.title, `post-${post.id}`),
    image: post.image ?? null,
    feed: {
      name: post.title,
      time: post.createdAt,
      text: feedText,
      comments: post.comments ?? randomInt(0, 100),
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

export async function getPosts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const posts = listPosts();
    const mapped = posts.map((post) => formatPostForFrontend(post));
    res.json(mapped);
  } catch (error) {
    next(error);
  }
}
