import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Update the signed-in user's display name.
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) {
    return NextResponse.json({ error: "Name must be 1–60 characters." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { name } });
  return NextResponse.json({ name });
}
