import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";

function isUploadedFile(value: unknown): value is Blob & { name?: string } {
  return typeof value === "object" && value !== null && typeof (value as Blob).arrayBuffer === "function";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!isUploadedFile(file)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage isn't configured yet — add Blob storage in the Vercel dashboard." },
      { status: 503 }
    );
  }

  const filename = `${session.user.id}/${Date.now()}-${file.name || "upload"}`;
  try {
    const blob = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 502 }
    );
  }
}
