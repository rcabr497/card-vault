// Extra per-card data from the card providers, stored as-is in Card.metadataJson.
// We keep the provider's own record (trimmed) rather than mapping it into our
// own columns, so what we *show* can change without re-fetching anything.

export type CardDetailsSource = "cardsight" | "scryfall" | "pokemontcg";

export type CardDetails = {
  v: 1;
  source: CardDetailsSource;
  fetchedAt: string;
  data: Record<string, unknown>;
};

// mana: the value contains Magic mana/tap symbols like {R} or {2}{U} to draw as icons.
export type DetailRow = { label: string; value: string; mana?: boolean };
export type DetailChip = { label: string; on: boolean };
export type DetailSection = {
  title: string;
  rows: DetailRow[];
  // What the card *is* (rules, attacks, parallels) — shown first and wider.
  primary?: boolean;
  // Yes/no lists such as format legality, drawn as chips instead of rows.
  chips?: DetailChip[];
  // Long lists show this many rows, with the rest behind a "Show all" toggle.
  collapseAfter?: number;
};
export type PresentedDetails = {
  sourceLabel: string;
  fetchedAt: string;
  sections: DetailSection[];
  raw: DetailRow[];
};

// The real Pokémon TCG types. CardSight tags a Pokémon's elemental type as a
// "pokemon-<type>" entry in `attributes`, mixed in with other tags.
export const POKEMON_TYPES = [
  "grass",
  "fire",
  "water",
  "lightning",
  "psychic",
  "fighting",
  "darkness",
  "metal",
  "fairy",
  "dragon",
  "colorless",
];

type Data = Record<string, unknown>;

export function parseCardDetails(json: string | null): CardDetails | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (parsed && parsed.v === 1 && typeof parsed.source === "string" && parsed.data && typeof parsed.data === "object") {
      return parsed as CardDetails;
    }
  } catch {
    // fall through — unreadable metadata is treated as none
  }
  return null;
}

// --- small helpers ---------------------------------------------------------

function text(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t ? t : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return null;
}

// Rows whose text can hold mana symbols (Magic cost, rules/oracle text).
const MANA_LABELS = new Set(["Mana cost", "Rules text"]);

function rows(pairs: [string, unknown][]): DetailRow[] {
  return pairs.flatMap(([label, v]) => {
    const value = text(v);
    return value ? [{ label, value, ...(MANA_LABELS.has(label) ? { mana: true } : {}) }] : [];
  });
}

function titleCase(s: string): string {
  return s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function money(v: unknown, symbol = "$"): string | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? `${symbol}${n.toFixed(2)}` : null;
}

function asObject(v: unknown): Data {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Data) : {};
}

function asObjects(v: unknown): Data[] {
  return Array.isArray(v) ? v.filter((x): x is Data => !!x && typeof x === "object") : [];
}

function asStrings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

const MTG_COLOR_NAMES: Record<string, string> = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green" };

function colorNames(raw: string | string[]): string {
  const letters = (Array.isArray(raw) ? raw.join("") : raw).replace(/[^WUBRGwubrg]/g, "").toUpperCase().split("");
  return letters.length ? letters.map((l) => MTG_COLOR_NAMES[l]).join(", ") : "Colorless";
}

type SectionExtra = Pick<DetailSection, "primary" | "chips" | "collapseAfter">;

function section(sections: DetailSection[], title: string, sectionRows: DetailRow[], extra?: SectionExtra) {
  if (sectionRows.length || extra?.chips?.length) sections.push({ title, rows: sectionRows, ...extra });
}

// Legality as chips: every listed format, lit when the card is legal in it.
function legalityChips(entries: [string, boolean][]): DetailChip[] {
  return entries.map(([label, on]) => ({ label, on }));
}

// --- CardSight -------------------------------------------------------------

function cardSightFields(data: Data): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of asObjects(data.fields)) {
    const key = text(f.key);
    if (key) out[key] = typeof f.value === "string" || typeof f.value === "number" ? String(f.value).trim() : "";
  }
  return out;
}

