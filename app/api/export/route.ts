import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { columnsForScope, EXPORT_COLUMNS, type ExportScope } from "@/lib/exportColumns";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function baseRow(card: {
  name: string;
  category: string;
  setName: string | null;
  cardNumber: string | null;
  year: number | null;
  team: string | null;
  rarity: string | null;
  condition: string;
  gradingCompany: string | null;
  grade: string | null;
  quantity: number;
  purchasePrice: unknown;
  currentValue: unknown;
  notes: string | null;
  createdAt: Date;
}) {
  return {
    name: card.name,
    category: card.category,
    setName: card.setName ?? "",
    cardNumber: card.cardNumber ?? "",
    year: card.year ?? "",
    team: card.team ?? "",
    rarity: card.rarity ?? "",
    condition: card.condition,
    gradingCompany: card.gradingCompany ?? "",
    grade: card.grade ?? "",
    quantity: card.quantity,
    purchasePrice: card.purchasePrice != null ? Number(card.purchasePrice) : "",
    currentValue: card.currentValue != null ? Number(card.currentValue) : "",
    notes: card.notes ?? "",
    createdAt: card.createdAt.toISOString().slice(0, 10),
  };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") as ExportScope | null;
  const id = searchParams.get("id");
  const requestedColumns = (searchParams.get("columns") ?? "").split(",").filter(Boolean);

  if (scope !== "collection" && scope !== "binder" && scope !== "deck") {
    return NextResponse.json({ error: "scope must be collection, binder, or deck." }, { status: 400 });
  }
  if ((scope === "binder" || scope === "deck") && !id) {
    return NextResponse.json({ error: "id is required for binder/deck scope." }, { status: 400 });
  }

  const validKeys = new Set(columnsForScope(scope).map((c) => c.key));
  const columns = EXPORT_COLUMNS.filter((c) => validKeys.has(c.key) && requestedColumns.includes(c.key));
  if (columns.length === 0) {
    return NextResponse.json({ error: "At least one valid column is required." }, { status: 400 });
  }

  let rows: Record<string, unknown>[] = [];
  let filenamePart = "collection";

  if (scope === "collection") {
    const cards = await prisma.card.findMany({
      where: { userId },
      include: { binderCards: { include: { binder: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    rows = cards.map((c) => ({
      ...baseRow(c),
      binderName: c.binderCards.map((bc) => bc.binder.name).join("; ") || "—",
    }));
  } else if (scope === "binder") {
    const binder = await prisma.binder.findFirst({ where: { id: id!, userId } });
    if (!binder) {
      return NextResponse.json({ error: "Binder not found." }, { status: 404 });
    }
    const cards = await prisma.card.findMany({
      where: { binderCards: { some: { binderId: binder.id } } },
      orderBy: { createdAt: "desc" },
    });
    rows = cards.map((c) => baseRow(c));
    filenamePart = slugify(binder.name);
  } else {
    const deck = await prisma.deck.findFirst({ where: { id: id!, userId } });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found." }, { status: 404 });
    }
    const deckCards = await prisma.deckCard.findMany({
      where: { deckId: deck.id },
      include: { card: { include: { binderCards: { include: { binder: { select: { name: true } } } } } } },
      orderBy: { card: { name: "asc" } },
    });
    rows = deckCards.map((dc) => ({
      ...baseRow(dc.card),
      binderName: dc.card.binderCards.map((bc) => bc.binder.name).join("; ") || "—",
      deckQuantity: dc.quantity,
    }));
    filenamePart = slugify(deck.name);
  }

  const csv = toCsv(rows, columns);
  const filename = `card-vault-${filenamePart}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
