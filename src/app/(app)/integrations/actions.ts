"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { logAudit } from "@/lib/audit";
import { PROVIDER_BY_KEY } from "@/lib/integrations/providers";

export async function connectProvider(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const provider = String(formData.get("provider") || "");
  const spec = PROVIDER_BY_KEY[provider];
  if (!spec) redirect("/integrations");

  // Collect the provider's credential fields from the form into config.
  const config: Record<string, string> = {};
  for (const field of spec.credentials) {
    const v = String(formData.get(field.key) || "").trim();
    if (v) config[field.key] = v;
  }
  const accountLabel = String(formData.get("account_label") || "").trim() || null;

  await supabase
    .from("integrations")
    .upsert(
      {
        organization_id: organization.id,
        provider,
        status: "connected",
        account_label: accountLabel,
        config,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,provider" }
    );

  await logAudit(organization.id, "integration.connect", provider);
  revalidatePath("/integrations");
  redirect("/integrations");
}

export async function disconnectProvider(formData: FormData) {
  const { organization } = await getOrgContext();
  const supabase = createClient();
  const provider = String(formData.get("provider") || "");

  await supabase
    .from("integrations")
    .update({ status: "disconnected", connected_at: null })
    .eq("organization_id", organization.id)
    .eq("provider", provider);

  await logAudit(organization.id, "integration.disconnect", provider);
  revalidatePath("/integrations");
  redirect("/integrations");
}
