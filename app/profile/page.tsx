import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { PasswordForm } from "@/components/PasswordForm";
import { SignOutButton } from "@/components/SignOutButton";

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <AppShell user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <h1 className="topbar-title">Profile settings</h1>
      </div>
      <div className="page-pad" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, marginBottom: 16 }}>
            Account
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>
            {user.name} · {user.email}
          </p>
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, marginBottom: 16 }}>
            Update password
          </h2>
          <PasswordForm />
        </div>
        <div>
          <SignOutButton />
        </div>
      </div>
    </AppShell>
  );
}
