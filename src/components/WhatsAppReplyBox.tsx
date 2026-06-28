"use client";

import { useState } from "react";
import { sendMessage } from "@/app/(app)/inbox/actions";

interface Template {
  id: string;
  name: string;
  body: string;
}

export function WhatsAppReplyBox({
  conversationId,
  templates,
}: {
  conversationId: string;
  templates: Template[];
}) {
  const [body, setBody] = useState("");

  return (
    <form
      action={sendMessage}
      onSubmit={() => setTimeout(() => setBody(""), 0)}
      className="border-t border-slate-200 bg-white p-3"
    >
      <input type="hidden" name="conversation_id" value={conversationId} />

      {templates.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setBody((b) => (b ? b + "\n" + t.body : t.body))}
              title={t.body}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="הקלידו הודעה…"
          className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!body.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          שליחה
        </button>
      </div>
    </form>
  );
}
