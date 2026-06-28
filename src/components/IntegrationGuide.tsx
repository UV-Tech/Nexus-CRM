"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type {
  DynamicValueKey,
  Illustration,
  ProviderGuide,
} from "@/lib/integrations/guides";

export function IntegrationGuide({
  providerKey,
  providerName,
  emoji,
  guide,
  values,
}: {
  providerKey: string;
  providerName: string;
  emoji: string;
  guide: ProviderGuide;
  values: Record<DynamicValueKey, string>;
}) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const total = guide.steps.length;
  const current = guide.steps[step];
  const isLast = step === total - 1;

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(Math.max(0, Math.min(total - 1, n)));
  };

  const toggleDone = (i: number) =>
    setDone((s) => {
      const next = new Set(s);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked — value is visible to copy manually */
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">{emoji}</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Connect {providerName}
          </h1>
          <p className="text-sm text-slate-500">
            Step-by-step · about {guide.estMinutes} minutes · everything is
            changeable later.
          </p>
        </div>
      </div>

      {/* What you'll need */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">What you&apos;ll need</p>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
          {guide.needs.map((n) => (
            <li key={n} className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              {n}
            </li>
          ))}
        </ul>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
          <span>
            Step {step + 1} of {total}
          </span>
          <span>{done.size} done</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full rounded-full bg-brand-600"
            animate={{ width: `${((step + 1) / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* Step card */}
      <div className="relative mt-4 min-h-[360px]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">
                {step + 1}. {current.title}
              </h2>
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={done.has(step)}
                  onChange={() => toggleDone(step)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Done
              </label>
            </div>

            <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-600">
              {current.body.map((line, i) => (
                <p key={i} className="whitespace-pre-wrap">
                  {line}
                </p>
              ))}
            </div>

            {current.illustration && (
              <ConsoleMock illustration={current.illustration} />
            )}

            {/* Where to paste */}
            {current.pasteInto && (
              <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                → Paste this into the <strong>{current.pasteInto}</strong> field
                of the CRM Connect form.
              </p>
            )}

            {/* Copyable dynamic value or connect link */}
            {current.copyValue && (
              <div className="mt-4">
                {current.copyValue.key === "connectUrl" ? (
                  <Link
                    href={values.connectUrl}
                    className="inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    {current.copyValue.label} →
                  </Link>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {current.copyValue.label}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 truncate rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">
                        {values[current.copyValue.key]}
                      </code>
                      <button
                        onClick={() =>
                          copy(
                            values[current.copyValue!.key],
                            current.copyValue!.label
                          )
                        }
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      >
                        {copied === current.copyValue.label ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vendor link */}
            {current.link && (
              <a
                href={current.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                {current.link.label} ↗
              </a>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => go(step - 1)}
          disabled={step === 0}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-30"
        >
          ← Back
        </button>
        {isLast ? (
          <Link
            href={values.connectUrl}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Go to the Connect form →
          </Link>
        ) : (
          <button
            onClick={() => go(step + 1)}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Next step
          </button>
        )}
      </div>

      {/* Step dots */}
      <div className="mt-4 flex justify-center gap-1.5">
        {guide.steps.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === step
                ? "bg-brand-600"
                : done.has(i)
                  ? "bg-emerald-400"
                  : "bg-slate-300"
            }`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// A stylized "console" mock that points at the value to copy. Not a real
// screenshot — an illustration that mirrors the vendor's layout and highlights
// the exact field, with a gentle pulse to draw the eye.
function ConsoleMock({ illustration }: { illustration: Illustration }) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 bg-slate-800 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-xs font-medium text-slate-200">
          {illustration.vendor}
        </span>
      </div>
      <div className="bg-slate-50 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          {illustration.screen}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {illustration.fields.map((f, i) => (
            <div key={i} className="relative">
              <p className="text-xs text-slate-500">{f.label}</p>
              <motion.div
                animate={
                  f.highlight
                    ? { boxShadow: ["0 0 0 0 rgba(99,102,241,0.0)", "0 0 0 4px rgba(99,102,241,0.25)", "0 0 0 0 rgba(99,102,241,0.0)"] }
                    : {}
                }
                transition={{ duration: 1.8, repeat: Infinity }}
                className={`mt-0.5 flex items-center justify-between rounded-lg border bg-white px-3 py-2 ${
                  f.highlight ? "border-brand-400" : "border-slate-200"
                }`}
              >
                <code className="truncate text-xs text-slate-700">{f.sample}</code>
                {f.highlight && (
                  <span className="ml-2 shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">
                    copy this
                  </span>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
