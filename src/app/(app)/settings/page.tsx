import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { addStage, deleteStage, regenerateIntakeToken } from "./actions";
import type { OrgRole, PipelineStage } from "@/lib/types";

export const dynamic = "force-dynamic";

interface MemberRow {
  user_id: string;
  role: OrgRole;
  profiles: { full_name: string | null } | null;
}

export default async function SettingsPage() {
  const { organization, role } = await getOrgContext();
  const supabase = createClient();
  const canManage = role === "owner" || role === "admin";

  const [{ data: stages }, { data: members }] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("organization_id", organization.id)
      .order("position"),
    supabase
      .from("organization_members")
      .select("user_id, role, profiles(full_name)")
      .eq("organization_id", organization.id),
  ]);

  const allStages = (stages ?? []) as PipelineStage[];
  const allMembers = (members ?? []) as unknown as MemberRow[];

  const host = headers().get("host") ?? "your-app.example.com";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const webhookUrl = `${proto}://${host}/api/webhooks/leads?token=${organization.intake_token}`;

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
        <p className="mt-3 text-xs text-slate-400">
          Inviting teammates by email is coming next. For now members are added
          via the database or sign-up flow.
        </p>
      </section>
    </div>
  );
}
