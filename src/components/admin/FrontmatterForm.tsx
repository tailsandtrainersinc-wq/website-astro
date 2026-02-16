import type { FieldDef } from "../../utils/admin/schemas";

interface FrontmatterFormProps {
  fields: FieldDef[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
}

export default function FrontmatterForm({ fields, values, onChange }: FrontmatterFormProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const val = values[field.name] ?? "";
        const id = `field-${field.name}`;

        return (
          <div key={field.name}>
            <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1">
              {field.label}
              {field.required && <span className="text-rose-400 ml-1">*</span>}
            </label>

            {field.type === "tags" ? (
              <div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(Array.isArray(val) ? val : []).map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-700 text-zinc-200 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const next = (val as string[]).filter((_, j) => j !== i);
                          onChange(field.name, next);
                        }}
                        className="text-zinc-400 hover:text-zinc-100 ml-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  id={id}
                  type="text"
                  placeholder="Type a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const tag = input.value.trim().toLowerCase();
                      if (tag && !(Array.isArray(val) ? val : []).includes(tag)) {
                        onChange(field.name, [...(Array.isArray(val) ? val : []), tag]);
                      }
                      input.value = "";
                    }
                  }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500"
                />
                <p className="text-xs text-zinc-500 mt-1">Press Enter to add a tag</p>
              </div>
            ) : field.type === "textarea" ? (
              <textarea
                id={id}
                value={String(val)}
                onChange={(e) => onChange(field.name, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 resize-y"
              />
            ) : field.type === "number" ? (
              <input
                id={id}
                type="number"
                value={val === "" ? "" : Number(val)}
                onChange={(e) =>
                  onChange(field.name, e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500"
              />
            ) : field.type === "date" ? (
              <input
                id={id}
                type="date"
                value={String(val)}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500"
              />
            ) : (
              <input
                id={id}
                type="text"
                value={String(val)}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
