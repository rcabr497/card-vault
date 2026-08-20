import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const deck = await prisma.deck.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const data: { notes?: string; name?: string } = {};
  if (typeof body?.notes === "string") data.notes = body.notes;
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();

  await prisma.deck.update({ where: { id: deck.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const deck = await prisma.deck.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  await prisma.deck.delete({ where: { id: deck.id } });
  return NextResponse.json({ ok: true });
}
