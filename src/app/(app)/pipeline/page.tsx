import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { moveLeadStage } from "../leads/actions";
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
      <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
      <p className="mt-1 text-sm text-slate-500">
        Move leads between stages. Manage stages in Settings.
      </p>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {allStages.map((stage) => {
          const stageLeads = allLeads.filter((l) => l.stage_id === stage.id);
          const total = stageLeads.reduce(
            (sum, l) => sum + (Number(l.value) || 0),
            0
          );
          return (
            <div
              key={stage.id}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="font-medium text-slate-800">
                    {stage.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {stageLeads.length}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {fmtMoney(total)}
                </span>
              </div>

              <div className="flex flex-col gap-2 p-3">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-lg border border-slate-200 p-3 hover:border-brand-300"
                  >
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {lead.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {lead.company || lead.email || lead.phone || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {fmtMoney(Number(lead.value) || 0)}
                    </p>

                    {/* Quick-move control (no JS needed) */}
                    <form action={moveLeadStage} className="mt-2 flex gap-1">
                      <input type="hidden" name="lead_id" value={lead.id} />
                      <select
                        name="stage_id"
                        defaultValue={stage.id}
                        className="w-full rounded border border-slate-200 px-1.5 py-1 text-xs"
                      >
                        {allStages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <button className="rounded bg-slate-100 px-2 text-xs text-slate-600 hover:bg-slate-200">
                        Move
                      </button>
                    </form>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-400">
                    Empty
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
