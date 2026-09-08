import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildImportedCardData, originalOwnerNameOf } from "@/lib/importShare";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const mode = body?.mode === "deck" ? "deck" : "cards";

  const deck = await prisma.deck.findFirst({
    where: { shareSlug: params.slug, isShared: true },
    include: { deckCards: { include: { card: true } }, user: { select: { name: true, email: true } } },
  });
  if (!deck) {
    return NextResponse.json({ error: "Shared deck not found." }, { status: 404 });
  }

  if (deck.deckCards.length === 0) {
    if (mode === "deck") {
      const newDeck = await prisma.deck.create({
        data: {
          user: { connect: { id: session.user.id } },
          name: deck.name,
          featuredImageUrl: deck.featuredImageUrl,
          format: deck.format,
          notes: deck.notes,
          originalOwnerName: originalOwnerNameOf(deck.user),
        },
      });
      return NextResponse.json({ imported: 0, deckId: newDeck.id });
    }
    return NextResponse.json({ imported: 0 });
  }

  if (mode === "deck") {
    const newDeck = await prisma.$transaction(async (tx) => {
      const created = await tx.deck.create({
        data: {
          user: { connect: { id: session.user.id } },
          name: deck.name,
          featuredImageUrl: deck.featuredImageUrl,
          format: deck.format,
          notes: deck.notes,
          originalOwnerName: originalOwnerNameOf(deck.user),
        },
      });
      for (const dc of deck.deckCards) {
        const card = await tx.card.create({
          data: buildImportedCardData(dc.card, session.user.id, dc.quantity),
        });
        await tx.deckCard.create({ data: { deckId: created.id, cardId: card.id, quantity: dc.quantity } });
      }
      return created;
    });
    return NextResponse.json({ imported: deck.deckCards.length, deckId: newDeck.id });
  }

  await prisma.$transaction(
    deck.deckCards.map((dc) =>
      prisma.card.create({ data: buildImportedCardData(dc.card, session.user.id, dc.quantity) })
    )
  );

  return NextResponse.json({ imported: deck.deckCards.length });
}
