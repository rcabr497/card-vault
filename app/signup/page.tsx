import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "@/components/SignupForm";
import { safeCallbackUrl } from "@/lib/safeRedirect";

export default async function SignupPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const session = await auth();
  const callbackUrl = safeCallbackUrl(searchParams.callbackUrl);

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  return <SignupForm callbackUrl={callbackUrl} />;
}
