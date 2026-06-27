import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { signOut } from "@/app/login/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organization, role } = await getOrgContext();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-lg font-bold text-slate-900">
            Nexus <span className="text-brand-600">CRM</span>
          </p>
          <p className="mt-1 truncate text-sm text-slate-500">
            {organization.name}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <p className="px-3 pb-2 text-xs uppercase tracking-wide text-slate-400">
            {role}
          </p>
          <form action={signOut}>
            <button className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden bg-slate-50">{children}</main>
    </div>
  );
}
