"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_COOKIE } from "@/lib/org";

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") || "");
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/invite/${token}`);

  const { data: orgId, error } = await supabase.rpc("accept_invitation", {
    invite_token: token,
  });

  if (error) {
    redirect(`/invite/${token}?error=${encodeURIComponent(error.message)}`);
  }

  // Make the newly-joined org the active one.
  if (orgId) {
    cookies().set(ACTIVE_ORG_COOKIE, String(orgId), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // Owners of a fresh workspace land in the setup wizard; /welcome forwards
  // everyone else straight to the dashboard.
  redirect("/welcome");
}
