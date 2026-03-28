import { redirect } from "next/navigation";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { LandingPage } from "@/components/landing/LandingPage";

const hasWorkOS = !!process.env.WORKOS_CLIENT_ID;

export default async function Home() {
  if (hasWorkOS) {
    const { user } = await withAuth();
    if (user) {
      redirect("/chat");
    }
  }

  // Build auth URLs — use the sign-in/sign-up API route which handles cookie-based CSRF
  const signInUrl = hasWorkOS ? "/api/auth/sign-in" : "/chat";
  const signUpUrl = hasWorkOS ? "/api/auth/sign-up" : "/chat";

  return <LandingPage signInUrl={signInUrl} signUpUrl={signUpUrl} />;
}
