import db from "../db/db.js";

export interface GlossaryEntry {
  term: string;
  description: string;
}

export interface Post {
  id: number;
  title: string;
  content?: string | null;
  summary: string;
  URL: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: number | null;
  kids_summary?: string | null;
  kidsSummary?: string | null;
  image?: string | null;
  glossary?: GlossaryEntry[];
  comments?: number | null;
  hashtags?: string[];
}

export function listPosts(): Post[] {
  const stmt = db.prepare<[], Post>("SELECT * FROM posts");
  const posts = stmt.all();

  const getTags = db.prepare<{ postId: number }, { name: string }>(`
    SELECT h.name 
    FROM hashtags h 
    JOIN post_hashtags ph ON h.id = ph.hashtagId 
    WHERE ph.postId = @postId
  `);

  const getGlossary = db.prepare<{ postId: number }, GlossaryEntry>(`
    SELECT term, description
    FROM glossary_entries
    WHERE postId = @postId
    ORDER BY id
  `);

  return posts.map((post) => {
    const tags = getTags.all({ postId: post.id });
    const glossary = getGlossary.all({ postId: post.id });
    return {
      ...post,
      hashtags: tags.map((t) => t.name),
      glossary,
    };
  });
}