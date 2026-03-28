import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";

const hasWorkOS = !!process.env.WORKOS_CLIENT_ID;

export default async function ChatPage() {
  if (hasWorkOS) {
    const { user } = await withAuth({ ensureSignedIn: true });
    if (!user) {
      redirect("/");
    }
    return <ChatInterface userId={user.id} />;
  }

  // Dev mode without WorkOS
  return <ChatInterface userId="dev-user" />;
}
