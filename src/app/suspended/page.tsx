import { signOut } from "@/app/login/actions";

export default function SuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          סביבת העבודה מושהית
        </h1>
        <p className="mt-3 text-slate-600">
          הגישה לסביבת עבודה זו מושהית כרגע. אנא פנו למנהל הפלטפורמה לקבלת עזרה.
        </p>
        <form action={signOut} className="mt-6">
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            התנתקות
          </button>
        </form>
      </div>
    </main>
  );
}
