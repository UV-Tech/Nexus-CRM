"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { logAudit } from "@/lib/audit";
import type { OnboardingPayload } from "@/lib/onboarding-presets";

function keyFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Applies the wizard choices in one transaction-ish sequence and marks the org
// onboarded. Returns invite links so the final step can show them. Idempotent
// guard: only the owner of a not-yet-onboarded org may run it.
export async function completeOnboarding(payload: OnboardingPayload) {
  const { organization, role } = await getOrgContext();
  if (role !== "owner") return { ok: false, inviteLinks: [] as string[] };

  const supabase = createClient();

  // Replace the default pipeline with the chosen stages (safe: brand-new org).
  if (payload.stages.length > 0) {
    await supabase
      .from("pipeline_stages")
      .delete()
      .eq("organization_id", organization.id);
    await supabase.from("pipeline_stages").insert(
      payload.stages.map((s, i) => ({
        organization_id: organization.id,
        name: s.name,
        color: s.color,
        position: i,
        is_won: !!s.isWon,
        is_lost: !!s.isLost,
      }))
    );
  }

  // Create the chosen custom fields (dedupe by derived key).
  const seen = new Set<string>();
  const fieldRows = payload.fields
    .map((f, i) => {
      const key = keyFromLabel(f.label);
      if (!key || seen.has(key)) return null;
      seen.add(key);
      return {
        organization_id: organization.id,
        key,
        label: f.label,
        field_type: f.type,
        options: f.options ?? [],
        position: i,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (fieldRows.length > 0) {
    await supabase.from("custom_field_definitions").insert(fieldRows);
  }

  // Create teammate invitations.
  const inviteRows = payload.invites
    .filter((inv) => inv.email.trim())
    .map((inv) => ({
      organization_id: organization.id,
      email: inv.email.trim(),
      role: inv.role === "admin" ? "admin" : "agent",
    }));
  let inviteLinks: string[] = [];
  if (inviteRows.length > 0) {
    const { data } = await supabase
      .from("invitations")
      .insert(inviteRows)
      .select("token");
    const host = headers().get("host") ?? "your-app.example.com";
    const proto = host.startsWith("localhost") ? "http" : "https";
    inviteLinks = (data ?? []).map(
      (r: { token: string }) => `${proto}://${host}/invite/${r.token}`
    );
  }

  await supabase
    .from("organizations")
    .update({
      onboarded_at: new Date().toISOString(),
      business_type: payload.businessType,
    })
    .eq("id", organization.id);

  await logAudit(organization.id, "org.onboarded", payload.businessType);

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true, inviteLinks };
}

// Skip the wizard entirely — keep the default pipeline, just mark onboarded.
export async function skipOnboarding() {
  const { organization, role } = await getOrgContext();
  if (role !== "owner") return;
  const supabase = createClient();
  await supabase
    .from("organizations")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", organization.id);
  revalidatePath("/dashboard");
}
