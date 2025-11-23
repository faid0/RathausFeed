import Database from "better-sqlite3";

const db = new Database("dev.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    URL TEXT UNIQUE,
    summary TEXT,
    kids_summary TEXT,
    image TEXT,
    createdAt DATE NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS glossary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postId INTEGER NOT NULL,
    term TEXT NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS hashtags (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS post_hashtags (
    postId INTEGER NOT NULL,
    hashtagId INTEGER NOT NULL,
    PRIMARY KEY (postId, hashtagId),
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (hashtagId) REFERENCES hashtags(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS relationships (
    childId INTEGER NOT NULL,
    parentId INTEGER NOT NULL,
    PRIMARY KEY (childId, parentId)
  );
`);

const hashtags = [
  "verkehr",
  "wohnen",
  "stadtplanung",
  "umwelt",
  "soziales",
  "bildung",
  "kultur",
  "finanzen",
  "sicherheit",
  "verwaltung",
];

const insertHashtag = db.prepare("INSERT OR IGNORE INTO hashtags (name) VALUES (?)");

hashtags.forEach((tag) => {
  insertHashtag.run(tag);
});

export default db;
