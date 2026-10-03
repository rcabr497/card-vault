import { Prisma, PrismaClient, type Card, type TradeStatus } from "@prisma/client";
import { buildImportedCardData } from "./importShare";

// A trade proposal (or counter) stays open this long without a response, and an
// accepted trade this long without both people confirming. Expiry is derived
// from expiresAt when read — there's no background job.
export const PROPOSAL_DAYS = 14;
export const ACCEPTED_DAYS = 30;
export const NOTE_MAX = 500;
export const MAX_ITEMS_PER_SIDE = 50;

type Db = PrismaClient | Prisma.TransactionClient;

export type OfferItem = { cardId: string; quantity: number };
export type EffectiveStatus = TradeStatus | "expired";

// Errors with an HTTP status, turned into JSON responses by the trade routes.
export class TradeError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function daysFromNow(days: number, now = new Date()): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export function effectiveStatus(t: { status: TradeStatus; expiresAt: Date }, now = new Date()): EffectiveStatus {
  if ((t.status === "proposed" || t.status === "accepted") && t.expiresAt <= now) return "expired";
  return t.status;
}

// Trades that still hold their cards: open and not expired.
export function activeTradeWhere(now = new Date()): Prisma.TradeWhereInput {
  return { status: { in: ["proposed", "accepted"] }, expiresAt: { gt: now } };
}

// Copies of each card already promised in other active trades.
export async function reservedQuantities(db: Db, cardIds: string[], excludeTradeId?: string): Promise<Map<string, number>> {
  if (cardIds.length === 0) return new Map();
  const rows = await db.tradeItem.groupBy({
    by: ["cardId"],
    where: {
      cardId: { in: cardIds },
      trade: { ...activeTradeWhere(), ...(excludeTradeId ? { id: { not: excludeTradeId } } : {}) },
    },
    _sum: { quantity: true },
  });
  return new Map(rows.map((r) => [r.cardId as string, r._sum.quantity ?? 0]));
}

// Parses an untrusted list of {cardId, quantity}, merging repeats.
export function parseOffer(raw: unknown): OfferItem[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new TradeError(400, "Cards must be a list.");
  const merged = new Map<string, number>();
  for (const entry of raw) {
    const cardId = typeof entry?.cardId === "string" ? entry.cardId : "";
    const quantity = Number(entry?.quantity ?? 1);
    if (!cardId || !Number.isInteger(quantity) || quantity < 1) {
      throw new TradeError(400, "Each card needs an id and a whole-number quantity of at least 1.");
    }
    merged.set(cardId, (merged.get(cardId) ?? 0) + quantity);
  }
  if (merged.size > MAX_ITEMS_PER_SIDE) throw new TradeError(400, `A trade can include up to ${MAX_ITEMS_PER_SIDE} cards per side.`);
  return Array.from(merged).map(([cardId, quantity]) => ({ cardId, quantity }));
}

export function parseNote(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const note = raw.trim();
  if (note.length > NOTE_MAX) throw new TradeError(400, `Notes can be up to ${NOTE_MAX} characters.`);
  return note || null;
}

// Checks that `ownerId` owns every card and has enough copies not already
// promised elsewhere. Returns the cards so callers can snapshot them.
export async function validateOffer(
  db: Db,
  ownerId: string,
  items: OfferItem[],
  excludeTradeId?: string
): Promise<Map<string, Card>> {
  if (items.length === 0) return new Map();
  const ids = items.map((i) => i.cardId);
  const cards = await db.card.findMany({ where: { id: { in: ids }, userId: ownerId } });
  const byId = new Map(cards.map((c) => [c.id, c]));
  const reserved = await reservedQuantities(db, ids, excludeTradeId);
  for (const item of items) {
    const card = byId.get(item.cardId);
    if (!card) throw new TradeError(409, "One of the cards in this trade is no longer in its owner's collection.");
    const available = card.quantity - (reserved.get(card.id) ?? 0);
    if (item.quantity > available) {
      throw new TradeError(
        409,
        available > 0
          ? `Only ${available} of “${card.name}” ${available === 1 ? "is" : "are"} available — the rest ${card.quantity - available === 1 ? "is" : "are"} in another trade.`
          : `“${card.name}” is already promised in another trade.`
      );
    }
  }
  return byId;
}

export function snapshotItem(card: Card, quantity: number): Prisma.TradeItemCreateWithoutTradeInput {
  return {
    ownerId: card.userId,
    card: { connect: { id: card.id } },
    quantity,
    name: card.name,
    category: card.category,
    setName: card.setName,
    cardNumber: card.cardNumber,
    year: card.year,
    condition: card.condition,
    gradingCompany: card.gradingCompany,
    grade: card.grade,
    imageUrl: card.imageUrl,
    thumbnailUrl: card.thumbnailUrl,
    currentValue: card.currentValue,
  };
}

export function snapshotItems(items: OfferItem[], cards: Map<string, Card>): Prisma.TradeItemCreateWithoutTradeInput[] {
  return items.map((i) => snapshotItem(cards.get(i.cardId)!, i.quantity));
}

