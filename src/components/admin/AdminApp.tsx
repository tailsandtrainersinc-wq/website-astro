import { useState, useEffect, useCallback } from "react";
import type { CollectionInfo } from "../../utils/admin/api";
import { listCollections, createFile } from "../../utils/admin/api";
import { collectionSchemas } from "../../utils/admin/schemas";
import AdminLayout from "./AdminLayout";
import CollectionSidebar from "./CollectionSidebar";
import FileEditor from "./FileEditor";

export default function AdminApp() {
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    try {
      const data = await listCollections();
      setCollections(data);
      setError(null);
    } catch {
      setError("Could not connect to admin API. Make sure you're running npm run dev.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleSelect = useCallback((collection: string, slug: string) => {
    setActiveCollection(collection);
    setActiveSlug(slug);
  }, []);

  const handleCreateNew = useCallback(
    async (collection: string) => {
      const slug = window.prompt("Enter a slug (lowercase, hyphens only):");
      if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
        if (slug) alert("Invalid slug. Use lowercase letters, numbers, and hyphens.");
        return;
      }

      const schema = collectionSchemas[collection];
      if (!schema) return;

      const frontmatter: Record<string, unknown> = {};
      for (const field of schema.fields) {
        if (field.type === "number") frontmatter[field.name] = 0;
        else frontmatter[field.name] = "";
      }

      try {
        await createFile(collection, { slug, frontmatter, body: "" });
        await fetchCollections();
        setActiveCollection(collection);
        setActiveSlug(slug);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to create file");
      }
    },
    [fetchCollections],
  );

  const handleDeleted = useCallback(() => {
    setActiveCollection(null);
    setActiveSlug(null);
    fetchCollections();
  }, [fetchCollections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-500">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Admin Panel</h1>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  const sidebar = (
    <CollectionSidebar
      collections={collections}
      activeCollection={activeCollection}
      activeSlug={activeSlug}
      onSelect={handleSelect}
      onCreateNew={handleCreateNew}
    />
  );

  return (
    <AdminLayout sidebar={sidebar}>
      {activeCollection && activeSlug ? (
        <FileEditor
          key={`${activeCollection}/${activeSlug}`}
          collection={activeCollection}
          slug={activeSlug}
          onDeleted={handleDeleted}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-zinc-500">
          Select a file from the sidebar to start editing.
        </div>
      )}
    </AdminLayout>
  );
}
