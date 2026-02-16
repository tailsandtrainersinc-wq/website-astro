export interface FileEntry {
  slug: string;
  title: string;
}

export interface CollectionInfo {
  name: string;
  label: string;
  files: FileEntry[];
}

export interface FileContent {
  frontmatter: Record<string, unknown>;
  body: string;
}

const BASE = "/api/admin";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export function listCollections(): Promise<CollectionInfo[]> {
  return request("/collections");
}

export function getFile(collection: string, slug: string): Promise<FileContent> {
  return request(`/content/${collection}/${slug}`);
}

export function saveFile(
  collection: string,
  slug: string,
  data: { frontmatter: Record<string, unknown>; body: string },
): Promise<{ ok: true }> {
  return request(`/content/${collection}/${slug}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function createFile(
  collection: string,
  data: { slug: string; frontmatter: Record<string, unknown>; body: string },
): Promise<{ ok: true; slug: string }> {
  return request(`/content/${collection}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function deleteFile(collection: string, slug: string): Promise<{ ok: true }> {
  return request(`/content/${collection}/${slug}`, { method: "DELETE" });
}
