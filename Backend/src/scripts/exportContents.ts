import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { listPosts } from "../services/postService.js";
import { formatPostsForFrontend } from "../utils/formatPostForFrontend.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toMillis(value: string | null | undefined): number {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? 0 : time;
}

function exportContents(): void {
  const posts = listPosts();
  const formatted = formatPostsForFrontend(posts, { fallbackCommentCount: 0 });
  const sorted = formatted.sort(
    (a, b) => toMillis(b.feed.time) - toMillis(a.feed.time)
  );

  const repoRoot = path.resolve(__dirname, "../../..");
  const outputPath = path.join(
    repoRoot,
    "Frontend/rathaus-feed/public/contents.json"
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2), "utf-8");

  console.log(`Wrote ${sorted.length} posts to ${outputPath}`);
}

try {
  exportContents();
} catch (error) {
  console.error("Failed to export contents.json:", error);
  process.exit(1);
}
