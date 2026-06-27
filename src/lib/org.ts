import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, OrgRole } from "@/lib/types";

export interface OrgContext {
  userId: string;
  organization: Organization;
  role: OrgRole;
}

// Resolves the signed-in user's active organization. For the MVP a user works
// within their first organization; multi-org switching can layer on later.
// Redirects to /login if unauthenticated, /onboarding if the user has no org.
export async function getOrgContext(): Promise<OrgContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.organization) {
    redirect("/onboarding");
  }

  return {
    userId: user.id,
    organization: membership.organization as unknown as Organization,
    role: membership.role as OrgRole,
  };
}
