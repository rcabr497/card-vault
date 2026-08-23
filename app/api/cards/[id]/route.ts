import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CardCategory, CardCondition, Prisma } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const card = await prisma.card.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "A JSON body is required." }, { status: 400 });
  }

  const data: Prisma.CardUpdateInput = {};

  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name cannot be empty." }, { status: 400 });
    }
    data.name = name;
  }

  if ("category" in body) {
    if (!Object.values(CardCategory).includes(body.category as CardCategory)) {
      return NextResponse.json({ error: "A valid category is required." }, { status: 400 });
    }
    data.category = body.category as CardCategory;
  }

  if ("condition" in body) {
    if (!Object.values(CardCondition).includes(body.condition as CardCondition)) {
      return NextResponse.json({ error: "A valid condition is required." }, { status: 400 });
    }
    data.condition = body.condition as CardCondition;
  }

  if ("year" in body) {
    data.year = body.year ? Number(body.year) : null;
  }
  if ("quantity" in body) {
    data.quantity = body.quantity ? Math.max(1, Number(body.quantity)) : 1;
  }
  if ("purchasePrice" in body) {
    data.purchasePrice = body.purchasePrice ? Number(body.purchasePrice) : null;
  }
  if ("currentValue" in body) {
    const currentValue = body.currentValue ? Number(body.currentValue) : null;
    if (currentValue !== null && (!Number.isFinite(currentValue) || currentValue < 0)) {
      return NextResponse.json({ error: "A valid currentValue is required." }, { status: 400 });
    }
    data.currentValue = currentValue;
  }

  for (const key of ["setName", "cardNumber", "team", "rarity", "gradingCompany", "grade", "notes"] as const) {
    if (key in body) {
      data[key] = body[key] || null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  await prisma.card.update({ where: { id: card.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const card = await prisma.card.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  await prisma.card.delete({ where: { id: card.id } });
  return NextResponse.json({ ok: true });
}