function presentCardSight(data: Data, category: string): DetailSection[] {
  const f = cardSightFields(data);
  const attrs = asStrings(data.attributes);
  const description = text(data.description);
  const releaseName = text(data.releaseName);
  const sections: DetailSection[] = [];

  const kind =
    category === "pokemon" || category === "mtg"
      ? category
      : attrs.some((a) => a.startsWith("mtg-"))
        ? "mtg"
        : attrs.some((a) => a.startsWith("pokemon-"))
          ? "pokemon"
          : "sports";

  const legal = (prefix: string) => attrs.filter((a) => a.startsWith(prefix)).map((a) => titleCase(a.slice(prefix.length)));

  if (kind === "mtg") {
    section(sections, "Rules", rows([["Type line", f.TYPE_LINE], ["Rules text", description], ["Flavor text", f.FLAVOR_TEXT]]), {
      primary: true,
    });
    section(
      sections,
      "Cost & colors",
      rows([
        ["Mana cost", f.CASTING_COST],
        ["Mana value", f.MANA_VALUE],
        ["Color identity", f.COLOR_IDENTITY !== undefined ? colorNames(f.COLOR_IDENTITY) : null],
      ])
    );
    section(
      sections,
      "Print info",
      rows([
        ["Set", releaseName],
        ["Rarity", f.RARITY],
        ["Artist", f.ARTIST],
        ["Border", f.BORDER_COLOR ? titleCase(f.BORDER_COLOR) : null],
        ["Promo type", f.PROMO_TYPES],
        ["Released", f.RELEASE_DATE],
        ["Set code", f.RELEASE_CODE],
        ["Language", f.LANGUAGE],
      ])
    );
    section(sections, "Format legality", [], { chips: legalityChips(legal("mtg-legal-").map((l) => [l, true])) });
    section(
      sections,
      "Card tags",
      rows([["Tags", attrs.filter((a) => a.startsWith("mtg-") && !a.startsWith("mtg-legal-")).map((a) => titleCase(a.slice(4))).join(", ")]])
    );
  } else if (kind === "pokemon") {
    const types = attrs
      .map((a) => a.match(/^pokemon-(.+)$/)?.[1])
      .filter((t): t is string => !!t && POKEMON_TYPES.includes(t))
      .map(titleCase)
      .join(", ");
    const tags = attrs
      .filter((a) => a.startsWith("pokemon-") && !a.startsWith("pokemon-legal-") && !POKEMON_TYPES.includes(a.slice(8)))
      .map((a) => titleCase(a.slice(8)))
      .join(", ");
    const number = text(data.number);
    section(
      sections,
      "Battle",
      rows([["Type", types], ["HP", f.HP], ["Weakness", f.WEAKNESS], ["Retreat cost", f.RETREAT_COST], ["Card tags", tags]]),
      { primary: true }
    );
    section(sections, "Rules / attacks", rows([["Text", description]]), { primary: true });
    section(sections, "Evolution & Pokédex", rows([["Evolves from", f.EVOLVES_FROM], ["Pokédex #", f.POKEDEX_NUMBER]]));
    section(
      sections,
      "Print info",
      rows([
        ["Set", releaseName],
        ["Series", f.SERIES],
        ["Card #", number ? (f.PRINTED_TOTAL ? `${number} / ${f.PRINTED_TOTAL}` : number) : null],
        ["Set size (with secrets)", f.ACTUAL_TOTAL],
        ["Rarity", f.RARITY],
        ["Artist", f.ARTIST],
        ["Regulation mark", f.REGULATION_MARK],
        ["Released", f.RELEASE_DATE],
        ["Set code", f.RELEASE_CODE],
        ["Language", f.LANGUAGE],
      ])
    );
    section(sections, "Format legality", [], { chips: legalityChips(legal("pokemon-legal-").map((l) => [l, true])) });
  } else {
    // Sports: the catalog record is mostly product info, a league-team tag
    // (e.g. "MLB-LAA"), and the list of parallels with their print runs.
    const leaguePattern = /^[A-Za-z]{2,6}-[A-Za-z0-9]+$/;
    const league = attrs
      .filter((a) => leaguePattern.test(a))
      .map((a) => {
        const [l, ...t] = a.split("-");
        return `${l.toUpperCase()} · ${t.join("-").toUpperCase()}`;
      });
    const otherTags = attrs.filter((a) => !leaguePattern.test(a)).map(titleCase);
    section(
      sections,
      "Print info",
      rows([
        ["Product", releaseName],
        ["Set", data.setName],
        ["Year", data.releaseYear],
        ["Card #", data.number],
      ])
    );
    section(sections, "Team / league", rows([["League · team", league.join(", ")], ["Tags", otherTags.join(", ")]]));

    const parallels = asObjects(data.parallels);
    if (parallels.length) {
      section(
        sections,
        `Parallels (${text(data.parallelCount) ?? parallels.length})`,
        parallels.map((p) => ({
          label: text(p.name) ?? "Parallel",
          value: typeof p.numberedTo === "number" ? `/${p.numberedTo}` : "Unnumbered",
        })),
        { primary: true, collapseAfter: 8 }
      );
    }
  }

  return sections;
}

// --- Scryfall (Magic, manual lookup) ---------------------------------------

