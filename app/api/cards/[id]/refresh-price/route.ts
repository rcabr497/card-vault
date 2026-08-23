import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchCardSightPrice } from "@/lib/cardSight";
import { lookupCardByName } from "@/lib/cardLookup";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const card = await prisma.card.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  // Prefer CardSight's own pricing (real eBay sold/asking records for the
  // exact identified card) when we have its id; fall back to the free
  // name-lookup APIs otherwise (e.g. cards added manually).
  if (card.cardSightId && process.env.CARDSIGHT_API_KEY) {
    const estimatedValue = await fetchCardSightPrice(card.cardSightId, process.env.CARDSIGHT_API_KEY);
    if (estimatedValue !== null) {
      return NextResponse.json({ estimatedValue, source: "cardsight" });
    }
  }

  const result = await lookupCardByName(card.name);
  return NextResponse.json({ estimatedValue: result?.estimatedValue ?? null, source: "lookup" });
}
