import Link from "next/link";
import { signIn, signUp } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { mode?: string; error?: string; confirm?: string; next?: string };
}) {
  const isSignup = searchParams.mode === "signup";
  const next = searchParams.next ?? "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {isSignup ? "יצירת חשבון" : "התחברות ל-Nexus CRM"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isSignup
            ? "צרו חשבון כדי לקבל את ההזמנה שלכם."
            : "ברוכים השבים. הזינו את הפרטים שלכם כדי להמשיך."}
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}
        {searchParams.confirm && (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            בדקו את תיבת הדואר שלכם כדי לאשר את האימייל, ולאחר מכן התחברו.
          </p>
        )}

        <form
          action={isSignup ? signUp : signIn}
          className="mt-6 flex flex-col gap-4"
        >
          <input type="hidden" name="next" value={next} />
          {isSignup && (
            <Field label="שם מלא" name="full_name" type="text" required />
          )}
          <Field label="אימייל" name="email" type="email" required />
          <Field label="סיסמה" name="password" type="password" required />

          <button
            type="submit"
            className="mt-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
          >
            {isSignup ? "יצירת סביבת עבודה" : "התחברות"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isSignup ? (
            <>
              כבר יש לכם חשבון?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="font-medium text-brand-600"
              >
                התחברות
              </Link>
            </>
          ) : (
            <>
              חדשים כאן?{" "}
              <Link
                href={`/login?mode=signup&next=${encodeURIComponent(next)}`}
                className="font-medium text-brand-600"
              >
                יצירת סביבת עבודה
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
