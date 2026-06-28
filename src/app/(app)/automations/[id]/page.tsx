import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { AutomationEditor } from "@/components/AutomationEditor";
import type { Automation } from "@/lib/automations/types";

export const dynamic = "force-dynamic";

export default async function AutomationEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const { data: automation } = await supabase
    .from("automations")
    .select("*")
    .eq("id", params.id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!automation) notFound();

  const [{ data: stages }, { data: members }, { data: fields }] =
    await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("id, name")
        .eq("organization_id", organization.id)
        .order("position"),
      supabase
        .from("organization_members")
        .select("user_id, profiles(full_name)")
        .eq("organization_id", organization.id),
      supabase
        .from("custom_field_definitions")
        .select("key, label")
        .eq("organization_id", organization.id)
        .order("position"),
    ]);

  const options = {
    stages: (stages ?? []).map((s) => ({ id: s.id, name: s.name })),
    members: (members ?? []).map((m) => ({
      id: m.user_id,
      name:
        (m.profiles as unknown as { full_name: string | null } | null)
          ?.full_name ?? "חבר",
    })),
    fields: (fields ?? []).map((f) => ({ key: f.key, label: f.label })),
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <Link
          href="/automations"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← אוטומציות
        </Link>
      </div>
      <AutomationEditor
        automation={automation as Automation}
        options={options}
      />
    </div>
  );
}
