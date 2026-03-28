import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { authEnabled } from "@/lib/auth-config";

const hasWorkOS = authEnabled;

export default async function Home() {
  if (!hasWorkOS) {
    return <LandingPage signInUrl="/chat" signUpUrl="/chat" />;
  }

  // withAuth is middleware-dependent; guard the call so this route always renders a
  // homepage even if middleware config is incomplete.
  try {
    const { withAuth } = await import("@workos-inc/authkit-nextjs");
    const { user } = await withAuth();
    if (user) {
      redirect("/chat");
    }
  } catch {
    // Middleware not covering this route — keep rendering the homepage.
  }

  // Build auth URLs — use the sign-in/sign-up API route which handles cookie-based CSRF
  const signInUrl = hasWorkOS ? "/api/auth/sign-in" : "/chat";
  const signUpUrl = hasWorkOS ? "/api/auth/sign-up" : "/chat";

  return <LandingPage signInUrl={signInUrl} signUpUrl={signUpUrl} />;
}
