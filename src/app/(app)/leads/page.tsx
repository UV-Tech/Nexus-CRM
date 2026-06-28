import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { getCustomFields } from "@/lib/custom-fields";
import { CustomFieldInputs } from "@/components/CustomFields";
import { createLead } from "./actions";
import type { Lead, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: {
    new?: string;
    error?: string;
    imported?: string;
    q?: string;
    stage?: string;
    source?: string;
  };
}) {
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
      .eq("organization_id", organization.id)
      .order("position"),
    getCustomFields(organization.id),
  ]);

  let allLeads = (leads ?? []) as Lead[];
  const allStages = (stages ?? []) as PipelineStage[];
  const showForm = searchParams.new === "1";

  // In-memory filtering keeps the query simple and works the same offline.
  const q = (searchParams.q ?? "").trim().toLowerCase();
  if (q) {
    allLeads = allLeads.filter((l) =>
      [l.name, l.email, l.phone, l.company]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }
  if (searchParams.stage) {
    allLeads = allLeads.filter((l) => l.stage_id === searchParams.stage);
  }
  if (searchParams.source) {
    allLeads = allLeads.filter((l) => l.source === searchParams.source);
  }

  const sources = Array.from(
    new Set(((leads ?? []) as Lead[]).map((l) => l.source))
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">לידים</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/leads/export"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            ייצוא CSV
          </Link>
          <Link
            href="/leads/import"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            ייבוא CSV
          </Link>
          {showForm ? (
            <Link
              href="/leads"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              ביטול
            </Link>
          ) : (
            <Link
              href="/leads?new=1"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              + ליד חדש
            </Link>
          )}
        </div>
      </div>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      {searchParams.imported && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          יובאו {searchParams.imported} לידים.
        </p>
      )}

      {showForm && (
        <form
          action={createLead}
          className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          <Input label="שם" name="name" required />
          <Input label="חברה" name="company" />
          <Input label="אימייל" name="email" type="email" />
          <Input label="טלפון" name="phone" />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">מקור</span>
            <select
              name="source"
              className="rounded-lg border border-slate-300 px-3 py-2"
              defaultValue="manual"
            >
              <option value="manual">ידני</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="webhook">Webhook</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">שלב</span>
            <select
              name="stage_id"
              className="rounded-lg border border-slate-300 px-3 py-2"
              defaultValue={allStages[0]?.id}
            >
              {allStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <Input label="ערך משוער" name="value" type="number" />
          <CustomFieldInputs fields={customFields} />
          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">הערות</span>
              <textarea
                name="notes"
                rows={3}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">
              שמירת ליד
            </button>
          </div>
        </form>
      )}

      {/* Search & filters */}
      <form className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">חיפוש</span>
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="שם, אימייל, טלפון, חברה…"
            className="w-64 rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">שלב</span>
          <select
            name="stage"
            defaultValue={searchParams.stage ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">כל השלבים</option>
            {allStages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">מקור</span>
          <select
            name="source"
            defaultValue={searchParams.source ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">כל המקורות</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          החלה
        </button>
        <Link
          href="/leads"
          className="px-2 py-2 text-sm text-slate-500 hover:text-slate-800"
        >
          ניקוי
        </Link>
      </form>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">שם</th>
              <th className="px-5 py-3">איש קשר</th>
              <th className="px-5 py-3">מקור</th>
              <th className="px-5 py-3">שלב</th>
              <th className="px-5 py-3 text-right">ערך</th>
            </tr>
          </thead>
          <tbody>
            {allLeads.map((lead) => {
              const stage = allStages.find((s) => s.id === lead.stage_id);
              return (
                <tr
                  key={lead.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {lead.name}
                    </Link>
                    {lead.company && (
                      <p className="text-xs text-slate-500">{lead.company}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {lead.email || lead.phone || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {stage && (
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: stage.color }}
                      >
                        {stage.name}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-700">
                    {fmtMoney(Number(lead.value) || 0)}
                  </td>
                </tr>
              );
            })}
            {allLeads.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-slate-500"
                >
                  לא נמצאו לידים תואמים.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