function presentScryfall(d: Data): DetailSection[] {
  const sections: DetailSection[] = [];
  const faces = asObjects(d.card_faces);
  const oracle =
    text(d.oracle_text) ??
    (faces.length
      ? faces
          .map((face) => [text(face.name), text(face.type_line), text(face.oracle_text)].filter(Boolean).join("\n"))
          .join("\n\n— — —\n\n")
      : null);
  const power = text(d.power);
  const toughness = text(d.toughness);
  const colors = asStrings(d.colors);
  const identity = asStrings(d.color_identity);
  const prices = asObject(d.prices);
  const legalities = asObject(d.legalities);

  section(
    sections,
    "Rules",
    rows([
      ["Type line", d.type_line],
      ["Rules text", oracle],
      ["Power / toughness", power && toughness ? `${power} / ${toughness}` : null],
      ["Loyalty", d.loyalty],
      ["Keywords", asStrings(d.keywords).join(", ")],
      ["Flavor text", d.flavor_text],
    ]),
    { primary: true }
  );
  section(
    sections,
    "Cost & colors",
    rows([
      ["Mana cost", d.mana_cost],
      ["Mana value", d.cmc],
      ["Colors", Array.isArray(d.colors) ? colorNames(colors) : null],
      ["Color identity", Array.isArray(d.color_identity) ? colorNames(identity) : null],
    ])
  );
  section(
    sections,
    "Print info",
    rows([
      ["Set", d.set_name],
      ["Set code", text(d.set)?.toUpperCase()],
      ["Card #", d.collector_number],
      ["Rarity", text(d.rarity) ? titleCase(String(d.rarity)) : null],
      ["Artist", d.artist],
      ["Released", d.released_at],
      ["Finishes", asStrings(d.finishes).map(titleCase).join(", ")],
      ["Border", text(d.border_color) ? titleCase(String(d.border_color)) : null],
      ["Language", text(d.lang)?.toUpperCase()],
      ["EDHREC rank", d.edhrec_rank],
      ["Reserved list", d.reserved === true ? "Yes" : null],
    ])
  );
  section(
    sections,
    "Prices",
    rows([
      ["USD", money(prices.usd)],
      ["USD foil", money(prices.usd_foil)],
      ["USD etched", money(prices.usd_etched)],
      ["EUR", money(prices.eur, "€")],
      ["MTGO tix", prices.tix],
    ])
  );
  section(sections, "Format legality", [], {
    chips: legalityChips(Object.entries(legalities).map(([k, v]) => [titleCase(k), v === "legal" || v === "restricted"])),
  });
  return sections;
}

// --- Pokémon TCG API (manual lookup) ---------------------------------------

function presentPokemonTcg(d: Data): DetailSection[] {
  const sections: DetailSection[] = [];
  const set = asObject(d.set);
  const pair = (list: Data[]) => list.map((w) => [text(w.type), text(w.value)].filter(Boolean).join(" ")).join(", ");
  const retreat = asStrings(d.retreatCost);
  const number = text(d.number);
  const printedTotal = text(set.printedTotal);
  const tcgPrices = asObject(asObject(d.tcgplayer).prices);
  const cardmarket = asObject(asObject(d.cardmarket).prices);
  const legalities = asObject(d.legalities);

  section(
    sections,
    "Battle",
    rows([
      ["Type", asStrings(d.types).join(", ")],
      ["HP", d.hp],
      ["Supertype", d.supertype],
      ["Subtypes", asStrings(d.subtypes).join(", ")],
      ["Weakness", pair(asObjects(d.weaknesses))],
      ["Resistance", pair(asObjects(d.resistances))],
      ["Retreat cost", retreat.length ? `${retreat.length} (${retreat.join(", ")})` : null],
    ]),
    { primary: true }
  );
  section(
    sections,
    "Abilities",
    asObjects(d.abilities).flatMap((a) => {
      const value = text(a.text);
      return value ? [{ label: [text(a.name), text(a.type) && `(${text(a.type)})`].filter(Boolean).join(" "), value }] : [];
    }),
    { primary: true }
  );
  section(
    sections,
    "Attacks",
    asObjects(d.attacks).map((a) => {
      const cost = asStrings(a.cost);
      return {
        label: [text(a.name), cost.length ? `[${cost.join(", ")}]` : null].filter(Boolean).join(" ") || "Attack",
        value: [text(a.damage), text(a.text)].filter(Boolean).join(" — ") || "—",
      };
    }),
    { primary: true }
  );
  section(sections, "Rules & flavor", rows([["Rules", asStrings(d.rules).join("\n")], ["Flavor text", d.flavorText]]), {
    primary: true,
  });
  section(
    sections,
    "Evolution & Pokédex",
    rows([
      ["Evolves from", d.evolvesFrom],
      ["Evolves to", asStrings(d.evolvesTo).join(", ")],
      ["Pokédex #", Array.isArray(d.nationalPokedexNumbers) ? d.nationalPokedexNumbers.join(", ") : null],
    ])
  );
  section(
    sections,
    "Print info",
    rows([
      ["Set", set.name],
      ["Series", set.series],
      ["Card #", number ? (printedTotal ? `${number} / ${printedTotal}` : number) : null],
      ["Rarity", d.rarity],
      ["Artist", d.artist],
      ["Released", set.releaseDate],
      ["Set code", set.ptcgoCode],
    ])
  );
  section(
    sections,
    "Prices",
    [
      ...Object.entries(tcgPrices).flatMap(([finish, p]) => {
        const o = asObject(p);
        const market = money(o.market);
        if (!market) return [];
        const range = [money(o.low), money(o.high)].filter(Boolean).join(" – ");
        return [{ label: `TCGplayer ${titleCase(finish)}`, value: range ? `${market} (${range})` : market }];
      }),
      ...rows([
        ["Cardmarket average", money(cardmarket.averageSellPrice, "€")],
        ["Cardmarket trend", money(cardmarket.trendPrice, "€")],
      ]),
    ]
  );
  section(sections, "Format legality", [], {
    chips: legalityChips(Object.entries(legalities).map(([format, status]) => [titleCase(format), text(status)?.toLowerCase() === "legal"])),
  });
  return sections;
}

