"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { collectCustomData, getCustomFields } from "@/lib/custom-fields";

export async function createLead(formData: FormData) {
  const { organization, userId } = await getOrgContext();
  const supabase = createClient();

  const stageId = String(formData.get("stage_id") || "") || null;
  const fields = await getCustomFields(organization.id);

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      organization_id: organization.id,
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      company: String(formData.get("company") || "").trim() || null,
      source: String(formData.get("source") || "manual"),
      value: Number(formData.get("value") || 0),
      notes: String(formData.get("notes") || "").trim() || null,
      stage_id: stageId,
      assigned_to: userId,
      custom_data: collectCustomData(formData, fields),
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/leads?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("lead_activities").insert({
    organization_id: organization.id,
    lead_id: lead!.id,
    author_id: userId,
    type: "created",
    body: "Lead created",
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  redirect(`/leads/${lead!.id}`);
}

export async function updateLeadStage(leadId: string, stageId: string) {
  const { organization, userId } = await getOrgContext();
  const supabase = createClient();

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("name")
    .eq("id", stageId)
    .single();

  const { error } = await supabase
    .from("leads")
    .update({ stage_id: stageId })
    .eq("id", leadId)
    .eq("organization_id", organization.id);

  if (!error) {
    await supabase.from("lead_activities").insert({
      organization_id: organization.id,
      lead_id: leadId,
      author_id: userId,
      type: "stage_change",
      body: `Moved to ${stage?.name ?? "a new stage"}`,
    });
  }

  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
}

export async function moveLeadStage(formData: FormData) {
  const leadId = String(formData.get("lead_id"));
  const stageId = String(formData.get("stage_id"));
  await updateLeadStage(leadId, stageId);
}

export async function addActivity(formData: FormData) {
  const { organization, userId } = await getOrgContext();
  const supabase = createClient();

  const leadId = String(formData.get("lead_id"));
  const body = String(formData.get("body") || "").trim();
  const type = String(formData.get("type") || "note");

  if (body) {
    await supabase.from("lead_activities").insert({
      organization_id: organization.id,
      lead_id: leadId,
      author_id: userId,
      type,
      body,
    });
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function updateLead(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const leadId = String(formData.get("lead_id"));
  const fields = await getCustomFields(organization.id);

  const { error } = await supabase
    .from("leads")
    .update({
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      company: String(formData.get("company") || "").trim() || null,
      value: Number(formData.get("value") || 0),
      notes: String(formData.get("notes") || "").trim() || null,
      custom_data: collectCustomData(formData, fields),
    })
    .eq("id", leadId)
    .eq("organization_id", organization.id);

  if (error) {
    redirect(`/leads/${leadId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}`);
}

export async function assignLead(formData: FormData) {
  const { organization, userId } = await getOrgContext();
  const supabase = createClient();
  const leadId = String(formData.get("lead_id"));
  const assignee = String(formData.get("assigned_to") || "") || null;

  const { error } = await supabase
    .from("leads")
    .update({ assigned_to: assignee })
    .eq("id", leadId)
    .eq("organization_id", organization.id);

  if (!error) {
    await supabase.from("lead_activities").insert({
      organization_id: organization.id,
      lead_id: leadId,
      author_id: userId,
      type: "assigned",
      body: assignee ? "Lead reassigned" : "Lead unassigned",
    });
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLead(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const leadId = String(formData.get("lead_id"));

  await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("organization_id", organization.id);

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  redirect("/leads");
}
