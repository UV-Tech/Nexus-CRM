import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { PROVIDERS } from "@/lib/integrations/providers";
import { disconnectProvider } from "./actions";

export const dynamic = "force-dynamic";

interface IntegrationRow {
  provider: string;
  status: string;
  account_label: string | null;
  connected_at: string | null;
}

export default async function IntegrationsPage() {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const { data } = await supabase
    .from("integrations")
    .select("provider, status, account_label, connected_at")
    .eq("organization_id", organization.id);

  const byProvider = new Map(
    ((data ?? []) as IntegrationRow[]).map((r) => [r.provider, r])
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
      <p className="mt-1 text-sm text-slate-500">
        Connect your tools so leads, messages and ad data flow into the CRM.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROVIDERS.map((p) => {
          const row = byProvider.get(p.key);
          const connected = row?.status === "connected";
          return (
            <div
              key={p.key}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.emoji}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="text-sm text-slate-500">{p.blurb}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    connected
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {connected ? "Connected" : "Not connected"}
                </span>
              </div>

              <ul className="mt-4 flex flex-wrap gap-1.5">
                {p.capabilities.map((c) => (
                  <li
                    key={c}
                    className="rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                  >
                    {c}
                  </li>
                ))}
              </ul>

              {connected && row?.account_label && (
                <p className="mt-3 text-xs text-slate-400">
                  Account: {row.account_label}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                {connected ? (
                  <>
                    {p.href && (
                      <Link
                        href={p.href}
                        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                      >
                        Open
                      </Link>
                    )}
                    <Link
                      href={`/integrations/${p.key}`}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Settings
                    </Link>
                    <form action={disconnectProvider}>
                      <input type="hidden" name="provider" value={p.key} />
                      <button className="text-sm text-slate-400 hover:text-red-600">
                        Disconnect
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href={`/integrations/${p.key}`}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Connect
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
