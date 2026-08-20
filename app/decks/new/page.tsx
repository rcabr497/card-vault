import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { NewDeckForm } from "@/components/NewDeckForm";

export default async function NewDeckPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, cards] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.card.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, setName: true },
    }),
  ]);

  return (
    <AppShell active="decks" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href="/decks" className="back-link">
            ← All decks
          </Link>
          <h1 className="topbar-title">New Deck</h1>
        </div>
      </div>
      <div className="page-pad">
        <NewDeckForm cards={cards} />
      </div>
    </AppShell>
  );
}
