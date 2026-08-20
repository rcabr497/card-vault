import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AddCardForm } from "@/components/AddCardForm";

export default async function AddCardPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user.id;

  const binder = await prisma.binder.findFirst({ where: { id: params.id, userId } });
  if (!binder) notFound();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  return (
    <AppShell active="binders" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href={`/binders/${binder.id}`} className="back-link">
            ← {binder.name}
          </Link>
          <h1 className="topbar-title">Add Card</h1>
        </div>
      </div>
      <div className="page-pad">
        <AddCardForm binderId={binder.id} binderType={binder.type} />
      </div>
    </AppShell>
  );
}
