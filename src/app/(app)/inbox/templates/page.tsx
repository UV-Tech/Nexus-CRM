import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { createTemplate, deleteTemplate } from "../actions";

export const dynamic = "force-dynamic";

interface Template {
  id: string;
  name: string;
  category: string;
  body: string;
}

export default async function TemplatesPage() {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const { data } = await supabase
    .from("message_templates")
    .select("id, name, category, body")
    .eq("organization_id", organization.id)
    .order("category")
    .order("name");
  const templates = (data ?? []) as Template[];

  return (
    <div className="p-8">
      <Link href="/inbox" className="text-sm text-slate-500 hover:text-slate-800">
        ← Inbox
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Message templates</h1>
      <p className="mt-1 text-sm text-slate-500">
        Reusable replies your team can insert with one click in the inbox.
      </p>

      <form
        action={createTemplate}
        className="mt-6 grid max-w-2xl grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Name</span>
          <input
            name="name"
            required
            placeholder="e.g. Welcome"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Category</span>
          <input
            name="category"
            defaultValue="general"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Message</span>
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Hi {name}, thanks for reaching out! How can we help?"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="sm:col-span-2">
          <button className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">
            Add template
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-col gap-2">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="font-medium text-slate-900">
                {t.name}{" "}
                <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {t.category}
                </span>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                {t.body}
              </p>
            </div>
            <form action={deleteTemplate}>
              <input type="hidden" name="template_id" value={t.id} />
              <button className="text-sm text-slate-300 hover:text-red-600">
                ✕
              </button>
            </form>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-slate-400">No templates yet.</p>
        )}
      </div>
    </div>
  );
}
