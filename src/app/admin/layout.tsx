import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/org";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isPlatformAdmin())) redirect("/no-access");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-lg font-bold text-slate-900">
            Nexus <span className="text-brand-600">CRM</span>
          </Link>
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
            Platform admin
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
            App view
          </Link>
          <form action={signOut}>
            <button className="text-slate-600 hover:text-slate-900">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
