import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const { organization, role } = await getOrgContext();

  // Only the owner of a not-yet-onboarded workspace sees the wizard.
  if (role !== "owner" || organization.onboarded_at) {
    redirect("/dashboard");
  }

  return <OnboardingWizard orgName={organization.name} />;
}
