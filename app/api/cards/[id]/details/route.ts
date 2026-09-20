import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchCardSightDetails } from "@/lib/cardSight";

// Fetches CardSight's full catalog record for a card it identified and saves it
// on the card. Fires once automatically for cards scanned before we kept this
// data, and doubles as the "Refresh data" action.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const card = await prisma.card.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }
  if (!card.cardSightId) {
    return NextResponse.json({ error: "This card wasn't identified by CardSight." }, { status: 400 });
  }

  const apiKey = process.env.CARDSIGHT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "CardSight isn't configured." }, { status: 503 });
  }

  const details = await fetchCardSightDetails(card.cardSightId, apiKey);
  if (!details) {
    return NextResponse.json({ error: "Couldn't load card data right now — try again in a moment." }, { status: 502 });
  }

  await prisma.card.update({ where: { id: card.id }, data: { metadataJson: JSON.stringify(details) } });
  return NextResponse.json({ ok: true });
}
