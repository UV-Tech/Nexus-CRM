import Link from "next/link";
import { signIn, signUp } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { mode?: string; error?: string; confirm?: string };
}) {
  const isSignup = searchParams.mode === "signup";

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {isSignup ? "Create your workspace" : "Sign in to Nexus CRM"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isSignup
            ? "Set up your organization and start managing leads."
            : "Welcome back. Enter your details to continue."}
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}
        {searchParams.confirm && (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Check your inbox to confirm your email, then sign in.
          </p>
        )}

        <form
          action={isSignup ? signUp : signIn}
          className="mt-6 flex flex-col gap-4"
        >
          {isSignup && (
            <>
              <Field label="Full name" name="full_name" type="text" required />
              <Field
                label="Organization name"
                name="org_name"
                type="text"
                placeholder="Acme Inc."
                required
              />
            </>
          )}
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="password" required />

          <button
            type="submit"
            className="mt-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
          >
            {isSignup ? "Create workspace" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brand-600">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href="/login?mode=signup"
                className="font-medium text-brand-600"
              >
                Create a workspace
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
