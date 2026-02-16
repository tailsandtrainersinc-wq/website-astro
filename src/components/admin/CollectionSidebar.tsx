import type { CollectionInfo } from "../../utils/admin/api";
import { collectionSchemas } from "../../utils/admin/schemas";

interface CollectionSidebarProps {
  collections: CollectionInfo[];
  activeCollection: string | null;
  activeSlug: string | null;
  onSelect: (collection: string, slug: string) => void;
  onCreateNew: (collection: string) => void;
}

export default function CollectionSidebar({
  collections,
  activeCollection,
  activeSlug,
  onSelect,
  onCreateNew,
}: CollectionSidebarProps) {
  return (
    <nav className="w-64 shrink-0 bg-zinc-900 border-r border-zinc-800 overflow-y-auto">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-zinc-100">Admin</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Content Editor</p>
      </div>
      {collections.map((col) => {
        const schema = collectionSchemas[col.name];
        return (
          <div key={col.name} className="border-b border-zinc-800">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {col.label}
              </span>
              {schema?.canCreate && (
                <button
                  type="button"
                  onClick={() => onCreateNew(col.name)}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  title={`New ${col.label.replace(/s$/, "")}`}
                >
                  + New
                </button>
              )}
            </div>
            <ul>
              {col.files.map((file) => (
                <li key={file.slug}>
                  <button
                    type="button"
                    onClick={() => onSelect(col.name, file.slug)}
                    className={`w-full text-left px-4 py-1.5 text-sm transition-colors ${
                      activeCollection === col.name && activeSlug === file.slug
                        ? "bg-zinc-800 text-rose-300"
                        : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100"
                    }`}
                  >
                    {file.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
