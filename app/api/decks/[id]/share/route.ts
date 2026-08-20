import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const deck = await prisma.deck.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const enable = body?.enable !== false;

  if (!enable) {
    const updated = await prisma.deck.update({ where: { id: deck.id }, data: { isShared: false } });
    return NextResponse.json({ isShared: updated.isShared, shareSlug: updated.shareSlug });
  }

  const shareSlug = deck.shareSlug ?? randomBytes(6).toString("base64url");
  const updated = await prisma.deck.update({
    where: { id: deck.id },
    data: { isShared: true, shareSlug },
  });
  return NextResponse.json({ isShared: updated.isShared, shareSlug: updated.shareSlug });
}
