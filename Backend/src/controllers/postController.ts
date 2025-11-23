import type { Request, Response, NextFunction } from "express";
import { listPosts } from "../services/postService.js";
import { formatPostForFrontend } from "../utils/formatPostForFrontend.js";

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
