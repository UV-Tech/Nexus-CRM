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
  regenerateWebhookSecret,
} from "./actions";
import type {
  AuditEntry,
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
    { data: audit },
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
    supabase
      .from("audit_log")
      .select("id, organization_id, actor_id, action, detail, created_at")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const allStages = (stages ?? []) as PipelineStage[];
  const allMembers = (members ?? []) as unknown as MemberRow[];
  const allCustomFields = (customFields ?? []) as CustomFieldDefinition[];
  const allInvitations = (invitations ?? []) as InvitationRow[];
  const auditEntries = (audit ?? []) as AuditEntry[];

  const host = headers().get("host") ?? "your-app.example.com";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const webhookUrl = `${proto}://${host}/api/webhooks/leads?token=${organization.intake_token}`;
  const inviteBase = `${proto}://${host}/invite/`;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">הגדרות</h1>

      {/* Pipeline stages */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">שלבי צינור המכירות</h2>
        <p className="text-sm text-slate-500">
          התאימו את השלבים שהלידים שלכם עוברים דרכם.
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
                  <span className="text-xs text-green-600">נסגר בהצלחה</span>
                )}
                {s.is_lost && (
                  <span className="text-xs text-red-600">אבוד</span>
                )}
              </span>
              {canManage && (
                <form action={deleteStage}>
                  <input type="hidden" name="stage_id" value={s.id} />
                  <button className="text-sm text-slate-400 hover:text-red-600">
                    הסרה
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>

        {canManage && (
          <form action={addStage} className="mt-4 flex items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">שלב חדש</span>
              <input
                name="name"
                required
                placeholder="למשל משא ומתן"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">צבע</span>
              <input
                name="color"
                type="color"
                defaultValue="#6366f1"
                className="h-10 w-14 rounded-lg border border-slate-300"
              />
            </label>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              הוספת שלב
            </button>
          </form>
        )}
      </section>

      {/* Custom fields */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">שדות ליד מותאמים אישית</h2>
        <p className="text-sm text-slate-500">
          הוסיפו שדות הייחודיים לעסק שלכם. הם יופיעו בכל טופס ליד.
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
                    הסרה
                  </button>
                </form>
              )}
            </li>
          ))}
          {allCustomFields.length === 0 && (
            <li className="text-sm text-slate-500">אין עדיין שדות מותאמים אישית.</li>
          )}
        </ul>

        {canManage && (
          <form
            action={addCustomField}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">תווית השדה</span>
              <input
                name="label"
                required
                placeholder="למשל תקציב"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">סוג</span>
              <select
                name="field_type"
                defaultValue="text"
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="text">טקסט</option>
                <option value="number">מספר</option>
                <option value="date">תאריך</option>
                <option value="select">רשימה נפתחת</option>
                <option value="checkbox">תיבת סימון</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">
                אפשרויות (לרשימה נפתחת)
              </span>
              <input
                name="options"
                placeholder="ערכים,מופרדים,בפסיקים"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              הוספת שדה
            </button>
          </form>
        )}
      </section>

      {/* Lead intake / channels */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Webhook לקליטת לידים</h2>
        <p className="text-sm text-slate-500">
          שלחו לידים מ-Facebook Lead Ads, Instagram, WhatsApp או כל כלי אחר
          (Zapier/Make) לכתובת זו. שלחו בקשת POST עם JSON הכולל <code>name</code>,{" "}
          <code>email</code>, <code>phone</code>, <code>company</code>,{" "}
          <code>source</code> ושדות <code>custom</code> אופציונליים.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-100">
          {webhookUrl}
        </pre>

        <p className="mt-4 text-sm text-slate-500">
          אופציונלי: חתמו על הבקשות באמצעות HMAC-SHA256 של גוף הבקשה הגולמי
          בעזרת הסוד שלהלן, ושלחו אותו בכותרת <code>x-signature</code>
          (בפורמט hex, עם תחילית <code>sha256=</code> אופציונלית). בקשות ללא
          חתימה עדיין מתקבלות.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-100 px-4 py-3 text-xs text-slate-700">
          {organization.webhook_secret ?? "(הריצו את מיגרציה 0005 כדי להפעיל)"}
        </pre>

        {canManage && (
          <div className="mt-3 flex gap-4">
            <form action={regenerateIntakeToken}>
              <button className="text-sm text-slate-500 hover:text-red-600">
                יצירת אסימון מחדש
              </button>
            </form>
            <form action={regenerateWebhookSecret}>
              <button className="text-sm text-slate-500 hover:text-red-600">
                יצירת סוד חתימה מחדש
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Audit log */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">יומן פעילות</h2>
        <p className="text-sm text-slate-500">
          פעולות אחרונות במרחב העבודה הזה, כולל גישת מנהל הפלטפורמה.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {auditEntries.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between border-b border-slate-50 pb-2 text-sm last:border-0"
            >
              <span className="text-slate-700">
                <code className="text-xs text-slate-500">{a.action}</code>
                {a.detail ? ` · ${a.detail}` : ""}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(a.created_at).toLocaleString()}
              </span>
            </li>
          ))}
          {auditEntries.length === 0 && (
            <li className="text-sm text-slate-500">לא נרשמה עדיין פעילות.</li>
          )}
        </ul>
      </section>

      {/* Team */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">חברי צוות</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {allMembers.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
            >
              <span className="text-slate-800">
                {m.profiles?.full_name ?? "חבר צוות"}
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
                  הזמנת חבר צוות (אימייל אופציונלי)
                </span>
                <input
                  name="email"
                  type="email"
                  placeholder="teammate@company.com"
                  className="w-64 rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">תפקיד</span>
                <select
                  name="role"
                  defaultValue="agent"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="agent">נציג</option>
                  <option value="admin">מנהל</option>
                </select>
              </label>
              <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                יצירת קישור הזמנה
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
                        {inv.email || "הזמנה פתוחה"} ·{" "}
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
                        ביטול
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <p className="mt-3 text-xs text-slate-400">
          שתפו קישור הזמנה עם חבר צוות. הוא יתחבר ויצטרף לארגון זה עם התפקיד
          שבחרתם.
        </p>
      </section>
    </div>
  );
}
