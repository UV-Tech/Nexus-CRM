"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "");
  const orgName = String(formData.get("org_name") || "");

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is disabled, we have a session now and can provision
  // the organization immediately.
  if (data.session) {
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
