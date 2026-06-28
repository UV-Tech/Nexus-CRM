"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_ORG_COOKIE } from "@/lib/org";

// Switches the active organization for the current user (cookie-based).
export async function switchOrg(formData: FormData) {
  const orgId = String(formData.get("org_id") || "");
  if (orgId) {
    cookies().set(ACTIVE_ORG_COOKIE, orgId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  redirect("/dashboard");
}
