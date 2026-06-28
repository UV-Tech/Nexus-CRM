import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Inbound WhatsApp webhook (Meta WhatsApp Cloud API shape). The org is
// identified by `?token=<org intake_token>`. Verification (GET) checks the
// org's stored verify_token; messages (POST) land in the WhatsApp inbox.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const challenge = params.get("hub.challenge");
  const verifyToken = params.get("hub.verify_token");
  const token = params.get("token") || "";

  if (mode === "subscribe" && challenge) {
    const supabase = createServiceClient();
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("intake_token", token)
      .maybeSingle();
    if (!org) return new NextResponse("invalid token", { status: 401 });

    const { data: integration } = await supabase
      .from("integrations")
      .select("config")
      .eq("organization_id", org.id)
      .eq("provider", "whatsapp")
      .maybeSingle();

    const expected = (integration?.config as Record<string, string> | null)
      ?.verify_token;
    if (expected && verifyToken !== expected) {
      return new NextResponse("verify token mismatch", { status: 403 });
    }
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}

interface WaPayload {
  entry?: {
    changes?: {
      value?: {
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: { from?: string; text?: { body?: string } }[];
      };
    }[];
  }[];
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 401 });

  let payload: WaPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, suspended_at")
    .eq("intake_token", token)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "invalid token" }, { status: 401 });
  if (org.suspended_at)
    return NextResponse.json({ error: "suspended" }, { status: 403 });

  // Walk the Cloud API payload and record each inbound message.
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const name = value.contacts?.[0]?.profile?.name ?? null;
      for (const msg of value.messages ?? []) {
        const phone = msg.from;
        const body = msg.text?.body;
        if (!phone || !body) continue;

        const { data: convo } = await supabase
          .from("wa_conversations")
          .upsert(
            {
              organization_id: org.id,
              contact_phone: phone,
              contact_name: name,
              last_message_at: new Date().toISOString(),
            },
            { onConflict: "organization_id,contact_phone" }
          )
          .select("id, unread")
          .single();

        if (convo) {
          await supabase.from("wa_messages").insert({
            organization_id: org.id,
            conversation_id: convo.id,
            direction: "in",
            body,
            status: "delivered",
          });
          await supabase
            .from("wa_conversations")
            .update({ unread: (convo.unread ?? 0) + 1 })
            .eq("id", convo.id);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
