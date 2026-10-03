import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleError, normalizeHandle } from "@/lib/handle";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const handle = normalizeHandle(typeof body?.handle === "string" ? body.handle : "");
  const problem = handleError(handle);
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 400 });
  }

  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { handle } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: `@${handle} is taken. Try another.` }, { status: 409 });
    }
    throw err;
  }
  return NextResponse.json({ handle });
}
