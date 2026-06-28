import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { KanbanBoard } from "@/components/KanbanBoard";
import type { Lead, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const [{ data: stages }, { data: leads }] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("organization_id", organization.id)
      .order("position"),
    supabase
      .from("leads")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
  ]);

  const allStages = (stages ?? []) as PipelineStage[];
  const allLeads = (leads ?? []) as Lead[];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">צינור מכירות</h1>
      <p className="mt-1 text-sm text-slate-500">
        גררו לידים בין השלבים. ניהול השלבים מתבצע בהגדרות.
      </p>

      <KanbanBoard
        stages={allStages.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
        }))}
        leads={allLeads.map((l) => ({
          id: l.id,
          name: l.name,
          company: l.company,
          email: l.email,
          phone: l.phone,
          value: l.value,
          stage_id: l.stage_id,
        }))}
      />
    </div>
  );
}
