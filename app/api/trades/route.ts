import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeHandle } from "@/lib/handle";
import { PROPOSAL_DAYS, TradeError, daysFromNow, parseNote, parseOffer, snapshotItems, validateOffer } from "@/lib/trades";
import { SERIALIZABLE, tradeErrorResponse } from "@/lib/tradeRoute";

// Propose a trade: the proposer offers only their own cards (or a gift), and
// the recipient adds their side by countering.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json().catch(() => null);
    const me = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { handle: true } });
    if (!me.handle) throw new TradeError(400, "Pick a trading handle before proposing a trade.");

    const handle = normalizeHandle(typeof body?.recipientHandle === "string" ? body.recipientHandle : "");
    const recipient = handle ? await prisma.user.findUnique({ where: { handle }, select: { id: true } }) : null;
    if (!recipient) throw new TradeError(404, handle ? `No one has the handle @${handle}.` : "Enter who you're trading with.");
    if (recipient.id === userId) throw new TradeError(400, "You can't trade with yourself.");

    const items = parseOffer(body?.cards);
    if (items.length === 0) throw new TradeError(400, "Pick at least one of your cards to offer.");
    const note = parseNote(body?.note);

    const trade = await prisma.$transaction(async (tx) => {
      const cards = await validateOffer(tx, userId, items);
      return tx.trade.create({
        data: {
          proposerId: userId,
          recipientId: recipient.id,
          awaitingUserId: recipient.id,
          note,
          expiresAt: daysFromNow(PROPOSAL_DAYS),
          items: { create: snapshotItems(items, cards) },
        },
      });
    }, SERIALIZABLE);

    return NextResponse.json({ id: trade.id });
  } catch (err) {
    return tradeErrorResponse(err);
  }
}
