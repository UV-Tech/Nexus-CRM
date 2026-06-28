import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, OrgRole } from "@/lib/types";

export const ACTIVE_ORG_COOKIE = "active_org";

export interface OrgContext {
  userId: string;
  organization: Organization;
  role: OrgRole;
}

export interface UserOrg {
  organization: Organization;
  role: OrgRole;
}

// All organizations the signed-in user belongs to, oldest first.
export async function getUserOrganizations(): Promise<UserOrg[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (data ?? [])
    .filter((m) => m.organization)
    .map((m) => ({
      organization: m.organization as unknown as Organization,
      role: m.role as OrgRole,
    }));
}

// Resolves the user's active organization. Honors the active-org cookie when it
// points at an org the user still belongs to; otherwise falls back to the first.
export async function getOrgContext(): Promise<OrgContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgs = await getUserOrganizations();
  if (orgs.length === 0) redirect("/onboarding");

  const activeId = cookies().get(ACTIVE_ORG_COOKIE)?.value;
  const active =
    orgs.find((o) => o.organization.id === activeId) ?? orgs[0];

  return {
    userId: user.id,
    organization: active.organization,
    role: active.role,
  };
}
