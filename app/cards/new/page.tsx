import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AddCardForm } from "@/components/AddCardForm";

export default async function NewCardPage({ searchParams }: { searchParams: { mode?: string } }) {
  const scanning = searchParams.mode === "camera";
  const session = await auth();
  const userId = session!.user.id;

  const [user, binders] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.binder.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true, sport: true },
    }),
  ]);

  return (
    <AppShell active="dashboard" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href="/dashboard" className="back-link">
            ← Dashboard
          </Link>
          <h1 className="topbar-title">{scanning ? "Scan a card" : "Add card"}</h1>
          {scanning && <div className="topbar-subtitle">Hold the card flat in good light. Matches fill in the details for you.</div>}
        </div>
      </div>
      <div className="page-pad">
        <AddCardForm binders={binders} initialMode={scanning ? "camera" : undefined} />
      </div>
    </AppShell>
  );
}
