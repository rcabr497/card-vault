import { Card, Prisma } from "@prisma/client";

// Builds a Card.create payload copying a shared card's descriptive fields to a
// new owner. Mirrors the field set app/api/cards/route.ts accepts, but
// deliberately excludes fields that are personal to the original owner
// rather than descriptive of the card itself: purchasePrice (what THEY paid),
// notes (their private annotation), and metadataJson (their scan metadata).
export function buildImportedCardData(
  card: Card,
  userId: string,
  quantity: number
): Prisma.CardCreateInput {
  return {
    user: { connect: { id: userId } },
    category: card.category,
    name: card.name,
    setName: card.setName,
    cardNumber: card.cardNumber,
    year: card.year,
    team: card.team,
    rarity: card.rarity,
    condition: card.condition,
    gradingCompany: card.gradingCompany,
    grade: card.grade,
    quantity: Math.max(1, quantity),
    currentValue: card.currentValue,
    imageUrl: card.imageUrl,
    thumbnailUrl: card.thumbnailUrl,
    cardSightId: card.cardSightId,
  };
}

// The name credited as "original owner" on a copied binder/deck: the
// owner's display name, falling back to their email if they never set one.
export function originalOwnerNameOf(owner: { name: string | null; email: string }): string {
  return owner.name ?? owner.email;
}
