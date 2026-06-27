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

export async function regenerateIntakeToken() {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  // gen_random_uuid() lives in the DB; generate via an update returning a fresh
  // value by calling the SQL default through an RPC-free approach: set to a new
  // uuid produced by Postgres.
  await supabase.rpc("regenerate_intake_token", { org: organization.id });

  revalidatePath("/settings");
}
