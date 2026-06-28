"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_COOKIE } from "@/lib/org";
import { logAudit } from "@/lib/audit";

// Provision a new business: org + starter pipeline + owner invitation.
export async function createBusiness(formData: FormData) {
  const supabase = createClient();
  const name = String(formData.get("name") || "").trim();
  const ownerEmail = String(formData.get("owner_email") || "").trim();
  if (!name) redirect("/admin?error=" + encodeURIComponent("Name required"));

  const { data, error } = await supabase.rpc("admin_create_business", {
    org_name: name,
    owner_email: ownerEmail,
  });

  if (error) {
    redirect("/admin?error=" + encodeURIComponent(error.message));
  }

  const row = Array.isArray(data) ? data[0] : data;
  await logAudit(row?.organization_id ?? null, "admin.create_business", name);
  revalidatePath("/admin");
  // Surface the invite token so the admin can copy the link.
  redirect(`/admin?created=${row?.organization_id}&token=${row?.invite_token}`);
}

// Open a business in the app view (full-access for platform admins).
export async function openBusiness(formData: FormData) {
  const orgId = String(formData.get("org_id") || "");
  if (orgId) {
    cookies().set(ACTIVE_ORG_COOKIE, orgId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    // Record that the platform admin accessed this tenant's workspace.
    await logAudit(orgId, "admin.open_business");
  }
  redirect("/dashboard");
}

export async function setSuspended(formData: FormData) {
  const supabase = createClient();
  const orgId = String(formData.get("org_id") || "");
  const suspend = String(formData.get("suspend") || "") === "true";

  const { error } = await supabase.rpc("admin_set_suspended", {
    org: orgId,
    suspend,
  });
  if (error) {
    redirect("/admin?error=" + encodeURIComponent(error.message));
  }
  await logAudit(orgId, suspend ? "admin.suspend" : "admin.reactivate");
  revalidatePath("/admin");
  redirect("/admin");
}
