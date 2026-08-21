import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  const currentValue = Number(body?.currentValue);
  if (!Number.isFinite(currentValue) || currentValue < 0) {
    return NextResponse.json({ error: "A valid currentValue is required." }, { status: 400 });
  }

  await prisma.card.update({ where: { id: card.id }, data: { currentValue } });
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
