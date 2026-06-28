import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Nexus <span className="text-brand-600">CRM</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600">
          CRM גמיש ורב-ארגוני. קלטו את הלקוחות שלכם, אספו לידים מ-Facebook,
          Instagram ו-WhatsApp, והעבירו אותם דרך צינור מכירות שאתם שולטים בו.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
          >
            התחילו עכשיו
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-100"
          >
            התחברות
          </Link>
        </div>
      </div>
    </main>
  );
}
