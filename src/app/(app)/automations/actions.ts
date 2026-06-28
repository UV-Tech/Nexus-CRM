"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { logAudit } from "@/lib/audit";
import type { AutomationGraph } from "@/lib/automations/types";

export async function createFolder(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const { data: last } = await supabase
    .from("automation_folders")
    .select("position")
    .eq("organization_id", organization.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("automation_folders").insert({
    organization_id: organization.id,
    name,
    position: (last?.position ?? -1) + 1,
  });
  revalidatePath("/automations");
}

export async function deleteFolder(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  await supabase
    .from("automation_folders")
    .delete()
    .eq("id", String(formData.get("folder_id")))
    .eq("organization_id", organization.id);
  revalidatePath("/automations");
}

export async function createAutomation(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const name = String(formData.get("name") || "New automation").trim();
  const folderId = String(formData.get("folder_id") || "") || null;

  const { data, error } = await supabase
    .from("automations")
    .insert({ organization_id: organization.id, name, folder_id: folderId })
    .select("id")
    .single();

  if (error) redirect("/automations?error=" + encodeURIComponent(error.message));
  redirect(`/automations/${data!.id}`);
}

// Create an automation from a pre-built graph (used by the AI builder).
export async function createAutomationFromGraph(
  name: string,
  graph: AutomationGraph,
  folderId?: string | null
) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("automations")
    .insert({
      organization_id: organization.id,
      name,
      folder_id: folderId ?? null,
      graph,
    })
    .select("id")
    .single();
  if (error) return { ok: false as const, id: null };
  await logAudit(organization.id, "automation.create_ai", name);
  return { ok: true as const, id: data!.id as string };
}

export async function saveAutomation(
  id: string,
  name: string,
  graph: AutomationGraph
) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  await supabase
    .from("automations")
    .update({ name, graph })
    .eq("id", id)
    .eq("organization_id", organization.id);
  revalidatePath(`/automations/${id}`);
  revalidatePath("/automations");
  return { ok: true };
}

export async function toggleAutomation(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const id = String(formData.get("automation_id"));
  const enabled = String(formData.get("enabled")) === "true";
  await supabase
    .from("automations")
    .update({ enabled })
    .eq("id", id)
    .eq("organization_id", organization.id);
  await logAudit(organization.id, enabled ? "automation.enable" : "automation.disable", id);
  revalidatePath("/automations");
}

export async function deleteAutomation(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  await supabase
    .from("automations")
    .delete()
    .eq("id", String(formData.get("automation_id")))
    .eq("organization_id", organization.id);
  revalidatePath("/automations");
  redirect("/automations");
}
