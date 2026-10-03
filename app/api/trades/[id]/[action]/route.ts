import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ACCEPTED_DAYS,
  PROPOSAL_DAYS,
  TradeError,
  daysFromNow,
  effectiveStatus,
  parseNote,
  parseOffer,
  snapshotItems,
  transferItems,
  validateOffer,
  type OfferItem,
} from "@/lib/trades";
import { SERIALIZABLE, tradeErrorResponse } from "@/lib/tradeRoute";

const ACTIONS = new Set(["accept", "decline", "counter", "cancel", "confirm"]);

export async function POST(req: Request, { params }: { params: { id: string; action: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;
  if (!ACTIONS.has(params.action)) {
    return NextResponse.json({ error: "Unknown action." }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));

  try {
    const result = await prisma.$transaction(async (tx) => {
      const trade = await tx.trade.findUnique({ where: { id: params.id }, include: { items: true } });
      // Non-participants get the same answer as a missing trade.
      if (!trade || (trade.proposerId !== userId && trade.recipientId !== userId)) {
        throw new TradeError(404, "Trade not found.");
      }
      const otherId = trade.proposerId === userId ? trade.recipientId : trade.proposerId;
      const status = effectiveStatus(trade);
      const myTurn = status === "proposed" && trade.awaitingUserId === userId;

      if (status === "expired") throw new TradeError(409, "This trade expired.");

      // Current items grouped as offers per owner, for re-validation.
      const offerOf = (ownerId: string): OfferItem[] =>
        trade.items
          .filter((i) => i.ownerId === ownerId)
          .map((i) => {
            if (!i.cardId) throw new TradeError(409, `“${i.name}” is no longer in its owner's collection.`);
            return { cardId: i.cardId, quantity: i.quantity };
          });

      switch (params.action) {
        case "accept": {
          if (!myTurn) throw new TradeError(409, "This trade isn't waiting on you.");
          await validateOffer(tx, trade.proposerId, offerOf(trade.proposerId), trade.id);
          await validateOffer(tx, trade.recipientId, offerOf(trade.recipientId), trade.id);
          await tx.trade.update({
            where: { id: trade.id },
            data: { status: "accepted", awaitingUserId: null, expiresAt: daysFromNow(ACCEPTED_DAYS) },
          });
          return { status: "accepted" };
        }

        case "decline": {
          if (!myTurn) throw new TradeError(409, "This trade isn't waiting on you.");
          await tx.trade.update({ where: { id: trade.id }, data: { status: "declined", awaitingUserId: null } });
          return { status: "declined" };
        }

        case "cancel": {
          if (status !== "proposed" && status !== "accepted") throw new TradeError(409, "This trade is already closed.");
          await tx.trade.update({ where: { id: trade.id }, data: { status: "cancelled", awaitingUserId: null } });
          return { status: "cancelled" };
        }

        case "counter": {
          if (!myTurn) throw new TradeError(409, "This trade isn't waiting on you.");
          const mine = parseOffer(body?.mine);
          const theirs = parseOffer(body?.theirs);
          // You can change your own side freely, but only trim theirs — you
          // can't add cards from someone else's collection.
          const before = new Map(
            trade.items.filter((i) => i.ownerId === otherId && i.cardId).map((i) => [i.cardId as string, i.quantity])
          );
          for (const item of theirs) {
            const had = before.get(item.cardId);
            if (had === undefined || item.quantity > had) {
              throw new TradeError(400, "You can remove cards from their side, but not add to it.");
            }
          }
          if (mine.length + theirs.length === 0) throw new TradeError(400, "A trade needs at least one card.");

          const myCards = await validateOffer(tx, userId, mine, trade.id);
          const theirCards = await validateOffer(tx, otherId, theirs, trade.id);
          await tx.tradeItem.deleteMany({ where: { tradeId: trade.id } });
          await tx.trade.update({
            where: { id: trade.id },
            data: {
              revision: { increment: 1 },
              awaitingUserId: otherId,
              note: parseNote(body?.note),
              expiresAt: daysFromNow(PROPOSAL_DAYS),
              items: { create: [...snapshotItems(mine, myCards), ...snapshotItems(theirs, theirCards)] },
            },
          });
          return { status: "proposed" };
        }

        case "confirm": {
          if (status !== "accepted") throw new TradeError(409, "Only an accepted trade can be confirmed.");
          const isProposer = trade.proposerId === userId;
          const now = new Date();
          const updated = await tx.trade.update({
            where: { id: trade.id },
            data: isProposer ? { proposerConfirmedAt: trade.proposerConfirmedAt ?? now } : { recipientConfirmedAt: trade.recipientConfirmedAt ?? now },
          });
          if (!updated.proposerConfirmedAt || !updated.recipientConfirmedAt) return { status: "accepted" };

          // Both done: claim the trade, then move the records. The claim makes a
          // simultaneous second confirm a no-op instead of a double transfer.
          const claimed = await tx.trade.updateMany({
            where: { id: trade.id, status: "accepted" },
            data: { status: "completed", completedAt: now },
          });
          if (claimed.count === 1) await transferItems(tx, trade);
          return { status: "completed" };
        }
      }
      throw new TradeError(404, "Unknown action.");
    }, SERIALIZABLE);

    return NextResponse.json(result);
  } catch (err) {
    return tradeErrorResponse(err);
  }
}
