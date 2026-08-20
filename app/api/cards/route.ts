import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CardCategory, CardCondition } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const binderId = typeof body?.binderId === "string" ? body.binderId : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = typeof body?.category === "string" ? body.category : "";

  if (!binderId || !name || !Object.values(CardCategory).includes(category as CardCategory)) {
    return NextResponse.json({ error: "binderId, name, and a valid category are required." }, { status: 400 });
  }

  const binder = await prisma.binder.findFirst({ where: { id: binderId, userId: session.user.id } });
  if (!binder) {
    return NextResponse.json({ error: "Binder not found." }, { status: 404 });
  }

  const condition =
    typeof body?.condition === "string" && Object.values(CardCondition).includes(body.condition as CardCondition)
      ? (body.condition as CardCondition)
      : CardCondition.NM;

  const card = await prisma.card.create({
    data: {
      userId: session.user.id,
      binderId,
      category: category as CardCategory,
      name,
      setName: body?.setName || null,
      cardNumber: body?.cardNumber || null,
      year: body?.year ? Number(body.year) : null,
      team: body?.team || null,
      rarity: body?.rarity || null,
      condition,
      gradingCompany: body?.gradingCompany || null,
      grade: body?.grade || null,
      quantity: body?.quantity ? Math.max(1, Number(body.quantity)) : 1,
      purchasePrice: body?.purchasePrice ? Number(body.purchasePrice) : null,
      currentValue: body?.currentValue ? Number(body.currentValue) : null,
      imageUrl: body?.imageUrl || null,
      notes: body?.notes || null,
      metadataJson: body?.metadataJson ? JSON.stringify(body.metadataJson) : null,
    },
  });

  return NextResponse.json({ id: card.id });
}
