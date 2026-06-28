import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "./actions";

export const dynamic = "force-dynamic";

interface Preview {
  organization_name: string;
  role: string;
  accepted: boolean;
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: previewRows } = await supabase.rpc("invitation_preview", {
    invite_token: params.token,
  });
  const preview = (previewRows?.[0] ?? null) as Preview | null;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          You&apos;re invited
        </h1>

        {!preview ? (
          <p className="mt-4 text-sm text-red-600">
            This invitation is invalid or has expired.
          </p>
        ) : preview.accepted ? (
          <p className="mt-4 text-sm text-slate-600">
            This invitation has already been used.
          </p>
        ) : (
          <>
            <p className="mt-4 text-slate-600">
              Join <strong>{preview.organization_name}</strong> as{" "}
              <strong>{preview.role}</strong>.
            </p>

            {searchParams.error && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {searchParams.error}
              </p>
            )}

            {user ? (
              <form action={acceptInvite} className="mt-6">
                <input type="hidden" name="token" value={params.token} />
                <button className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700">
                  Accept invitation
                </button>
              </form>
            ) : (
              <div className="mt-6">
                <p className="text-sm text-slate-500">
                  Sign in or create an account to accept.
                </p>
                <Link
                  href={`/login?next=/invite/${params.token}`}
                  className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
                >
                  Continue
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
