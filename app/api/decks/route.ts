import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const featuredImageUrl = typeof body?.featuredImageUrl === "string" ? body.featuredImageUrl : null;
  const format = typeof body?.format === "string" ? body.format : null;
  const cards: { cardId: string; quantity: number }[] = Array.isArray(body?.cards) ? body.cards : [];

  if (!name) {
    return NextResponse.json({ error: "A deck name is required." }, { status: 400 });
  }

  const validCardIds = cards.length
    ? (
        await prisma.card.findMany({
          where: { id: { in: cards.map((c) => c.cardId) }, userId: session.user.id },
          select: { id: true },
        })
      ).map((c) => c.id)
    : [];
  const validIdSet = new Set(validCardIds);

  const deck = await prisma.deck.create({
    data: {
      userId: session.user.id,
      name,
      featuredImageUrl,
      format,
      deckCards: {
        create: cards
          .filter((c) => validIdSet.has(c.cardId))
          .map((c) => ({ cardId: c.cardId, quantity: Math.max(1, c.quantity || 1) })),
      },
    },
  });

  return NextResponse.json({ id: deck.id });
}
