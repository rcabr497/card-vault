import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { lookupCardByName } from "@/lib/cardLookup";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const name = new URL(req.url).searchParams.get("name")?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  try {
    const result = await lookupCardByName(name);
    return NextResponse.json(result ?? { found: false });
  } catch {
    return NextResponse.json({ found: false });
  }
}
