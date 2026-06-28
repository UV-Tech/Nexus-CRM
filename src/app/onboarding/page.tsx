import { redirect } from "next/navigation";

// Self-serve onboarding is disabled in the closed model: a platform admin
// provisions organizations. Route through /dashboard, which sends platform
// admins to /admin and users without an org to /no-access.
export default function OnboardingPage() {
  redirect("/dashboard");
}
