import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getOrgContext } from "@/lib/org";
import { PROVIDER_BY_KEY } from "@/lib/integrations/providers";
import { GUIDES, type DynamicValueKey } from "@/lib/integrations/guides";
import { IntegrationGuide } from "@/components/IntegrationGuide";

export const dynamic = "force-dynamic";

export default async function IntegrationGuidePage({
  params,
}: {
  params: { provider: string };
}) {
  const spec = PROVIDER_BY_KEY[params.provider];
  const guide = GUIDES[params.provider];
  if (!spec || !guide) notFound();

  const { organization } = await getOrgContext();

  const host = headers().get("host") ?? "your-app.example.com";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const origin = `${proto}://${host}`;
  const token = organization.intake_token;

  const values: Record<DynamicValueKey, string> = {
    leadsWebhook: `${origin}/api/webhooks/leads?token=${token}`,
    whatsappWebhook: `${origin}/api/webhooks/whatsapp?token=${token}`,
    // A convenient suggested verify token (the org token works fine).
    verifyToken: `nexus-${token.slice(0, 12)}`,
    connectUrl: `/integrations/${spec.key}`,
  };

  return (
    <div className="p-8">
      <Link
        href="/integrations"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Integrations
      </Link>
      <div className="mt-4">
        <IntegrationGuide
          providerKey={spec.key}
          providerName={spec.name}
          emoji={spec.emoji}
          guide={guide}
          values={values}
        />
      </div>
    </div>
  );
}
