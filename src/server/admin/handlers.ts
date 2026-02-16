import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve("src/content");

const COLLECTIONS = ["site", "features", "events"] as const;
type Collection = (typeof COLLECTIONS)[number];

const COLLECTION_LABELS: Record<Collection, string> = {
  site: "Site Settings",
  features: "Features",
  events: "Events",
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

function isValidCollection(name: string): name is Collection {
  return (COLLECTIONS as readonly string[]).includes(name);
}

function collectionDir(collection: string): string {
  return path.join(CONTENT_DIR, collection);
}

function filePath(collection: string, slug: string): string {
  return path.join(collectionDir(collection), `${slug}.md`);
}

export function listCollections() {
  return COLLECTIONS.map((name) => {
    const dir = collectionDir(name);
    let files: { slug: string; title: string }[] = [];
    if (fs.existsSync(dir)) {
      files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => {
          const slug = f.replace(/\.md$/, "");
          const raw = fs.readFileSync(path.join(dir, f), "utf-8");
          const { data } = matter(raw);
          return { slug, title: (data.title as string) || (data.heroTitle as string) || slug };
        });
    }
    return { name, label: COLLECTION_LABELS[name], files };
  });
}

export function getContent(collection: string, slug: string) {
  if (!isValidCollection(collection)) throw new Error("Invalid collection");
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug");

  const fp = filePath(collection, slug);
  if (!fs.existsSync(fp)) throw new Error("File not found");

  const raw = fs.readFileSync(fp, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: data, body: content };
}

export function saveContent(
  collection: string,
  slug: string,
  frontmatter: Record<string, unknown>,
  body: string,
) {
  if (!isValidCollection(collection)) throw new Error("Invalid collection");
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug");

  const fp = filePath(collection, slug);
  if (!fs.existsSync(fp)) throw new Error("File not found");

  const output = matter.stringify(body, frontmatter);
  fs.writeFileSync(fp, output, "utf-8");
  return { ok: true as const };
}

export function createContent(
  collection: string,
  slug: string,
  frontmatter: Record<string, unknown>,
  body: string,
) {
  if (!isValidCollection(collection)) throw new Error("Invalid collection");
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug");

  const fp = filePath(collection, slug);
  if (fs.existsSync(fp)) throw new Error("File already exists");

  const dir = collectionDir(collection);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const output = matter.stringify(body, frontmatter);
  fs.writeFileSync(fp, output, "utf-8");
  return { ok: true as const, slug };
}

export function deleteContent(collection: string, slug: string) {
  if (!isValidCollection(collection)) throw new Error("Invalid collection");
  if (!SLUG_RE.test(slug)) throw new Error("Invalid slug");

  const fp = filePath(collection, slug);
  if (!fs.existsSync(fp)) throw new Error("File not found");

  fs.unlinkSync(fp);
  return { ok: true as const };
}
