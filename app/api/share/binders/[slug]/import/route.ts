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
  const mode = body?.mode === "binder" ? "binder" : "cards";

  const binder = await prisma.binder.findFirst({
    where: { shareSlug: params.slug, isShared: true },
    include: { binderCards: { include: { card: true } }, user: { select: { name: true, email: true } } },
  });
  if (!binder) {
    return NextResponse.json({ error: "Shared binder not found." }, { status: 404 });
  }

  if (binder.binderCards.length === 0) {
    if (mode === "binder") {
      const newBinder = await prisma.binder.create({
        data: {
          user: { connect: { id: session.user.id } },
          name: binder.name,
          type: binder.type,
          originalOwnerName: originalOwnerNameOf(binder.user),
        },
      });
      return NextResponse.json({ imported: 0, binderId: newBinder.id });
    }
    return NextResponse.json({ imported: 0 });
  }

  if (mode === "binder") {
    const newBinder = await prisma.$transaction(async (tx) => {
      const created = await tx.binder.create({
        data: {
          user: { connect: { id: session.user.id } },
          name: binder.name,
          type: binder.type,
          originalOwnerName: originalOwnerNameOf(binder.user),
        },
      });
      for (const bc of binder.binderCards) {
        const card = await tx.card.create({
          data: buildImportedCardData(bc.card, session.user.id, bc.card.quantity),
        });
        await tx.binderCard.create({ data: { binderId: created.id, cardId: card.id } });
      }
      return created;
    });
    return NextResponse.json({ imported: binder.binderCards.length, binderId: newBinder.id });
  }

  await prisma.$transaction(
    binder.binderCards.map((bc) =>
      prisma.card.create({ data: buildImportedCardData(bc.card, session.user.id, bc.card.quantity) })
    )
  );

  return NextResponse.json({ imported: binder.binderCards.length });
}
