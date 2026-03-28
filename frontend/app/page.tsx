import { redirect } from "next/navigation";
import { withAuth, getSignInUrl, getSignUpUrl } from "@workos-inc/authkit-nextjs";
import { LandingPage } from "@/components/landing/LandingPage";

const hasWorkOS = !!process.env.WORKOS_CLIENT_ID;

export default async function Home() {
  if (hasWorkOS) {
    const { user } = await withAuth();
    if (user) {
      redirect("/chat");
    }
  }

  const signInUrl = hasWorkOS ? await getSignInUrl() : "/chat";
  const signUpUrl = hasWorkOS ? await getSignUpUrl() : "/chat";

  return <LandingPage signInUrl={signInUrl} signUpUrl={signUpUrl} />;
}
