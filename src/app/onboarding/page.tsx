import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function createOrg(formData: FormData) {
  "use server";
  const orgName = String(formData.get("org_name") || "");
  const supabase = createClient();
  const { error } = await supabase.rpc("create_organization", {
    org_name: orgName,
  });
  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already has an org? Go straight to the app.
  const { data: existing } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Name your organization
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          This is the workspace your team will manage leads in.
        </p>
        {searchParams.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}
        <form action={createOrg} className="mt-6 flex flex-col gap-4">
          <input
            name="org_name"
            type="text"
            required
            placeholder="Acme Inc."
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
          >
            Create workspace
          </button>
        </form>
      </div>
    </main>
  );
}
