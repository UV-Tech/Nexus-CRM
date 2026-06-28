import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { getCustomFields } from "@/lib/custom-fields";
import type { Lead, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  // Quote if the value contains a comma, quote, or newline.
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const [{ data: leads }, { data: stages }, customFields] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("organization_id", organization.id),
    getCustomFields(organization.id),
  ]);

  const allLeads = (leads ?? []) as Lead[];
  const allStages = (stages ?? []) as PipelineStage[];
  const stageName = (id: string | null) =>
    allStages.find((s) => s.id === id)?.name ?? "";

  const baseHeaders = [
    "name",
    "email",
    "phone",
    "company",
    "source",
    "value",
    "stage",
    "notes",
    "created_at",
  ];
  const headers = [...baseHeaders, ...customFields.map((f) => f.label)];

  const rows = allLeads.map((l) => {
    const base = [
      l.name,
      l.email,
      l.phone,
      l.company,
      l.source,
      l.value,
      stageName(l.stage_id),
      l.notes,
      l.created_at,
    ];
    const custom = customFields.map((f) => l.custom_data?.[f.key] ?? "");
    return [...base, ...custom].map(csvCell).join(",");
  });

  const csv = [headers.map(csvCell).join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${organization.slug}.csv"`,
    },
  });
}
