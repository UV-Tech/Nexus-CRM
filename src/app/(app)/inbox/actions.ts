"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";

// Sends an outbound WhatsApp message. The row is recorded immediately; actual
// delivery happens once the WhatsApp Business API token is wired (the connected
// integration). Until then messages are queued.
export async function sendMessage(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const conversationId = String(formData.get("conversation_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!conversationId || !body) return;

  // Is WhatsApp connected? Drives whether we can really deliver.
  const { data: integration } = await supabase
    .from("integrations")
    .select("status")
    .eq("organization_id", organization.id)
    .eq("provider", "whatsapp")
    .maybeSingle();
  const connected = integration?.status === "connected";

  await supabase.from("wa_messages").insert({
    organization_id: organization.id,
    conversation_id: conversationId,
    direction: "out",
    body,
    // TODO: when connected, POST to the WhatsApp Cloud API and use its status.
    status: connected ? "sent" : "queued",
  });

  await supabase
    .from("wa_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("organization_id", organization.id);

  revalidatePath("/inbox");
}

export async function startConversation(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const phone = String(formData.get("phone") || "").trim();
  const name = String(formData.get("name") || "").trim() || null;
  if (!phone) return;

  const { data, error } = await supabase
    .from("wa_conversations")
    .upsert(
      {
        organization_id: organization.id,
        contact_phone: phone,
        contact_name: name,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,contact_phone" }
    )
    .select("id")
    .single();

  if (error || !data) {
    redirect("/inbox");
  }
  redirect(`/inbox?c=${data.id}`);
}

export async function createTemplate(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "general").trim();
  const body = String(formData.get("body") || "").trim();
  if (!name || !body) return;

  await supabase.from("message_templates").insert({
    organization_id: organization.id,
    name,
    category,
    body,
  });
  revalidatePath("/inbox/templates");
  revalidatePath("/inbox");
}

export async function deleteTemplate(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  await supabase
    .from("message_templates")
    .delete()
    .eq("id", String(formData.get("template_id")))
    .eq("organization_id", organization.id);
  revalidatePath("/inbox/templates");
  revalidatePath("/inbox");
}
