import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { identifyCardImage } from "@/lib/cardSight";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : "";
  const categoryHint = typeof body?.categoryHint === "string" ? body.categoryHint : undefined;

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl is required." }, { status: 400 });
  }

  try {
    const result = await identifyCardImage(imageUrl, categoryHint);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Card recognition failed." },
      { status: 502 }
    );
  }
}
