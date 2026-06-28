import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { WhatsAppReplyBox } from "@/components/WhatsAppReplyBox";
import { startConversation } from "./actions";

export const dynamic = "force-dynamic";

interface Conversation {
  id: string;
  contact_name: string | null;
  contact_phone: string;
  last_message_at: string;
  unread: number;
}
interface Message {
  id: string;
  direction: string;
  body: string;
  status: string;
  created_at: string;
}
interface Template {
  id: string;
  name: string;
  body: string;
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { c?: string };
}) {
  const { organization } = await getOrgContext();
  const supabase = createClient();

  const [{ data: convos }, { data: templates }, { data: integration }] =
    await Promise.all([
      supabase
        .from("wa_conversations")
        .select("id, contact_name, contact_phone, last_message_at, unread")
        .eq("organization_id", organization.id)
        .order("last_message_at", { ascending: false }),
      supabase
        .from("message_templates")
        .select("id, name, body")
        .eq("organization_id", organization.id)
        .order("name"),
      supabase
        .from("integrations")
        .select("status")
        .eq("organization_id", organization.id)
        .eq("provider", "whatsapp")
        .maybeSingle(),
    ]);

  const conversations = (convos ?? []) as Conversation[];
  const allTemplates = (templates ?? []) as Template[];
  const connected = integration?.status === "connected";

  const selectedId = searchParams.c ?? conversations[0]?.id ?? null;
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  let messages: Message[] = [];
  if (selected) {
    const { data } = await supabase
      .from("wa_messages")
      .select("id, direction, body, status, created_at")
      .eq("conversation_id", selected.id)
      .order("created_at");
    messages = (data ?? []) as Message[];
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900">💬 WhatsApp inbox</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              connected
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {connected ? "Connected" : "Not connected"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/inbox/templates" className="text-slate-600 hover:text-slate-900">
            Templates
          </Link>
          {!connected && (
            <Link href="/integrations/whatsapp" className="text-brand-600">
              Connect WhatsApp
            </Link>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Conversation list */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
          <form
            action={startConversation}
            className="flex flex-col gap-2 border-b border-slate-100 p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              New conversation
            </p>
            <input
              name="phone"
              required
              placeholder="Phone (+1555…)"
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
            <input
              name="name"
              placeholder="Name (optional)"
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
            />
            <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
              Start
            </button>
          </form>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/inbox?c=${c.id}`}
                className={`block border-b border-slate-50 px-4 py-3 hover:bg-slate-50 ${
                  c.id === selectedId ? "bg-brand-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    {c.contact_name || c.contact_phone}
                  </span>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-emerald-500 px-1.5 text-xs text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{c.contact_phone}</p>
              </Link>
            ))}
            {conversations.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No conversations yet.
              </p>
            )}
          </div>
        </aside>

        {/* Thread */}
        <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
          {selected ? (
            <>
              <div className="border-b border-slate-200 bg-white px-5 py-3">
                <p className="font-medium text-slate-900">
                  {selected.contact_name || selected.contact_phone}
                </p>
                <p className="text-xs text-slate-400">{selected.contact_phone}</p>
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-5">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                      m.direction === "out"
                        ? "self-end bg-emerald-600 text-white"
                        : "self-start bg-white text-slate-800 shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        m.direction === "out" ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      {new Date(m.created_at).toLocaleTimeString()}
                      {m.direction === "out" ? ` · ${m.status}` : ""}
                    </p>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="m-auto text-sm text-slate-400">
                    No messages yet. Say hello 👋
                  </p>
                )}
              </div>

              <WhatsAppReplyBox
                conversationId={selected.id}
                templates={allTemplates}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-slate-400">
                Select or start a conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
