import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AddCardForm } from "@/components/AddCardForm";

export default async function AddCardToDeckPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user.id;

  const deck = await prisma.deck.findFirst({ where: { id: params.id, userId } });
  if (!deck) notFound();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  return (
    <AppShell active="decks" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href={`/decks/${deck.id}`} className="back-link">
            ← {deck.name}
          </Link>
          <h1 className="topbar-title">Add Card</h1>
          <div className="topbar-subtitle">New cards are saved to your collection and added to this deck.</div>
        </div>
      </div>
      <div className="page-pad">
        <AddCardForm deckId={deck.id} />
      </div>
    </AppShell>
  );
}
