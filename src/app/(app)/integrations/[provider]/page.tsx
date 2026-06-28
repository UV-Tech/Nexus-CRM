import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { PROVIDER_BY_KEY } from "@/lib/integrations/providers";
import { connectProvider } from "../actions";

export const dynamic = "force-dynamic";

export default async function ConnectProviderPage({
  params,
}: {
  params: { provider: string };
}) {
  const spec = PROVIDER_BY_KEY[params.provider];
  if (!spec) notFound();

  const { organization } = await getOrgContext();
  const supabase = createClient();
  const { data: row } = await supabase
    .from("integrations")
    .select("status, account_label, config, connected_at")
    .eq("organization_id", organization.id)
    .eq("provider", spec.key)
    .maybeSingle();

  const config = (row?.config ?? {}) as Record<string, string>;
  const oauthConfigured = spec.oauthEnv ? !!process.env[spec.oauthEnv] : false;

  return (
    <div className="p-8">
      <Link
        href="/integrations"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Integrations
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl">{spec.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{spec.name}</h1>
          <p className="text-sm text-slate-500">{spec.blurb}</p>
        </div>
      </div>

      <Link
        href={`/integrations/${spec.key}/guide`}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
      >
        📖 Not sure where to find these? Open the step-by-step guide →
      </Link>

      <div className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        {oauthConfigured ? (
          <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            One-click OAuth is configured for this provider. (Connecting via the
            vendor&apos;s consent screen.)
          </p>
        ) : (
          <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            One-click OAuth isn&apos;t configured yet (needs a registered{" "}
            {spec.name} app + approval). For now, paste credentials below to
            connect manually — everything else works the same.
          </p>
        )}

        <form action={connectProvider} className="flex flex-col gap-4">
          <input type="hidden" name="provider" value={spec.key} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">
              Account label (optional)
            </span>
            <input
              name="account_label"
              defaultValue={row?.account_label ?? ""}
              placeholder="e.g. Acme main account"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          {spec.credentials.map((field) => (
            <label key={field.key} className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">{field.label}</span>
              <input
                name={field.key}
                type={field.secret ? "password" : "text"}
                defaultValue={config[field.key] ?? ""}
                placeholder={field.placeholder}
                className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </label>
          ))}

          <button className="self-start rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">
            {row?.status === "connected" ? "Update connection" : "Connect"}
          </button>
        </form>
      </div>

      {spec.key === "whatsapp" && (
        <p className="mt-4 text-sm text-slate-500">
          After connecting, open the{" "}
          <Link href="/inbox" className="text-brand-600">
            WhatsApp inbox
          </Link>{" "}
          to message your leads.
        </p>
      )}
    </div>
  );
}
