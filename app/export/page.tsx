import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { ExportWizard } from "@/components/ExportWizard";

export default async function ExportPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, binders, decks] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.binder.findMany({ where: { userId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.deck.findMany({ where: { userId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <AppShell user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <h1 className="topbar-title">Export</h1>
      </div>
      <div className="page-pad">
        <ExportWizard binders={binders} decks={decks} />
      </div>
    </AppShell>
  );
}
