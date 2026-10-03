import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { TradeError } from "./trades";

// Trade writes run as Serializable transactions so two requests can't promise
// the same copies at once; Postgres aborts the loser with P2034.
export const SERIALIZABLE = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable };

export function tradeErrorResponse(err: unknown) {
  if (err instanceof TradeError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
    return NextResponse.json({ error: "This trade changed at the same moment. Please try again." }, { status: 409 });
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
