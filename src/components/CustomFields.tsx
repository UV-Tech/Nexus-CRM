import { CF_PREFIX } from "@/lib/custom-fields";
import type { CustomFieldDefinition } from "@/lib/types";

// Renders form inputs for an organization's custom field definitions.
// `values` pre-fills inputs (e.g. when editing an existing lead).
export function CustomFieldInputs({
  fields,
  values = {},
}: {
  fields: CustomFieldDefinition[];
  values?: Record<string, unknown>;
}) {
  if (fields.length === 0) return null;

  return (
    <>
      {fields.map((field) => {
        const name = CF_PREFIX + field.key;
        const current = values[field.key];

        if (field.field_type === "checkbox") {
          return (
            <label
              key={field.id}
              className="flex items-center gap-2 text-sm sm:col-span-2"
            >
              <input
                type="checkbox"
                name={name}
                defaultChecked={current === true}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="font-medium text-slate-700">{field.label}</span>
            </label>
          );
        }

        return (
          <label key={field.id} className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">{field.label}</span>
            {field.field_type === "select" ? (
              <select
                name={name}
                defaultValue={current != null ? String(current) : ""}
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">—</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={name}
                type={
                  field.field_type === "number"
                    ? "number"
                    : field.field_type === "date"
                      ? "date"
                      : "text"
                }
                step={field.field_type === "number" ? "any" : undefined}
                defaultValue={current != null ? String(current) : ""}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            )}
          </label>
        );
      })}
    </>
  );
}
