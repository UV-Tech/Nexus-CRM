import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createBusiness, openBusiness, setSuspended } from "./actions";

export const dynamic = "force-dynamic";

interface OrgStat {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  suspended: boolean;
  member_count: number;
  lead_count: number;
  pending_invites: number;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string; created?: string; token?: string };
}) {
  const supabase = createClient();
  const { data: stats } = await supabase.rpc("admin_org_stats");
  const orgs = (stats ?? []) as OrgStat[];

  const host = headers().get("host") ?? "your-app.example.com";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const inviteLink = searchParams.token
    ? `${proto}://${host}/invite/${searchParams.token}`
    : null;

  const totalLeads = orgs.reduce((s, o) => s + Number(o.lead_count), 0);
  const totalMembers = orgs.reduce((s, o) => s + Number(o.member_count), 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">עסקים</h1>
      <p className="mt-1 text-sm text-slate-500">
        הקמה וניהול של כל עסק בפלטפורמה.
      </p>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      {inviteLink && (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium">העסק נוצר. שלחו את קישור ההזמנה הזה לבעלים:</p>
          <p className="mt-1 break-all font-mono text-xs">{inviteLink}</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="עסקים" value={String(orgs.length)} />
        <Stat label="סך כל חברי הצוות" value={String(totalMembers)} />
        <Stat label="סך כל הלידים" value={String(totalLeads)} />
      </div>

      {/* Create business */}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">הוספת עסק</h2>
        <form
          action={createBusiness}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">שם העסק</span>
            <input
              name="name"
              required
              placeholder="חברת ישראל בע״מ"
              className="w-56 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">אימייל הבעלים (אופציונלי)</span>
            <input
              name="owner_email"
              type="email"
              placeholder="owner@acme.com"
              className="w-56 rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            יצירה והפקת הזמנה
          </button>
        </form>
      </section>

      {/* Businesses list */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">עסק</th>
              <th className="px-5 py-3 text-right">חברי צוות</th>
              <th className="px-5 py-3 text-right">לידים</th>
              <th className="px-5 py-3 text-right">הזמנות ממתינות</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900">
                    {o.name}
                    {o.suspended && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        מושהה
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{o.slug}</p>
                </td>
                <td className="px-5 py-3 text-right text-slate-700">
                  {o.member_count}
                </td>
                <td className="px-5 py-3 text-right text-slate-700">
                  {o.lead_count}
                </td>
                <td className="px-5 py-3 text-right text-slate-700">
                  {o.pending_invites}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <form action={openBusiness}>
                      <input type="hidden" name="org_id" value={o.id} />
                      <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                        פתיחה
                      </button>
                    </form>
                    <form action={setSuspended}>
                      <input type="hidden" name="org_id" value={o.id} />
                      <input
                        type="hidden"
                        name="suspend"
                        value={o.suspended ? "false" : "true"}
                      />
                      <button
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                          o.suspended
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        {o.suspended ? "הפעלה מחדש" : "השהיה"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                  אין עדיין עסקים. צרו את הראשון למעלה.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
