import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { needsActionWhere } from "@/lib/trades";

// How many trades are waiting on the signed-in user (nav badge).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }
  const count = await prisma.trade.count({ where: needsActionWhere(session.user.id) });
  return NextResponse.json({ count });
}
