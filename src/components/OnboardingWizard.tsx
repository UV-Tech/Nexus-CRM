"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BUSINESS_TYPES,
  type FieldPreset,
  type OnboardingPayload,
  type StagePreset,
} from "@/lib/onboarding-presets";
import { completeOnboarding, skipOnboarding } from "@/app/welcome/actions";

const STEP_TITLES = [
  "ברוכים הבאים",
  "סוג העסק",
  "צינור מכירות",
  "שדות מותאמים אישית",
  "הזמנת הצוות",
  "הכול מוכן",
];

const COLORS = [
  "#6366f1", "#0ea5e9", "#f59e0b", "#8b5cf6",
  "#22c55e", "#ef4444", "#ec4899", "#14b8a6",
];

interface Invite {
  email: string;
  role: string;
}

export function OnboardingWizard({ orgName }: { orgName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [typeKey, setTypeKey] = useState<string | null>(null);
  const [stages, setStages] = useState<StagePreset[]>([]);
  const [fields, setFields] = useState<FieldPreset[]>([]);
  const [invites, setInvites] = useState<Invite[]>([{ email: "", role: "agent" }]);
  const [submitting, setSubmitting] = useState(false);
  const [inviteLinks, setInviteLinks] = useState<string[]>([]);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  function chooseType(key: string) {
    const preset = BUSINESS_TYPES.find((b) => b.key === key)!;
    setTypeKey(key);
    setStages(preset.stages.map((s) => ({ ...s })));
    setFields(preset.fields.map((f) => ({ ...f })));
    go(2);
  }

  async function skip() {
    setSubmitting(true);
    await skipOnboarding();
    router.push("/dashboard");
    router.refresh();
  }

  async function finish() {
    setSubmitting(true);
    const payload: OnboardingPayload = {
      businessType: typeKey ?? "other",
      stages,
      fields,
      invites: invites.filter((i) => i.email.trim()),
    };
    const res = await completeOnboarding(payload);
    setInviteLinks(res.inviteLinks ?? []);
    setSubmitting(false);
    go(5);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-50 via-white to-slate-100">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>{STEP_TITLES[step]}</span>
            <span>
              שלב {Math.min(step + 1, STEP_TITLES.length)} /{" "}
              {STEP_TITLES.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full rounded-full bg-brand-600"
              animate={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && <StepWelcome orgName={orgName} onStart={() => go(1)} />}
              {step === 1 && <StepType onChoose={chooseType} />}
              {step === 2 && (
                <StepStages stages={stages} setStages={setStages} />
              )}
              {step === 3 && (
                <StepFields fields={fields} setFields={setFields} />
              )}
              {step === 4 && (
                <StepInvites invites={invites} setInvites={setInvites} />
              )}
              {step === 5 && (
                <StepDone
                  inviteLinks={inviteLinks}
                  onDone={() => {
                    router.push("/dashboard");
                    router.refresh();
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        {step > 0 && step < 5 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => go(step - 1)}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              → חזרה
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={skip}
                disabled={submitting}
                className="text-sm font-medium text-slate-400 hover:text-slate-700"
              >
                דילוג על ההגדרה
              </button>
              {step < 4 ? (
                <button
                  onClick={() => go(step + 1)}
                  disabled={step === 1 && !typeKey}
                  className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
                >
                  המשך
                </button>
              ) : (
                <button
                  onClick={finish}
                  disabled={submitting}
                  className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting ? "מגדיר…" : "סיום ההגדרה"}
                </button>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          אפשר לשנות כל דבר כאן מאוחר יותר בהגדרות — שום דבר אינו סופי.
        </p>
      </div>
    </main>
  );
}

/* ----------------------------- Steps ------------------------------------- */

function StepWelcome({
  orgName,
  onStart,
}: {
  orgName: string;
  onStart: () => void;
}) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 text-4xl"
      >
        👋
      </motion.div>
      <h1 className="mt-6 text-3xl font-bold text-slate-900">
        ברוכים הבאים אל {orgName}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-slate-600">
        בואו נגדיר את ה-CRM שלכם בפחות מדקה. נתאים את צינור המכירות והשדות לעסק
        שלכם — ותוכלו לשנות הכול מאוחר יותר.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={onStart}
          className="rounded-lg bg-brand-600 px-8 py-3 font-medium text-white hover:bg-brand-700"
        >
          בואו נתחיל
        </button>
      </div>
    </div>
  );
}

function StepType({ onChoose }: { onChoose: (key: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">
        איזה סוג עסק זה?
      </h2>
      <p className="mt-1 text-slate-500">
        נציע צינור מכירות ושדות מתאימים. בחרו את האפשרות הקרובה ביותר.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BUSINESS_TYPES.map((b, i) => (
          <motion.button
            key={b.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChoose(b.key)}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-brand-400 hover:shadow-sm"
          >
            <span className="text-2xl">{b.emoji}</span>
            <span>
              <span className="block font-medium text-slate-900">{b.label}</span>
              <span className="block text-sm text-slate-500">
                {b.description}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function StepStages({
  stages,
  setStages,
}: {
  stages: StagePreset[];
  setStages: (s: StagePreset[]) => void;
}) {
  const update = (i: number, patch: Partial<StagePreset>) =>
    setStages(stages.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i: number) => setStages(stages.filter((_, idx) => idx !== i));
  const add = () =>
    setStages([
      ...stages,
      { name: "שלב חדש", color: COLORS[stages.length % COLORS.length] },
    ]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">צינור המכירות שלכם</h2>
      <p className="mt-1 text-slate-500">
        אלו השלבים שליד עובר דרכם. שנו שם, שנו צבע, סדרו מחדש על ידי הסרה/הוספה —
        או השאירו כפי שהם.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {stages.map((s, i) => (
          <motion.div
            key={i}
            layout
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
          >
            <input
              type="color"
              value={s.color}
              onChange={(e) => update(i, { color: e.target.value })}
              className="h-8 w-8 shrink-0 rounded border border-slate-200"
            />
            <input
              value={s.name}
              onChange={(e) => update(i, { name: e.target.value })}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            />
            {s.isWon && (
              <span className="text-xs font-medium text-green-600">זכייה</span>
            )}
            {s.isLost && (
              <span className="text-xs font-medium text-red-600">הפסד</span>
            )}
            <button
              onClick={() => remove(i)}
              className="text-sm text-slate-300 hover:text-red-600"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600"
      >
        + הוספת שלב
      </button>
    </div>
  );
}

function StepFields({
  fields,
  setFields,
}: {
  fields: FieldPreset[];
  setFields: (f: FieldPreset[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldPreset["type"]>("text");
  const [options, setOptions] = useState("");

  const remove = (i: number) => setFields(fields.filter((_, idx) => idx !== i));
  const add = () => {
    if (!label.trim()) return;
    setFields([
      ...fields,
      {
        label: label.trim(),
        type,
        options:
          type === "select"
            ? options.split(",").map((o) => o.trim()).filter(Boolean)
            : undefined,
      },
    ]);
    setLabel("");
    setOptions("");
    setType("text");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">שדות מותאמים אישית</h2>
      <p className="mt-1 text-slate-500">
        מידע נוסף שתרצו על כל ליד. מילאנו כמה מראש — הסירו לפי הצורך, או הוסיפו
        משלכם.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {fields.map((f, i) => (
          <motion.div
            key={i}
            layout
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
          >
            <span className="text-sm">
              <span className="font-medium text-slate-800">{f.label}</span>{" "}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                {f.type}
              </span>
              {f.options && f.options.length > 0 && (
                <span className="ml-2 text-xs text-slate-400">
                  {f.options.join(", ")}
                </span>
              )}
            </span>
            <button
              onClick={() => remove(i)}
              className="text-sm text-slate-300 hover:text-red-600"
            >
              ✕
            </button>
          </motion.div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-slate-400">
            אין שדות מותאמים אישית — זה בסדר, אפשר להוסיף אותם בכל עת.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4">
        <p className="text-sm font-medium text-slate-700">הוספת שדה</p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="תווית השדה"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FieldPreset["type"])}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="text">טקסט</option>
            <option value="number">מספר</option>
            <option value="date">תאריך</option>
            <option value="select">רשימה נפתחת</option>
            <option value="checkbox">תיבת סימון</option>
          </select>
          {type === "select" && (
            <input
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="מופרד,בפסיקים"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          )}
          <button
            onClick={add}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            הוספה
          </button>
        </div>
      </div>
    </div>
  );
}

function StepInvites({
  invites,
  setInvites,
}: {
  invites: Invite[];
  setInvites: (v: Invite[]) => void;
}) {
  const update = (i: number, patch: Partial<Invite>) =>
    setInvites(invites.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const remove = (i: number) =>
    setInvites(invites.filter((_, idx) => idx !== i));
  const add = () => setInvites([...invites, { email: "", role: "agent" }]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">הזמינו את הצוות שלכם</h2>
      <p className="mt-1 text-slate-500">
        הוסיפו אנשי מפתח עכשיו ונפיק קישורי הזמנה. אופציונלי — תוכלו להזמין כל
        אחד מאוחר יותר דרך ההגדרות.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {invites.map((inv, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={inv.email}
              onChange={(e) => update(i, { email: e.target.value })}
              type="email"
              placeholder="teammate@company.com"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={inv.role}
              onChange={(e) => update(i, { role: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="agent">נציג</option>
              <option value="admin">מנהל</option>
            </select>
            <button
              onClick={() => remove(i)}
              className="text-sm text-slate-300 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600"
      >
        + הוספת עוד
      </button>
    </div>
  );
}

function StepDone({
  inviteLinks,
  onDone,
}: {
  inviteLinks: string[];
  onDone: () => void;
}) {
  return (
    <div className="relative text-center">
      <Confetti />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500 text-4xl"
      >
        🎉
      </motion.div>
      <h2 className="mt-6 text-3xl font-bold text-slate-900">הכול מוכן!</h2>
      <p className="mx-auto mt-3 max-w-md text-slate-600">
        סביבת העבודה שלכם מוכנה. זכרו — כל הגדרה כאן ניתנת לשינוי מאוחר יותר
        בהגדרות.
      </p>

      {inviteLinks.length > 0 && (
        <div className="mx-auto mt-6 max-w-md rounded-xl border border-slate-200 bg-white p-4 text-left">
          <p className="text-sm font-medium text-slate-700">
            שתפו את קישורי ההזמנה האלה עם הצוות שלכם:
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {inviteLinks.map((link) => (
              <li
                key={link}
                className="truncate rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600"
              >
                {link}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onDone}
        className="mt-8 rounded-lg bg-brand-600 px-8 py-3 font-medium text-white hover:bg-brand-700"
      >
        מעבר ללוח הבקרה שלי
      </button>
    </div>
  );
}

function Confetti() {
  // A light burst of falling pieces — purely decorative.
  const pieces = Array.from({ length: 36 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = (i * 37) % 100;
        const color = COLORS[i % COLORS.length];
        const delay = (i % 12) * 0.08;
        const duration = 1.6 + (i % 5) * 0.3;
        return (
          <motion.span
            key={i}
            initial={{ y: -40, opacity: 1, rotate: 0 }}
            animate={{ y: 480, opacity: 0, rotate: 360 }}
            transition={{ duration, delay, ease: "easeIn" }}
            style={{ left: `${left}%`, backgroundColor: color }}
            className="absolute top-0 h-2 w-2 rounded-sm"
          />
        );
      })}
    </div>
  );
}
