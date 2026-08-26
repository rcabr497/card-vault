import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const binder = await prisma.binder.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!binder) {
    return NextResponse.json({ error: "Binder not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const enable = body?.enable !== false;

  if (!enable) {
    const updated = await prisma.binder.update({ where: { id: binder.id }, data: { isShared: false } });
    return NextResponse.json({ isShared: updated.isShared, shareSlug: updated.shareSlug });
  }

  const shareSlug = binder.shareSlug ?? randomBytes(6).toString("base64url");
  const updated = await prisma.binder.update({
    where: { id: binder.id },
    data: { isShared: true, shareSlug },
  });
  return NextResponse.json({ isShared: updated.isShared, shareSlug: updated.shareSlug });
}
