import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const deck = await prisma.deck.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const cards: { cardId: string; quantity: number }[] = Array.isArray(body?.cards) ? body.cards : [];
  if (!cards.length) {
    return NextResponse.json({ error: "No cards provided." }, { status: 400 });
  }

  const validCardIds = new Set(
    (
      await prisma.card.findMany({
        where: { id: { in: cards.map((c) => c.cardId) }, userId: session.user.id },
        select: { id: true },
      })
    ).map((c) => c.id)
  );

  await prisma.$transaction(
    cards
      .filter((c) => validCardIds.has(c.cardId))
      .map((c) =>
        prisma.deckCard.upsert({
          where: { deckId_cardId: { deckId: deck.id, cardId: c.cardId } },
          create: { deckId: deck.id, cardId: c.cardId, quantity: Math.max(1, c.quantity || 1) },
          update: { quantity: Math.max(1, c.quantity || 1) },
        })
      )
  );

  return NextResponse.json({ ok: true });
}
