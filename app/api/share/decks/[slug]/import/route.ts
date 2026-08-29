import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildImportedCardData } from "@/lib/importShare";

export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const deck = await prisma.deck.findFirst({
    where: { shareSlug: params.slug, isShared: true },
    include: { deckCards: { include: { card: true } } },
  });
  if (!deck) {
    return NextResponse.json({ error: "Shared deck not found." }, { status: 404 });
  }

  if (deck.deckCards.length === 0) {
    return NextResponse.json({ imported: 0 });
  }

  await prisma.$transaction(
    deck.deckCards.map((dc) =>
      prisma.card.create({ data: buildImportedCardData(dc.card, session.user.id, dc.quantity) })
    )
  );

  return NextResponse.json({ imported: deck.deckCards.length });
}
