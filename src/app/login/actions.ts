"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Only allow internal relative paths as a post-login destination.
function safeNext(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = safeNext(String(formData.get("next") || "/dashboard"));

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`
    );
  }
  redirect(next);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "");
  const orgName = String(formData.get("org_name") || "");
  const next = safeNext(String(formData.get("next") || "/dashboard"));

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is disabled, we have a session now.
  if (data.session) {
    // Arriving via an invite link: join that org instead of creating a new one.
    if (next !== "/dashboard") {
      redirect(next);
    }
    const { error: rpcError } = await supabase.rpc("create_organization", {
      org_name: orgName || `${fullName || email}'s workspace`,
    });
    if (rpcError) {
      redirect(`/login?mode=signup&error=${encodeURIComponent(rpcError.message)}`);
    }
    redirect("/dashboard");
  }

  // Otherwise the user must confirm their email first.
  redirect("/login?confirm=1");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
