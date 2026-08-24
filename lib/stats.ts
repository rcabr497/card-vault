import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getDashboardStats(userId: string) {
  const cards = await prisma.card.findMany({
    where: { userId },
    select: { quantity: true, currentValue: true, setName: true, createdAt: true },
  });

  const cardsLogged = cards.reduce((sum, c) => sum + c.quantity, 0);
  const totalValue = cards.reduce((sum, c) => sum + Number(c.currentValue ?? 0) * c.quantity, 0);
  const setsTracked = new Set(cards.filter((c) => c.setName).map((c) => c.setName)).size;
  const bindersCount = await prisma.binder.count({ where: { userId } });

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString("en-US", { month: "short" }) };
  });

  const cumulativeAt = (year: number, month: number) => {
    const cutoff = new Date(year, month + 1, 1);
    return cards
      .filter((c) => c.createdAt < cutoff)
      .reduce((sum, c) => sum + Number(c.currentValue ?? 0) * c.quantity, 0);
  };

  const trendValues = months.map((m) => cumulativeAt(m.year, m.month));
  const maxTrend = Math.max(1, ...trendValues);

  const trend = months.map((m, i) => ({
    label: m.label,
    h: `${Math.max(4, Math.round((trendValues[i] / maxTrend) * 100))}%`,
  }));

  const recent = await prisma.card.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { id: true, name: true, setName: true, currentValue: true, imageUrl: true, thumbnailUrl: true },
  });

  return {
    stats: [
      { label: "Cards logged", value: cardsLogged.toLocaleString() },
      { label: "Total value", value: formatMoney(totalValue) },
      { label: "Sets tracked", value: setsTracked.toLocaleString() },
      { label: "Binders", value: bindersCount.toLocaleString() },
    ],
    recent: recent.map((c) => ({
      id: c.id,
      name: c.name,
      set: c.setName ?? "—",
      value: formatMoney(Number(c.currentValue ?? 0)),
      imageUrl: c.thumbnailUrl ?? c.imageUrl,
    })),
    trend,
  };
}

export function formatMoney(value: number | Prisma.Decimal | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const CATEGORY_LABELS: Record<string, string> = {
  pokemon: "Pokémon",
  mtg: "Magic: The Gathering",
  sports: "Sports",
  other: "Other",
};

export type PublicShowcaseCard = {
  name: string;
  label: string;
  value: string;
  condition: string;
  imageUrl: string | null;
};

export async function getPublicShowcase(): Promise<{
  cards: PublicShowcaseCard[];
  cardsLogged: number;
  totalValue: string;
} | null> {
  const cardsLogged = await prisma.card.count();
  if (cardsLogged < 6) return null;

  const [{ _sum }, recent] = await Promise.all([
    prisma.card.aggregate({ _sum: { currentValue: true } }),
    prisma.card.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        name: true,
        category: true,
        setName: true,
        team: true,
        condition: true,
        currentValue: true,
        thumbnailUrl: true,
        imageUrl: true,
      },
    }),
  ]);

  return {
    cardsLogged,
    totalValue: formatMoney(_sum.currentValue),
    cards: recent.map((c) => ({
      name: c.name,
      label: c.team ?? c.setName ?? CATEGORY_LABELS[c.category] ?? "Other",
      value: formatMoney(c.currentValue),
      condition: c.condition,
      imageUrl: c.thumbnailUrl ?? c.imageUrl ?? null,
    })),
  };
}
