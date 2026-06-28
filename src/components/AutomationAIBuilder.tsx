"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { generateAutomation, type GenerateResult } from "@/lib/automations/generate";
import { SPEC_BY_TYPE } from "@/lib/automations/catalog";
import { createAutomationFromGraph } from "@/app/(app)/automations/actions";

const EXAMPLES = [
  "כאשר מגיע ליד חדש מפייסבוק, שייכו אותו אליי ושלחו הודעת WhatsApp",
  "כאשר ערך הליד מעל 5000, שלחו התראה לצוות והעבירו לשלב מוסמך",
  "כאשר ליד מסומן כזכייה, הוסיפו הערה ושלחו אימייל תודה",
];

export function AutomationAIBuilder() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [creating, setCreating] = useState(false);

  function generate() {
    if (!text.trim()) return;
    setResult(generateAutomation(text));
  }

  async function create() {
    if (!result) return;
    setCreating(true);
    const res = await createAutomationFromGraph(result.name, result.graph);
    if (res.ok && res.id) {
      router.push(`/automations/${res.id}`);
    } else {
      setCreating(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-gradient-to-r from-brand-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        ✨ בנייה עם הסוכן שלנו
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-6 pt-20"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold text-slate-900">
                ✨ תארו את האוטומציה שלכם
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                ספרו לנו במילים פשוטות מה צריך לקרות — אנחנו נבנה את התהליך. תוכלו
                לחדד הכל על הקנבס לאחר מכן.
              </p>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="לדוגמה: כאשר מגיע ליד חדש ב-WhatsApp, שייכו אותו אליי ושלחו הודעת ברוכים הבאים"
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <div className="mt-2 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setText(ex)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200"
                  >
                    {ex.length > 42 ? ex.slice(0, 42) + "…" : ex}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={generate}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  יצירה
                </button>
              </div>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-medium text-slate-900">{result.name}</p>
                  <ol className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
                    {result.graph.nodes.map((n, i) => {
                      const spec = SPEC_BY_TYPE[n.type];
                      return (
                        <li key={n.id} className="flex items-center gap-2">
                          <span className="text-slate-400">{i + 1}.</span>
                          <span>{spec?.emoji}</span>
                          <span>{spec?.label ?? n.type}</span>
                        </li>
                      );
                    })}
                  </ol>
                  {result.notes.length > 0 && (
                    <ul className="mt-3 list-disc pl-5 text-xs text-amber-700">
                      {result.notes.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={create}
                    disabled={creating}
                    className="mt-4 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    {creating ? "יוצר…" : "יצירה ופתיחה בעורך"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
