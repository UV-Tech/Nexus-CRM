import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { runAutomations } from "@/lib/automations/engine";

// Verifies an optional HMAC-SHA256 signature (hex, optionally "sha256=" prefixed)
// of the raw body against the org's webhook secret. Returns true if no signature
// header was sent (signing is opt-in per sender) or if it matches.
function signatureValid(
  rawBody: string,
  header: string | null,
  secret: string
): boolean {
  if (!header) return true; // sender chose not to sign
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

// Inbound lead intake. External channels (Facebook Lead Ads, Instagram,
// WhatsApp, Zapier/Make, custom forms) POST a lead here. The per-organization
// intake token in the query string (or `x-intake-token` header) identifies the
// tenant. Uses the service-role client to bypass RLS — the token IS the auth.

export const dynamic = "force-dynamic";

// Facebook/Meta webhook verification handshake (optional direct integration).
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const challenge = params.get("hub.challenge");
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const token =
    req.nextUrl.searchParams.get("token") ||
    req.headers.get("x-intake-token") ||
    "";

  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 401 });
  }

  const rawBody = await req.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, suspended_at, webhook_secret")
    .eq("intake_token", token)
    .maybeSingle();

  if (orgError || !org) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  if (org.suspended_at) {
    return NextResponse.json({ error: "organization suspended" }, { status: 403 });
  }

  // Verify the optional HMAC signature against the org's webhook secret.
  if (!signatureValid(rawBody, req.headers.get("x-signature"), org.webhook_secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Default the lead into the first pipeline stage.
  const { data: firstStage } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("organization_id", org.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  const str = (v: unknown) =>
    v == null ? null : String(v).trim() || null;

  const name =
    str(payload.name) ||
    str(payload.full_name) ||
    [str(payload.first_name), str(payload.last_name)]
      .filter(Boolean)
      .join(" ") ||
    str(payload.email) ||
    "Unnamed lead";

  const known = new Set([
    "name",
    "full_name",
    "first_name",
    "last_name",
    "email",
    "phone",
    "company",
    "source",
    "value",
    "notes",
    "custom",
  ]);
  const custom =
    (payload.custom as Record<string, unknown>) ||
    Object.fromEntries(
      Object.entries(payload).filter(([k]) => !known.has(k))
    );

  const { data: lead, error: insertError } = await supabase
    .from("leads")
    .insert({
      organization_id: org.id,
      stage_id: firstStage?.id ?? null,
      name,
      email: str(payload.email),
      phone: str(payload.phone),
      company: str(payload.company),
      source: str(payload.source) || "webhook",
      value: Number(payload.value) || 0,
      notes: str(payload.notes),
      custom_data: custom,
    })
    .select("id, organization_id, source, value, stage_id, assigned_to, custom_data")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.from("lead_activities").insert({
    organization_id: org.id,
    lead_id: lead.id,
    type: "created",
    body: `Lead captured via ${str(payload.source) || "webhook"}`,
  });

  // Fire automations for the new lead (best-effort).
  await runAutomations(supabase, org.id, {
    type: "lead.created",
    lead: {
      id: lead.id,
      organization_id: lead.organization_id,
      source: lead.source,
      value: lead.value,
      stage_id: lead.stage_id,
      assigned_to: lead.assigned_to,
      custom_data: (lead.custom_data ?? {}) as Record<string, unknown>,
    },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
