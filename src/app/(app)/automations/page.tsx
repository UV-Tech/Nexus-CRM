import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { AutomationAIBuilder } from "@/components/AutomationAIBuilder";
import {
  createAutomation,
  createFolder,
  deleteAutomation,
  deleteFolder,
  toggleAutomation,
} from "./actions";
import type { Automation, AutomationFolder } from "@/lib/automations/types";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const [{ data: folders }, { data: automations }] = await Promise.all([
    supabase
      .from("automation_folders")
      .select("*")
      .eq("organization_id", organization.id)
      .order("position"),
    supabase
      .from("automations")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
  ]);

  const allFolders = (folders ?? []) as AutomationFolder[];
  const allAutomations = (automations ?? []) as Automation[];

  const groups: { folder: AutomationFolder | null; items: Automation[] }[] = [
    ...allFolders.map((f) => ({
      folder: f,
      items: allAutomations.filter((a) => a.folder_id === f.id),
    })),
    {
      folder: null,
      items: allAutomations.filter((a) => !a.folder_id),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Build flows that run when leads come in or change. Organize them in
            folders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AutomationAIBuilder />
          <form action={createAutomation}>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              + New automation
            </button>
          </form>
        </div>
      </div>

      {/* Create folder */}
      <form action={createFolder} className="mt-6 flex items-end gap-2">
        <input
          name="name"
          placeholder="New folder name"
          className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          + Folder
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group, gi) => (
          <section key={group.folder?.id ?? "none"}>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {group.folder ? `📁 ${group.folder.name}` : "Ungrouped"}
                <span className="text-slate-400">({group.items.length})</span>
              </h2>
              {group.folder && (
                <form action={deleteFolder}>
                  <input type="hidden" name="folder_id" value={group.folder.id} />
                  <button className="text-xs text-slate-400 hover:text-red-600">
                    Delete folder
                  </button>
                </form>
              )}
            </div>

            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {group.items.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0"
                >
                  <div>
                    <Link
                      href={`/automations/${a.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {a.name}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {(a.graph?.nodes?.length ?? 0)} steps
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <form action={toggleAutomation}>
                      <input type="hidden" name="automation_id" value={a.id} />
                      <input
                        type="hidden"
                        name="enabled"
                        value={a.enabled ? "false" : "true"}
                      />
                      <button
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          a.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {a.enabled ? "On" : "Off"}
                      </button>
                    </form>
                    <Link
                      href={`/automations/${a.id}`}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </Link>
                    <form action={deleteAutomation}>
                      <input type="hidden" name="automation_id" value={a.id} />
                      <button className="text-xs text-slate-300 hover:text-red-600">
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {group.items.length === 0 && (
                <p className="px-5 py-6 text-center text-sm text-slate-400">
                  No automations here yet.
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
