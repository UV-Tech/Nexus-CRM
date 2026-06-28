"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { parseCsv, rowsToRecords } from "@/lib/csv";

// Recognized column headers (case-insensitive). Anything else is ignored.
const KNOWN = ["name", "email", "phone", "company", "source", "value", "notes"];

export async function importLeads(formData: FormData) {
  const { organization, userId } = await getOrgContext();
  const supabase = createClient();

  let text = String(formData.get("csv") || "");
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    text = await file.text();
  }
  text = text.trim();

  if (!text) {
    redirect("/leads/import?error=" + encodeURIComponent("No CSV provided"));
  }

  const records = rowsToRecords(parseCsv(text));
  if (records.length === 0) {
    redirect("/leads/import?error=" + encodeURIComponent("No rows found"));
  }

  // Default stage = first pipeline stage.
  const { data: firstStage } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("organization_id", organization.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  const toInsert = records
    .map((rec) => {
      const name = rec["name"] || rec["full name"] || rec["email"] || "";
      if (!name) return null;
      const custom: Record<string, string> = {};
      for (const [k, v] of Object.entries(rec)) {
        if (!KNOWN.includes(k) && v) custom[k] = v;
      }
      return {
        organization_id: organization.id,
        stage_id: firstStage?.id ?? null,
        assigned_to: userId,
        name,
        email: rec["email"] || null,
        phone: rec["phone"] || null,
        company: rec["company"] || null,
        source: rec["source"] || "import",
        value: Number(rec["value"]) || 0,
        notes: rec["notes"] || null,
        custom_data: custom,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (toInsert.length === 0) {
    redirect(
      "/leads/import?error=" +
        encodeURIComponent("No valid rows (each row needs a name or email)")
    );
  }

  const { error } = await supabase.from("leads").insert(toInsert);
  if (error) {
    redirect("/leads/import?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  redirect(`/leads?imported=${toInsert.length}`);
}
