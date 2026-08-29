import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildImportedCardData } from "@/lib/importShare";

export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const binder = await prisma.binder.findFirst({
    where: { shareSlug: params.slug, isShared: true },
    include: { binderCards: { include: { card: true } } },
  });
  if (!binder) {
    return NextResponse.json({ error: "Shared binder not found." }, { status: 404 });
  }

  if (binder.binderCards.length === 0) {
    return NextResponse.json({ imported: 0 });
  }

  await prisma.$transaction(
    binder.binderCards.map((bc) =>
      prisma.card.create({ data: buildImportedCardData(bc.card, session.user.id, bc.card.quantity) })
    )
  );

  return NextResponse.json({ imported: binder.binderCards.length });
}
