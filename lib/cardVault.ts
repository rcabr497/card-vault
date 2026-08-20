type IdentifyResult = {
  name: string | null;
  setName: string | null;
  cardNumber: string | null;
  year: number | null;
  rarity: string | null;
  confidence: number;
  needsReview: boolean;
};

export async function identifyCardImage(imageUrl: string, categoryHint?: string): Promise<IdentifyResult> {
  const apiKey = process.env.CARDVAULT_API_KEY;
  if (!apiKey) {
    throw new Error("CARDVAULT_API_KEY is not configured.");
  }

  const res = await fetch("https://aicardvault.io/api/v1/identify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      frontImageUrl: imageUrl,
      ...(categoryHint ? { category: categoryHint } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`CardVault identify failed (${res.status})`);
  }

  const data = await res.json();
  const card = data?.result?.card;

  return {
    name: card?.name ?? null,
    setName: card?.set ?? null,
    cardNumber: card?.number ?? null,
    year: card?.year ? Number(card.year) : null,
    rarity: card?.rarity ?? null,
    confidence: data?.result?.confidence ?? 0,
    needsReview: data?.result?.needsReview ?? true,
  };
}