// Moves every item's copies to the other participant. Runs inside the
// completion transaction, after the status flip has claimed the trade.
export async function transferItems(
  tx: Prisma.TransactionClient,
  trade: { proposerId: string; recipientId: string; items: { ownerId: string; cardId: string | null; quantity: number; name: string }[] }
) {
  for (const item of trade.items) {
    const receiverId = item.ownerId === trade.proposerId ? trade.recipientId : trade.proposerId;
    const card = item.cardId ? await tx.card.findUnique({ where: { id: item.cardId } }) : null;
    if (!card || card.userId !== item.ownerId || card.quantity < item.quantity) {
      throw new TradeError(409, `“${item.name}” is no longer in its owner's collection in that quantity, so the trade can't complete.`);
    }

    await tx.card.create({ data: buildImportedCardData(card, receiverId, item.quantity) });

    if (card.quantity === item.quantity) {
      // Removing the row also takes it out of the giver's binders and decks.
      await tx.card.delete({ where: { id: card.id } });
    } else {
      const remaining = card.quantity - item.quantity;
      await tx.card.update({ where: { id: card.id }, data: { quantity: remaining } });
      await tx.deckCard.updateMany({ where: { cardId: card.id, quantity: { gt: remaining } }, data: { quantity: remaining } });
    }
  }
}

// Where the signed-in user still has something to do.
export function needsActionWhere(userId: string, now = new Date()): Prisma.TradeWhereInput {
  return {
    expiresAt: { gt: now },
    OR: [
      { status: "proposed", awaitingUserId: userId },
      { status: "accepted", proposerId: userId, proposerConfirmedAt: null },
      { status: "accepted", recipientId: userId, recipientConfirmedAt: null },
    ],
  };
}

// The user's cards for a trade picker, with how many copies are still free.
// Copies already in `excludeTradeId` (the trade being edited) count as free.
export async function pickerCards(db: Db, userId: string, excludeTradeId?: string) {
  const [cards, reserved] = await Promise.all([
    db.card.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, setName: true, quantity: true, thumbnailUrl: true, imageUrl: true },
    }),
    db.tradeItem.groupBy({
      by: ["cardId"],
      where: {
        ownerId: userId,
        cardId: { not: null },
        trade: { ...activeTradeWhere(), ...(excludeTradeId ? { id: { not: excludeTradeId } } : {}) },
      },
      _sum: { quantity: true },
    }),
  ]);
  const held = new Map(reserved.map((r) => [r.cardId as string, r._sum.quantity ?? 0]));
  return cards.map((c) => ({
    id: c.id,
    name: c.name,
    setName: c.setName,
    imageUrl: c.thumbnailUrl ?? c.imageUrl,
    available: Math.max(0, c.quantity - (held.get(c.id) ?? 0)),
  }));
}

type TradeForView = {
  status: TradeStatus;
  expiresAt: Date;
  proposerId: string;
  recipientId: string;
  awaitingUserId: string | null;
  proposerConfirmedAt: Date | null;
  recipientConfirmedAt: Date | null;
  proposer: { handle: string | null };
  recipient: { handle: string | null };
  items: { ownerId: string; quantity: number }[];
};

// Everything the trade list and detail pages need, from one user's side.
export function tradeView<T extends TradeForView>(trade: T, userId: string) {
  const isProposer = trade.proposerId === userId;
  const otherHandle = (isProposer ? trade.recipient.handle : trade.proposer.handle) ?? "unknown";
  const status = effectiveStatus(trade);
  const myTurn = status === "proposed" && trade.awaitingUserId === userId;
  const myConfirmed = !!(isProposer ? trade.proposerConfirmedAt : trade.recipientConfirmedAt);
  const theirConfirmed = !!(isProposer ? trade.recipientConfirmedAt : trade.proposerConfirmedAt);
  const myItems = trade.items.filter((i) => i.ownerId === userId) as T["items"];
  const theirItems = trade.items.filter((i) => i.ownerId !== userId) as T["items"];
  const giveCount = myItems.reduce((s, i) => s + i.quantity, 0);
  const getCount = theirItems.reduce((s, i) => s + i.quantity, 0);

  const cards = (n: number) => `${n} card${n === 1 ? "" : "s"}`;
  // A one-sided trade is only a "gift" once it's agreed; before that it's an
  // offer the other person may still counter.
  const agreed = status === "accepted" || status === "completed";
  const summary =
    giveCount && getCount
      ? `You give ${giveCount} · You get ${getCount}`
      : giveCount
        ? agreed
          ? `Your gift to @${otherHandle} (${cards(giveCount)})`
          : `You offer ${cards(giveCount)}`
        : agreed
          ? `Gift from @${otherHandle} (${cards(getCount)})`
          : `@${otherHandle} offers ${cards(getCount)}`;

  let label: string;
  let tone: "action" | "open" | "good" | "closed";
  if (status === "proposed") {
    [label, tone] = myTurn ? ["Your turn", "action"] : [`Waiting on @${otherHandle}`, "open"];
  } else if (status === "accepted") {
    [label, tone] = myConfirmed ? [`Waiting on @${otherHandle} to confirm`, "open"] : ["Confirm when swapped", "action"];
  } else if (status === "completed") {
    [label, tone] = ["Completed", "good"];
  } else {
    [label, tone] = [status === "expired" ? "Expired" : status === "declined" ? "Declined" : "Cancelled", "closed"];
  }

  const needsMe = tone === "action";
  const bucket: "needs" | "waiting" | "history" = needsMe ? "needs" : tone === "open" ? "waiting" : "history";

  return { isProposer, otherHandle, status, myTurn, myConfirmed, theirConfirmed, myItems, theirItems, summary, label, tone, bucket };
}
