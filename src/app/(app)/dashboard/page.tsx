import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import type { Lead, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const [{ data: leads }, { data: stages }] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("organization_id", organization.id)
      .order("position"),
  ]);

  const allLeads = (leads ?? []) as Lead[];
  const allStages = (stages ?? []) as PipelineStage[];
  const wonStageIds = new Set(allStages.filter((s) => s.is_won).map((s) => s.id));
  const lostStageIds = new Set(allStages.filter((s) => s.is_lost).map((s) => s.id));

  const openLeads = allLeads.filter(
    (l) => !wonStageIds.has(l.stage_id ?? "") && !lostStageIds.has(l.stage_id ?? "")
  );
  const wonLeads = allLeads.filter((l) => wonStageIds.has(l.stage_id ?? ""));
  const openValue = openLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  const wonValue = wonLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link
          href="/leads?new=1"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New lead
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total leads" value={String(allLeads.length)} />
        <Stat label="Open leads" value={String(openLeads.length)} />
        <Stat label="Open pipeline value" value={fmtMoney(openValue)} />
        <Stat label="Won value" value={fmtMoney(wonValue)} accent />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">
        Recent leads
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {allLeads.slice(0, 8).map((lead) => {
          const stage = allStages.find((s) => s.id === lead.stage_id);
          return (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0 hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{lead.name}</p>
                <p className="text-sm text-slate-500">
                  {lead.company || lead.email || lead.phone || "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  {fmtMoney(Number(lead.value) || 0)}
                </span>
                {stage && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: stage.color }}
                  >
                    {stage.name}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {allLeads.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No leads yet. Create your first one or connect a channel in Settings.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent ? "text-green-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
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
