import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { PasswordForm } from "@/components/PasswordForm";
import { SignOutButton } from "@/components/SignOutButton";
import { HandleForm } from "@/components/HandleForm";
import { NameForm } from "@/components/NameForm";
import { TradeInviteLink } from "@/components/TradeInviteLink";

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
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <NameForm initial={user.name ?? ""} />
            <p style={{ fontSize: 13.5, color: "var(--text-soft)", margin: 0 }}>Email: {user.email}</p>
          </div>
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
            Trading handle
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--text-soft)", margin: "0 0 14px" }}>
            Other collectors find and see you by this handle when trading. Your name and email stay private.
          </p>
          <HandleForm initial={user.handle} />
          {user.handle && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-soft)", marginBottom: 6 }}>Your trade link</div>
              <TradeInviteLink handle={user.handle} />
            </div>
          )}
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
