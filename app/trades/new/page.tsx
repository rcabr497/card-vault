import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { HandleForm } from "@/components/HandleForm";
import { ProposeTradeForm } from "@/components/ProposeTradeForm";
import { normalizeHandle } from "@/lib/handle";
import { pickerCards } from "@/lib/trades";

export default async function NewTradePage({ searchParams }: { searchParams: { with?: string } }) {
  const session = await auth();
  const userId = session!.user.id;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const withHandle = normalizeHandle(searchParams.with ?? "");
  const recipient = withHandle ? await prisma.user.findUnique({ where: { handle: withHandle }, select: { id: true } }) : null;

  return (
    <AppShell active="trades" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href="/trades" className="back-link">
            ← Trades
          </Link>
          <h1 className="topbar-title">{recipient ? `New trade with @${withHandle}` : "New trade"}</h1>
        </div>
      </div>
      <div className="page-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {withHandle && !recipient && <div className="form-error" style={{ maxWidth: 560 }}>No one has the handle @{withHandle}.</div>}
        {recipient?.id === userId && (
          <div className="form-error" style={{ maxWidth: 560 }}>That&apos;s your own trade link — share it with someone else.</div>
        )}

        {!user.handle ? (
          <div className="surface-card" style={{ padding: 24, maxWidth: 560, display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, margin: 0 }}>First, choose your trading handle</h2>
            <p style={{ fontSize: 14, color: "var(--text-soft)", margin: 0 }}>
              It&apos;s how {recipient ? `@${withHandle}` : "other collectors"} will see you. Your name and email stay private.
            </p>
            <HandleForm initial={null} />
          </div>
        ) : (
          <ProposeTradeForm
            initialHandle={recipient && recipient.id !== userId ? withHandle : ""}
            cards={await pickerCards(prisma, userId)}
          />
        )}
      </div>
    </AppShell>
  );
}
