import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import {
  addActivity,
  assignLead,
  deleteLead,
  moveLeadStage,
  updateLead,
} from "../actions";
import { getCustomFields } from "@/lib/custom-fields";
import { CustomFieldInputs } from "@/components/CustomFields";
import { openLeadConversation } from "../../inbox/actions";
import type { Lead, LeadActivity, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!lead) notFound();
  const l = lead as Lead;

  const [{ data: stages }, { data: activities }, { data: members }, customFields] =
    await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("*")
        .eq("organization_id", organization.id)
        .order("position"),
      supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", l.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("organization_members")
        .select("user_id, profiles(full_name)")
        .eq("organization_id", organization.id),
      getCustomFields(organization.id),
    ]);

  const allStages = (stages ?? []) as PipelineStage[];
  const allActivities = (activities ?? []) as LeadActivity[];
  const allMembers = (members ?? []) as unknown as {
    user_id: string;
    profiles: { full_name: string | null } | null;
  }[];

  return (
    <div className="p-8">
      <Link href="/leads" className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to leads
      </Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{l.name}</h1>
          <p className="text-slate-500">
            {l.company || "—"} ·{" "}
            <span className="capitalize">{l.source}</span>
          </p>
          {l.phone && (
            <form action={openLeadConversation} className="mt-2">
              <input type="hidden" name="lead_id" value={l.id} />
              <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                💬 Message on WhatsApp
              </button>
            </form>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <form action={moveLeadStage} className="flex items-center gap-2">
            <input type="hidden" name="lead_id" value={l.id} />
            <select
              name="stage_id"
              defaultValue={l.stage_id ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {allStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Move
            </button>
          </form>
          <form action={assignLead} className="flex items-center gap-2">
            <input type="hidden" name="lead_id" value={l.id} />
            <select
              name="assigned_to"
              defaultValue={l.assigned_to ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {allMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.full_name ?? "Member"}
                </option>
              ))}
            </select>
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Assign
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Details / edit */}
        <div className="lg:col-span-2">
          <form
            action={updateLead}
            className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
          >
            <input type="hidden" name="lead_id" value={l.id} />
            <Field label="Name" name="name" defaultValue={l.name} required />
            <Field label="Company" name="company" defaultValue={l.company ?? ""} />
            <Field label="Email" name="email" type="email" defaultValue={l.email ?? ""} />
            <Field label="Phone" name="phone" defaultValue={l.phone ?? ""} />
            <Field
              label="Estimated value"
              name="value"
              type="number"
              defaultValue={String(l.value ?? 0)}
            />
            <CustomFieldInputs fields={customFields} values={l.custom_data} />
            <div className="sm:col-span-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700">Notes</span>
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={l.notes ?? ""}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <button className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-700">
                Save changes
              </button>
            </div>
          </form>

          <form action={deleteLead} className="mt-4">
            <input type="hidden" name="lead_id" value={l.id} />
            <button className="text-sm text-slate-400 hover:text-red-600">
              Delete lead
            </button>
          </form>
        </div>

        {/* Activity timeline */}
        <div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Activity</h2>
            <form action={addActivity} className="mt-4 flex flex-col gap-2">
              <input type="hidden" name="lead_id" value={l.id} />
              <select
                name="type"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                defaultValue="note"
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
              </select>
              <textarea
                name="body"
                rows={2}
                placeholder="Log a note, call or email…"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="self-start rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Add
              </button>
            </form>

            <ul className="mt-6 flex flex-col gap-4">
              {allActivities.map((a) => (
                <li key={a.id} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {a.type}
                  </p>
                  <p className="text-sm text-slate-700">{a.body}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
              {allActivities.length === 0 && (
                <li className="text-sm text-slate-500">No activity yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        step={type === "number" ? "0.01" : undefined}
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
