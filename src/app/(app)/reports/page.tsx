import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import type { Lead, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function ReportsPage() {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const [{ data: leads }, { data: stages }] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("organization_id", organization.id),
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("organization_id", organization.id)
      .order("position"),
  ]);

  const allLeads = (leads ?? []) as Lead[];
  const allStages = (stages ?? []) as PipelineStage[];

  const wonStages = allStages.filter((s) => s.is_won);
  const lostStages = allStages.filter((s) => s.is_lost);
  const wonIds = new Set(wonStages.map((s) => s.id));
  const lostIds = new Set(lostStages.map((s) => s.id));

  const won = allLeads.filter((l) => wonIds.has(l.stage_id ?? ""));
  const lost = allLeads.filter((l) => lostIds.has(l.stage_id ?? ""));
  const closed = won.length + lost.length;
  const winRate = closed > 0 ? Math.round((won.length / closed) * 100) : 0;
  const wonValue = won.reduce((s, l) => s + (Number(l.value) || 0), 0);

  // Leads grouped by source.
  const bySource = new Map<string, number>();
  for (const l of allLeads) {
    bySource.set(l.source, (bySource.get(l.source) ?? 0) + 1);
  }
  const sourceRows = Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(1, ...sourceRows.map(([, n]) => n));

  // Count + value by stage (pipeline funnel).
  const byStage = allStages.map((stage) => {
    const stageLeads = allLeads.filter((l) => l.stage_id === stage.id);
    return {
      stage,
      count: stageLeads.length,
      value: stageLeads.reduce((s, l) => s + (Number(l.value) || 0), 0),
    };
  });
  const maxStage = Math.max(1, ...byStage.map((r) => r.count));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">דוחות</h1>
      <p className="mt-1 text-sm text-slate-500">
        ביצועים עבור {organization.name}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="סה״כ לידים" value={String(allLeads.length)} />
        <Stat label="נסגרו בהצלחה" value={String(won.length)} />
        <Stat label="שיעור המרה" value={`${winRate}%`} />
        <Stat label="ערך עסקאות שנסגרו" value={fmtMoney(wonValue)} accent />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leads by source */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">לידים לפי מקור</h2>
          <div className="mt-4 flex flex-col gap-3">
            {sourceRows.map(([source, count]) => (
              <div key={source}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-slate-700">{source}</span>
                  <span className="text-slate-500">{count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${(count / maxSource) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {sourceRows.length === 0 && (
              <p className="text-sm text-slate-500">אין נתונים עדיין.</p>
            )}
          </div>
        </section>

        {/* Pipeline funnel */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">צינור מכירות לפי שלב</h2>
          <div className="mt-4 flex flex-col gap-3">
            {byStage.map(({ stage, count, value }) => (
              <div key={stage.id}>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    {stage.name}
                  </span>
                  <span className="text-slate-500">
                    {count} · {fmtMoney(value)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(count / maxStage) * 100}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
            {byStage.length === 0 && (
              <p className="text-sm text-slate-500">לא הוגדרו שלבים.</p>
            )}
          </div>
        </section>
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
