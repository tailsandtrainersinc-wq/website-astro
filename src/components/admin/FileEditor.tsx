import { useState, useEffect, useCallback } from "react";
import { collectionSchemas } from "../../utils/admin/schemas";
import { getFile, saveFile, deleteFile } from "../../utils/admin/api";
import { markdownToHtml, htmlToMarkdown } from "../../utils/admin/markdown";
import FrontmatterForm from "./FrontmatterForm";
import MarkdownEditor from "./MarkdownEditor";

interface FileEditorProps {
  collection: string;
  slug: string;
  onDeleted: () => void;
}

export default function FileEditor({ collection, slug, onDeleted }: FileEditorProps) {
  const schema = collectionSchemas[collection];
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({});
  const [bodyHtml, setBodyHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setStatus(null);
    getFile(collection, slug)
      .then(({ frontmatter: fm, body }) => {
        setFrontmatter(fm);
        setBodyHtml(body ? markdownToHtml(body) : "");
      })
      .catch((err) => setStatus(`Error: ${err.message}`))
      .finally(() => setLoading(false));
  }, [collection, slug]);

  const handleFieldChange = useCallback((name: string, value: unknown) => {
    setFrontmatter((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const body = schema?.hasBody ? htmlToMarkdown(bodyHtml) : "";
      await saveFile(collection, slug, { frontmatter, body });
      setStatus("Saved!");
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Save failed"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
      await deleteFile(collection, slug);
      onDeleted();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : "Delete failed"}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">Loading...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-100">
          {(frontmatter.title as string) || (frontmatter.heroTitle as string) || slug}
        </h2>
        <div className="flex items-center gap-3">
          {status && (
            <span
              className={`text-sm ${status.startsWith("Error") ? "text-red-400" : "text-green-400"}`}
            >
              {status}
            </span>
          )}
          {schema?.canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {schema && (
        <FrontmatterForm
          fields={schema.fields}
          values={frontmatter}
          onChange={handleFieldChange}
        />
      )}

      {schema?.hasBody && (
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Body Content</label>
          <MarkdownEditor html={bodyHtml} onChange={setBodyHtml} />
        </div>
      )}
    </div>
  );
}
