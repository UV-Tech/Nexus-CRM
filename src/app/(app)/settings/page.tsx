import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import {
  addCustomField,
  addStage,
  createInvitation,
  deleteCustomField,
  deleteInvitation,
  deleteStage,
  regenerateIntakeToken,
} from "./actions";
import type {
  CustomFieldDefinition,
  OrgRole,
  PipelineStage,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface MemberRow {
  user_id: string;
  role: OrgRole;
  profiles: { full_name: string | null } | null;
}

interface InvitationRow {
  id: string;
  email: string | null;
  role: OrgRole;
  token: string;
  accepted_at: string | null;
}

export default async function SettingsPage() {
  const { organization, role } = await getOrgContext();
  const supabase = createClient();
  const canManage = role === "owner" || role === "admin";

  const [
    { data: stages },
    { data: members },
    { data: customFields },
    { data: invitations },
  ] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("organization_id", organization.id)
      .order("position"),
    supabase
      .from("organization_members")
      .select("user_id, role, profiles(full_name)")
      .eq("organization_id", organization.id),
    supabase
      .from("custom_field_definitions")
      .select("*")
      .eq("organization_id", organization.id)
      .order("position"),
    supabase
      .from("invitations")
      .select("id, email, role, token, accepted_at")
      .eq("organization_id", organization.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const allStages = (stages ?? []) as PipelineStage[];
  const allMembers = (members ?? []) as unknown as MemberRow[];
  const allCustomFields = (customFields ?? []) as CustomFieldDefinition[];
  const allInvitations = (invitations ?? []) as InvitationRow[];

  const host = headers().get("host") ?? "your-app.example.com";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const webhookUrl = `${proto}://${host}/api/webhooks/leads?token=${organization.intake_token}`;
  const inviteBase = `${proto}://${host}/invite/`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* Pipeline stages */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Pipeline stages</h2>
        <p className="text-sm text-slate-500">
          Customize the stages your leads move through.
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {allStages.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="font-medium text-slate-800">{s.name}</span>
                {s.is_won && (
                  <span className="text-xs text-green-600">won</span>
                )}
                {s.is_lost && (
                  <span className="text-xs text-red-600">lost</span>
                )}
              </span>
              {canManage && (
                <form action={deleteStage}>
                  <input type="hidden" name="stage_id" value={s.id} />
                  <button className="text-sm text-slate-400 hover:text-red-600">
                    Remove
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>

        {canManage && (
          <form action={addStage} className="mt-4 flex items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">New stage</span>
              <input
                name="name"
                required
                placeholder="e.g. Negotiation"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Color</span>
              <input
                name="color"
                type="color"
                defaultValue="#6366f1"
                className="h-10 w-14 rounded-lg border border-slate-300"
              />
            </label>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Add stage
            </button>
          </form>
        )}
      </section>

      {/* Custom fields */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Custom lead fields</h2>
        <p className="text-sm text-slate-500">
          Add fields specific to your business. They appear on every lead form.
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {allCustomFields.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <span className="font-medium text-slate-800">{f.label}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {f.field_type}
                </span>
                {f.field_type === "select" && f.options.length > 0 && (
                  <span className="text-xs text-slate-400">
                    {f.options.join(", ")}
                  </span>
                )}
              </span>
              {canManage && (
                <form action={deleteCustomField}>
                  <input type="hidden" name="field_id" value={f.id} />
                  <button className="text-sm text-slate-400 hover:text-red-600">
                    Remove
                  </button>
                </form>
              )}
            </li>
          ))}
          {allCustomFields.length === 0 && (
            <li className="text-sm text-slate-500">No custom fields yet.</li>
          )}
        </ul>

        {canManage && (
          <form
            action={addCustomField}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Field label</span>
              <input
                name="label"
                required
                placeholder="e.g. Budget"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Type</span>
              <select
                name="field_type"
                defaultValue="text"
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Dropdown</option>
                <option value="checkbox">Checkbox</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">
                Options (for dropdown)
              </span>
              <input
                name="options"
                placeholder="comma,separated,values"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Add field
            </button>
          </form>
        )}
      </section>

      {/* Lead intake / channels */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Lead intake webhook</h2>
        <p className="text-sm text-slate-500">
          Send leads from Facebook Lead Ads, Instagram, WhatsApp or any tool
          (Zapier/Make) to this URL. POST JSON with <code>name</code>,{" "}
          <code>email</code>, <code>phone</code>, <code>company</code>,{" "}
          <code>source</code> and optional <code>custom</code> fields.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-100">
          {webhookUrl}
        </pre>
        {canManage && (
          <form action={regenerateIntakeToken} className="mt-3">
            <button className="text-sm text-slate-500 hover:text-red-600">
              Regenerate token
            </button>
          </form>
        )}
      </section>

      {/* Team */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Team</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {allMembers.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <span className="text-slate-800">
                {m.profiles?.full_name ?? "Member"}
              </span>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
        {canManage && (
          <>
            <form
              action={createInvitation}
              className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5"
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">
                  Invite teammate (email optional)
                </span>
                <input
                  name="email"
                  type="email"
                  placeholder="teammate@company.com"
                  className="w-64 rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Role</span>
                <select
                  name="role"
                  defaultValue="agent"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Create invite link
              </button>
            </form>

            {allInvitations.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2">
                {allInvitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700">
                        {inv.email || "Open invite"} ·{" "}
                        <span className="text-slate-400">{inv.role}</span>
                      </p>
                      <p className="truncate font-mono text-xs text-slate-400">
                        {inviteBase}
                        {inv.token}
                      </p>
                    </div>
                    <form action={deleteInvitation}>
                      <input type="hidden" name="invitation_id" value={inv.id} />
                      <button className="shrink-0 text-sm text-slate-400 hover:text-red-600">
                        Revoke
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Share an invite link with a teammate. They sign in and join this
          organization with the role you chose.
        </p>
      </section>
    </div>
  );
}
