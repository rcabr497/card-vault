import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "@/components/SignupForm";

export default async function SignupPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const session = await auth();
  const callbackUrl = searchParams.callbackUrl?.startsWith("/") ? searchParams.callbackUrl : "/dashboard";

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  return <SignupForm callbackUrl={callbackUrl} />;
}
