import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AddCardForm } from "@/components/AddCardForm";

export default async function NewCardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, binders] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.binder.findMany({ where: { userId }, orderBy: { name: "asc" }, select: { id: true, name: true, type: true } }),
  ]);

  return (
    <AppShell active="dashboard" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href="/dashboard" className="back-link">
            ← Dashboard
          </Link>
          <h1 className="topbar-title">Add Card</h1>
        </div>
      </div>
      <div className="page-pad">
        <AddCardForm binders={binders} />
      </div>
    </AppShell>
  );
}
