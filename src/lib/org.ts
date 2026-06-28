import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, OrgRole } from "@/lib/types";

export const ACTIVE_ORG_COOKIE = "active_org";

export interface OrgContext {
  userId: string;
  organization: Organization;
  role: OrgRole;
  isPlatformAdmin: boolean;
}

export interface UserOrg {
  organization: Organization;
  role: OrgRole;
}

export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase.rpc("is_platform_admin");
  return data === true;
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

// Resolves the user's active organization.
// - Members use their membership role for their orgs.
// - Platform admins can open ANY organization (full access, role 'owner').
// Routing: no org + admin -> /admin; no org + not admin -> /no-access.
export async function getOrgContext(): Promise<OrgContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = await isPlatformAdmin();
  const orgs = await getUserOrganizations();
  const activeId = cookies().get(ACTIVE_ORG_COOKIE)?.value;

  // Prefer the active-org cookie when it points at a membership.
  const membership = activeId
    ? orgs.find((o) => o.organization.id === activeId)
    : undefined;

  if (membership) {
    if (membership.organization.suspended_at && !admin) redirect("/suspended");
    return {
      userId: user.id,
      organization: membership.organization,
      role: membership.role,
      isPlatformAdmin: admin,
    };
  }

  // Platform admin viewing an org they are not a member of.
  if (admin && activeId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", activeId)
      .maybeSingle();
    if (org) {
      return {
        userId: user.id,
        organization: org as Organization,
        role: "owner",
        isPlatformAdmin: true,
      };
    }
  }

  // No active org: fall back to first membership, else route by role.
  if (orgs.length > 0) {
    if (orgs[0].organization.suspended_at && !admin) redirect("/suspended");
    return {
      userId: user.id,
      organization: orgs[0].organization,
      role: orgs[0].role,
      isPlatformAdmin: admin,
    };
  }

  redirect(admin ? "/admin" : "/no-access");
}
