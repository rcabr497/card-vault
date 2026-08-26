import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { AppShell } from "@/components/AppShell";
import { IconPlus, IconChevronLeft, IconChevronRight } from "@/components/icons";
import { BinderSearchInput } from "@/components/BinderSearchInput";
import { DeleteBinderButton } from "@/components/DeleteBinderButton";
import { BinderShareToggle } from "@/components/BinderShareToggle";
import { CardCondition } from "@prisma/client";

const PAGE_SIZE = 15;
const CONDITIONS = ["All", "NM", "LP", "EX", "MINT"] as const;

export default async function BinderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { q?: string; condition?: string; page?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;

  const binder = await prisma.binder.findFirst({ where: { id: params.id, userId } });
  if (!binder) notFound();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const condition =
    searchParams.condition && (CONDITIONS as readonly string[]).includes(searchParams.condition)
      ? (searchParams.condition as (typeof CONDITIONS)[number])
      : "All";
  const q = searchParams.q ?? "";
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  const where = {
    binderCards: { some: { binderId: binder.id } },
    ...(condition !== "All" ? { condition: condition as CardCondition } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [totalCount, cards, allBinderCards] = await Promise.all([
    prisma.card.count({ where }),
    prisma.card.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.card.findMany({
      where: { binderCards: { some: { binderId: binder.id } } },
      select: { currentValue: true, quantity: true },
    }),
  ]);

  const totalValue = allBinderCards.reduce((s, c) => s + Number(c.currentValue ?? 0) * c.quantity, 0);
  const totalCards = allBinderCards.reduce((s, c) => s + c.quantity, 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const linkWith = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ q, condition, page: String(page), ...overrides });
    if (!params.get("q")) params.delete("q");
    return `/binders/${binder.id}?${params.toString()}`;
  };

  return (
    <AppShell active="binders" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <Link href="/binders" className="back-link">
            ← All binders
          </Link>
          <h1 className="topbar-title">Binder — {binder.name}</h1>
          <div className="topbar-subtitle">
            {totalCards} cards · {formatMoney(totalValue)} value
          </div>
        </div>
        <div className="topbar-actions">
          <BinderSearchInput binderId={binder.id} initialQ={q} condition={condition} />
          <Link href={`/binders/${binder.id}/add`} className="btn btn-primary">
            <IconPlus />
            Add Card
          </Link>
          <BinderShareToggle binderId={binder.id} initialShared={binder.isShared} initialSlug={binder.shareSlug} />
          <DeleteBinderButton binderId={binder.id} />
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-row-label">Filter:</span>
        {CONDITIONS.map((c) => (
          <Link key={c} href={linkWith({ condition: c, page: "1" })} className={`pill${condition === c ? " pill-active" : ""}`}>
            {c}
          </Link>
        ))}
      </div>

      <div className="page-pad">
        {cards.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "var(--text-soft)" }}>No cards match this filter.</p>
        ) : (
          <div className="grid grid-5">
            {cards.map((c) => (
              <Link key={c.id} href={`/cards/${c.id}`} className="tile" style={{ padding: 12, gap: 8 }}>
                <div className="card-photo">
                  {c.thumbnailUrl ?? c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnailUrl ?? c.imageUrl ?? undefined}
                      alt={c.name}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="card-photo-label">CARD PHOTO</span>
                  )}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-soft)" }}>{c.cardNumber ?? "—"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className={`condition-pill condition-${c.condition}`}>{c.condition}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-ink)" }}>
                    {formatMoney(c.currentValue)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pager">
            <span style={{ fontSize: 12.5, color: "var(--text-soft)" }}>
              Binder page {page} of {totalPages}
            </span>
            <div className="pager-controls">
              <Link href={linkWith({ page: String(Math.max(1, page - 1)) })} className="pager-btn">
                <IconChevronLeft />
              </Link>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={linkWith({ page: String(p) })} className={`pager-btn${p === page ? " active" : ""}`}>
                  {p}
                </Link>
              ))}
              <Link href={linkWith({ page: String(Math.min(totalPages, page + 1)) })} className="pager-btn">
                <IconChevronRight />
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
