import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { EditCardForm } from "@/components/EditCardForm";

export default async function EditCardPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user.id;

  const card = await prisma.card.findFirst({ where: { id: params.id, userId } });
  if (!card) notFound();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  return (
    <AppShell active="binders" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href={`/cards/${card.id}`} className="back-link">
            ← {card.name}
          </Link>
          <h1 className="topbar-title">Edit Card</h1>
        </div>
      </div>
      <div className="page-pad">
        <EditCardForm
          card={{
            id: card.id,
            name: card.name,
            category: card.category,
            setName: card.setName,
            cardNumber: card.cardNumber,
            year: card.year,
            team: card.team,
            rarity: card.rarity,
            condition: card.condition,
            gradingCompany: card.gradingCompany,
            grade: card.grade,
            quantity: card.quantity,
            purchasePrice: card.purchasePrice ? card.purchasePrice.toString() : null,
            currentValue: card.currentValue ? card.currentValue.toString() : null,
            notes: card.notes,
          }}
        />
      </div>
    </AppShell>
  );
}
