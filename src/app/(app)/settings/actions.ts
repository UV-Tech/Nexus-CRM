"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";

export async function addStage(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#6366f1");
  if (!name) return;

  const { data: last } = await supabase
    .from("pipeline_stages")
    .select("position")
    .eq("organization_id", organization.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("pipeline_stages").insert({
    organization_id: organization.id,
    name,
    color,
    position: (last?.position ?? -1) + 1,
  });

  revalidatePath("/settings");
  revalidatePath("/pipeline");
}

export async function deleteStage(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const id = String(formData.get("stage_id"));

  await supabase
    .from("pipeline_stages")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization.id);

  revalidatePath("/settings");
  revalidatePath("/pipeline");
}

export async function addCustomField(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const label = String(formData.get("label") || "").trim();
  const fieldType = String(formData.get("field_type") || "text");
  if (!label) return;

  // Derive a stable machine key from the label.
  const key = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!key) return;

  const options = String(formData.get("options") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { data: last } = await supabase
    .from("custom_field_definitions")
    .select("position")
    .eq("organization_id", organization.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("custom_field_definitions").insert({
    organization_id: organization.id,
    key,
    label,
    field_type: fieldType,
    options,
    position: (last?.position ?? -1) + 1,
  });

  revalidatePath("/settings");
  revalidatePath("/leads");
}

export async function deleteCustomField(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const id = String(formData.get("field_id"));

  await supabase
    .from("custom_field_definitions")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization.id);

  revalidatePath("/settings");
  revalidatePath("/leads");
}

export async function createInvitation(formData: FormData) {
  const { organization, userId } = await getOrgContext();
  const supabase = createClient();

  const email = String(formData.get("email") || "").trim() || null;
  const role = String(formData.get("role") || "agent");

  await supabase.from("invitations").insert({
    organization_id: organization.id,
    email,
    role,
    invited_by: userId,
  });

  revalidatePath("/settings");
}

export async function deleteInvitation(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const id = String(formData.get("invitation_id"));

  await supabase
    .from("invitations")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization.id);

  revalidatePath("/settings");
}

export async function regenerateIntakeToken() {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  // gen_random_uuid() lives in the DB; generate via an update returning a fresh
  // value by calling the SQL default through an RPC-free approach: set to a new
  // uuid produced by Postgres.
  await supabase.rpc("regenerate_intake_token", { org: organization.id });

  revalidatePath("/settings");
}
