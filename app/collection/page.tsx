import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { AppShell } from "@/components/AppShell";
import { CardGridOrList } from "@/components/CardGridOrList";
import { CollectionControls } from "@/components/CollectionControls";
import { IconPlus } from "@/components/icons";
import { CardCategory, CardCondition, Prisma } from "@prisma/client";

const PAGE_SIZE = 24;

const CATEGORIES = [
  { value: "all", label: "All games" },
  { value: "pokemon", label: "Pokémon" },
  { value: "mtg", label: "Magic" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
] as const;

const CONDITIONS = ["All", "NM", "LP", "EX", "MINT"] as const;
const BINDER_FILTERS = [
  { value: "all", label: "All" },
  { value: "in", label: "In a binder" },
  { value: "loose", label: "Loose" },
] as const;

type SearchParams = {
  q?: string;
  category?: string;
  condition?: string;
  binder?: string;
  year?: string;
  team?: string;
  sort?: string;
  page?: string;
};

function orderByFor(sort: string): Prisma.CardOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name":
      return { name: "asc" };
    case "value-desc":
      return { currentValue: { sort: "desc", nulls: "last" } };
    case "value-asc":
      return { currentValue: { sort: "asc", nulls: "last" } };
    case "year-desc":
      return { year: { sort: "desc", nulls: "last" } };
    default:
      return { createdAt: "desc" };
  }
}

export default async function CollectionPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  const userId = session!.user.id;

  const q = searchParams.q ?? "";
  const category =
    searchParams.category && CATEGORIES.some((c) => c.value === searchParams.category)
      ? searchParams.category
      : "all";
  const condition =
    searchParams.condition && (CONDITIONS as readonly string[]).includes(searchParams.condition)
      ? (searchParams.condition as (typeof CONDITIONS)[number])
      : "All";
  const binder =
    searchParams.binder && BINDER_FILTERS.some((b) => b.value === searchParams.binder)
      ? searchParams.binder
      : "all";
  const year = searchParams.year && /^\d{4}$/.test(searchParams.year) ? searchParams.year : "";
  const team = searchParams.team ?? "";
  const sort = searchParams.sort ?? "newest";
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  const where: Prisma.CardWhereInput = {
    userId,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(category !== "all" ? { category: category as CardCategory } : {}),
    ...(condition !== "All" ? { condition: condition as CardCondition } : {}),
    ...(year ? { year: Number(year) } : {}),
    ...(team ? { team } : {}),
    ...(binder === "in" ? { binderCards: { some: {} } } : {}),
    ...(binder === "loose" ? { binderCards: { none: {} } } : {}),
  };

  const [user, totalCount, valueAgg, pageCards, yearRows, teamRows] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.card.count({ where }),
    prisma.card.aggregate({ where, _sum: { currentValue: true } }),
    prisma.card.findMany({
      where,
      orderBy: orderByFor(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { binderCards: { include: { binder: { select: { name: true } } } } },
    }),
    prisma.card.findMany({
      where: { userId, year: { not: null } },
      distinct: ["year"],
      select: { year: true },
      orderBy: { year: "desc" },
    }),
    prisma.card.findMany({
      where: { userId, team: { not: null } },
      distinct: ["team"],
      select: { team: true },
      orderBy: { team: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const years = yearRows.map((r) => r.year!).filter((y) => y != null);
  const teams = teamRows.map((r) => r.team!).filter(Boolean);

  const activeParams: Record<string, string> = {};
  if (q) activeParams.q = q;
  if (category !== "all") activeParams.category = category;
  if (condition !== "All") activeParams.condition = condition;
  if (binder !== "all") activeParams.binder = binder;
  if (year) activeParams.year = year;
  if (team) activeParams.team = team;
  if (sort !== "newest") activeParams.sort = sort;

  const linkWith = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ ...activeParams, page: String(page), ...overrides });
    for (const [k, v] of Array.from(params.entries())) if (!v) params.delete(k);
    return `/collection?${params.toString()}`;
  };

  // extraParams for CardGridOrList: everything except q (which it manages itself) and page.
  const gridExtraParams = { ...activeParams };
  delete gridExtraParams.q;

  return (
    <AppShell active="collection" user={{ name: user.name ?? user.email, plan: user.plan }}>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Collection</h1>
          <div className="topbar-subtitle">
            {totalCount.toLocaleString()} {totalCount === 1 ? "card" : "cards"} ·{" "}
            {formatMoney(valueAgg._sum.currentValue)} value
          </div>
        </div>
        <div className="topbar-actions">
          <Link href="/cards/new" className="btn btn-primary">
            <IconPlus />
            Add Card
          </Link>
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-row-label">Game:</span>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={linkWith({ category: c.value === "all" ? "" : c.value, page: "1" })}
            className={`pill${category === c.value ? " pill-active" : ""}`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="filter-row">
        <span className="filter-row-label">Condition:</span>
        {CONDITIONS.map((c) => (
          <Link
            key={c}
            href={linkWith({ condition: c === "All" ? "" : c, page: "1" })}
            className={`pill${condition === c ? " pill-active" : ""}`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="filter-row">
        <span className="filter-row-label">Binder:</span>
        {BINDER_FILTERS.map((b) => (
          <Link
            key={b.value}
            href={linkWith({ binder: b.value === "all" ? "" : b.value, page: "1" })}
            className={`pill${binder === b.value ? " pill-active" : ""}`}
          >
            {b.label}
          </Link>
        ))}
      </div>

      <div className="page-pad">
        <CollectionControls
          basePath="/collection"
          params={{ ...activeParams }}
          years={years}
          teams={teams}
        />

        <CardGridOrList
          cards={pageCards.map((c) => ({
            id: c.id,
            name: c.name,
            setName: c.setName,
            cardNumber: c.cardNumber,
            condition: c.condition,
            currentValue: formatMoney(c.currentValue),
            imageUrl: c.thumbnailUrl ?? c.imageUrl,
            binderName: c.binderCards.map((bc) => bc.binder.name).join("; ") || "—",
          }))}
          q={q}
          page={page}
          totalPages={totalPages}
          basePath="/collection"
          extraParams={gridExtraParams}
        />
      </div>
    </AppShell>
  );
}
