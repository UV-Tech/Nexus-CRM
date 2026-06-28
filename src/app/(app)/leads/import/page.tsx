import Link from "next/link";
import { importLeads } from "./actions";

export default function ImportLeadsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="p-8">
      <Link href="/leads" className="text-sm text-slate-500 hover:text-slate-800">
        ← חזרה ללידים
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">ייבוא לידים</h1>
      <p className="mt-1 text-sm text-slate-500">
        העלו קובץ CSV או הדביקו טקסט CSV. השורה הראשונה חייבת להיות שורת כותרות.
        עמודות מזוהות: <code>name</code>, <code>email</code>,{" "}
        <code>phone</code>, <code>company</code>, <code>source</code>,{" "}
        <code>value</code>, <code>notes</code>. כל עמודה אחרת נשמרת כשדה מותאם
        אישית.
      </p>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <form
        action={importLeads}
        className="mt-6 flex max-w-2xl flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">קובץ CSV</span>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="text-sm"
          />
        </label>

        <div className="text-center text-xs uppercase tracking-wide text-slate-400">
          או הדביקו
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">טקסט CSV</span>
          <textarea
            name="csv"
            rows={8}
            placeholder={"name,email,phone,source\nJane Doe,jane@acme.com,+15551234,facebook"}
            className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
          />
        </label>

        <button className="self-start rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">
          ייבוא
        </button>
      </form>
    </div>
  );
}