// --- raw table -------------------------------------------------------------

function flatten(v: unknown, path: string, out: DetailRow[]) {
  if (v === null || v === undefined) return;
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x !== "object" || x === null)) {
      const t = v.map(text).filter(Boolean).join(", ");
      if (t) out.push({ label: path, value: t });
    } else {
      v.forEach((x, i) => flatten(x, `${path}[${i}]`, out));
    }
    return;
  }
  if (typeof v === "object") {
    for (const [k, val] of Object.entries(v as Data)) flatten(val, path ? `${path}.${k}` : k, out);
    return;
  }
  const t = text(v);
  if (t) out.push({ label: path, value: t });
}

// CardSight's `fields` is a list of {key, value} pairs and its parallels are a
// long list of objects — reshape both so the raw table reads as key → value.
function rawSource(details: CardDetails): Data {
  if (details.source !== "cardsight") return details.data;
  return {
    ...details.data,
    fields: cardSightFields(details.data),
    parallels: asObjects(details.data.parallels).map(
      (p) => `${text(p.name) ?? "Parallel"}${typeof p.numberedTo === "number" ? ` /${p.numberedTo}` : ""}`
    ),
  };
}

// --- entry point -----------------------------------------------------------

// Rows that just repeat what the card's own record already shows at the top of
// the page (set, number, year, rarity...). Dropped only when the values match.
const DEDUPE_LABELS = new Set(["Set", "Product", "Card #", "Year", "Rarity"]);

function dropKnown(sections: DetailSection[], known: Set<string>): DetailSection[] {
  return sections
    .map((s) => ({ ...s, rows: s.rows.filter((r) => !(DEDUPE_LABELS.has(r.label) && known.has(r.value.trim().toLowerCase()))) }))
    .filter((s) => s.rows.length > 0 || (s.chips?.length ?? 0) > 0);
}

// Primary sections (rules, attacks, parallels) first; order is otherwise kept.
function primaryFirst(sections: DetailSection[]): DetailSection[] {
  return [...sections.filter((s) => s.primary), ...sections.filter((s) => !s.primary)];
}

export function presentCardDetails(
  details: CardDetails,
  category: string,
  // The card's own stored values, so provider rows that only repeat them can be dropped.
  known: (string | number | null | undefined)[] = []
): PresentedDetails {
  const knownSet = new Set(known.filter((k) => k !== null && k !== undefined && String(k).trim() !== "").map((k) => String(k).trim().toLowerCase()));
  const built =
    details.source === "cardsight"
      ? presentCardSight(details.data, category)
      : details.source === "scryfall"
        ? presentScryfall(details.data)
        : presentPokemonTcg(details.data);
  const sections = primaryFirst(dropKnown(built, knownSet));

  const raw: DetailRow[] = [];
  flatten(rawSource(details), "", raw);

  return {
    sourceLabel: details.source === "cardsight" ? "CardSight" : details.source === "scryfall" ? "Scryfall" : "Pokémon TCG API",
    fetchedAt: details.fetchedAt,
    sections,
    raw,
  };
}
