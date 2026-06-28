import { createClient } from "@/lib/supabase/server";

// Append an entry to the org's audit log. Best-effort: never throws so it can
// be called from any action without risking the main operation.
export async function logAudit(
  organizationId: string | null,
  action: string,
  detail?: string
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("audit_log").insert({
      organization_id: organizationId,
      actor_id: user?.id ?? null,
      action,
      detail: detail ?? null,
    });
  } catch {
    // Swallow — auditing must not break the user-facing action.
  }
}
