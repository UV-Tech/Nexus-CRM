import { createClient } from "@/lib/supabase/server";
import type { CustomFieldDefinition } from "@/lib/types";

// Form field names for custom fields are prefixed so the lead actions can pick
// them out of the FormData without colliding with the built-in columns.
export const CF_PREFIX = "cf_";

export async function getCustomFields(
  organizationId: string
): Promise<CustomFieldDefinition[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("position");
  return (data ?? []) as CustomFieldDefinition[];
}

// Collects custom-field values out of a submitted form into a plain object
// keyed by the field `key`, ready to store in leads.custom_data.
export function collectCustomData(
  formData: FormData,
  fields: CustomFieldDefinition[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = formData.get(CF_PREFIX + field.key);
    if (field.field_type === "checkbox") {
      out[field.key] = raw === "on" || raw === "true";
      continue;
    }
    if (raw == null || String(raw).trim() === "") continue;
    if (field.field_type === "number") {
      const n = Number(raw);
      if (!Number.isNaN(n)) out[field.key] = n;
    } else {
      out[field.key] = String(raw).trim();
    }
  }
  return out;
}
