import type { CardCategory } from "@prisma/client";
import { parseCardDetails } from "./cardDetails";
import { GAME_LABELS, type DeckFormat, type DeckGame } from "./deckFormats";

// Checks a deck against a format's deck-building rules: size, copies per card,
// banned / not-legal cards, and the Pokémon-specific limits. Legality comes from
// the provider data saved on each card (Card.metadataJson), so a card without
// that data can't be verified and is reported as such rather than guessed.

export type CheckCard = {
  id: string;
  name: string;
  category: CardCategory;
  metadataJson: string | null;
};

type Legality = "legal" | "restricted" | "banned" | "not_legal" | "unknown";

type CardFacts = {
  game: DeckGame | null;
  // Basic land / basic Energy: any number of copies, legal in every format.
  basic: boolean;
  // Copy limit the card's own text or type sets, if any.
  copyLimit: number | null;
  legality: (key: string) => Legality;
  // null when the card's data doesn't say.
  basicPokemon: boolean | null;
  aceSpec: boolean;
  radiant: boolean;
  fetchedAt: string | null;
};

export type CheckStatus = "pass" | "fail" | "warn";
export type CheckCardRef = { id: string; name: string; note?: string };
export type DeckCheckItem = { id: string; status: CheckStatus; title: string; detail?: string; cards?: CheckCardRef[] };

export type DeckCheckResult = {
  format: DeckFormat;
  verdict: "legal" | "illegal" | "unverified";
  items: DeckCheckItem[];
  // Things the check doesn't cover, shown as plain notes.
  notes: string[];
  // Oldest saved card data the legality check relied on.
  dataAsOf: string | null;
  // Card ids with a failing check, to flag them in the deck grid.
  flagged: Record<string, string>;
};

// --- card facts ------------------------------------------------------------

type Data = Record<string, unknown>;

function obj(v: unknown): Data {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Data) : {};
}
function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

const BASIC_LANDS = new Set(["plains", "island", "swamp", "mountain", "forest", "wastes"]);
const BASIC_ENERGY = /^(basic )?(grass|fire|water|lightning|psychic|fighting|darkness|metal|fairy) energy$/i;
const NUMBER_WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

export function cardNameKey(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

function isBasicLandName(name: string): boolean {
  return BASIC_LANDS.has(cardNameKey(name).replace(/^snow-covered /, ""));
}

// "A deck can have any number of cards named …" (Relentless Rats) or
// "… up to seven cards named …" (Seven Dwarves).
function rulesTextLimit(text: string): number | null {
  if (/deck can have any number of cards named/i.test(text)) return Infinity;
  const m = text.match(/deck can have up to (\w+) cards named/i);
  if (m) return NUMBER_WORDS[m[1].toLowerCase()] ?? (Number(m[1]) || null);
  return null;
}

function isBasicLand(name: string, typeLine: string): boolean {
  if (typeLine) return /\bbasic\b/i.test(typeLine) && /\bland\b/i.test(typeLine);
  return isBasicLandName(name);
}

function scryfallLegality(legalities: Data, key: string): Legality {
  const v = str(legalities[key]).toLowerCase();
  if (v === "legal" || v === "restricted" || v === "banned" || v === "not_legal") return v;
  return "unknown";
}

export function cardFacts(card: CheckCard): CardFacts {
  const details = parseCardDetails(card.metadataJson);
  const d = details?.data ?? {};
  const game: DeckGame | null = card.category === "mtg" || card.category === "pokemon" ? card.category : null;
  const facts: CardFacts = {
    game,
    basic: false,
    copyLimit: null,
    legality: () => "unknown",
    basicPokemon: null,
    aceSpec: false,
    radiant: game === "pokemon" && /^radiant /i.test(card.name.trim()),
    fetchedAt: details?.fetchedAt ?? null,
  };

  if (game === "pokemon") facts.basic = BASIC_ENERGY.test(card.name.trim());
  if (game === "mtg") facts.basic = isBasicLandName(card.name);

  if (details?.source === "scryfall") {
    const faces = Array.isArray(d.card_faces) ? d.card_faces.map(obj) : [];
    const typeLine = str(d.type_line) || str(faces[0]?.type_line);
    const rulesText = [str(d.oracle_text), ...faces.map((f) => str(f.oracle_text))].join("\n");
    facts.basic = isBasicLand(card.name, typeLine);
    facts.copyLimit = rulesTextLimit(rulesText);
    const legalities = obj(d.legalities);
    facts.legality = (key) => scryfallLegality(legalities, key);
  } else if (details?.source === "pokemontcg") {
    const supertype = str(d.supertype).toLowerCase();
    const subtypes = strings(d.subtypes).map((s) => s.toLowerCase());
    if (supertype === "energy" && subtypes.includes("basic")) facts.basic = true;
    if (subtypes.includes("prism star")) facts.copyLimit = 1;
    if (supertype) facts.basicPokemon = supertype.startsWith("pok") && subtypes.includes("basic");
    facts.aceSpec = subtypes.includes("ace spec");
    facts.radiant ||= subtypes.includes("radiant");
    const legalities = obj(d.legalities);
    const listed = Object.keys(legalities).length > 0;
    facts.legality = (key) => {
      const v = str(legalities[key]).toLowerCase();
      if (v === "legal") return "legal";
      if (v === "banned") return "banned";
      // The API lists only the formats a card is legal (or banned) in.
      return listed ? "not_legal" : "unknown";
    };
  } else if (details?.source === "cardsight") {
    const fields: Record<string, string> = {};
    for (const f of Array.isArray(d.fields) ? d.fields.map(obj) : []) fields[str(f.key)] = str(f.value);
    const attrs = strings(d.attributes).map((a) => a.toLowerCase());
    const prefix = `${game ?? (attrs.some((a) => a.startsWith("mtg-")) ? "mtg" : "pokemon")}-legal-`;
    // CardSight tags only the formats a card is legal in.
    const legalIn = new Set(attrs.filter((a) => a.startsWith(prefix)).map((a) => a.slice(prefix.length)));
    facts.legality = (key) => (legalIn.size === 0 ? "unknown" : legalIn.has(key) ? "legal" : "not_legal");
    if (game === "mtg") {
      facts.basic = isBasicLand(card.name, fields.TYPE_LINE ?? "");
      facts.copyLimit = rulesTextLimit(str(d.description));
    } else if (game === "pokemon") {
      const tags = new Set(attrs.filter((a) => a.startsWith("pokemon-")).map((a) => a.slice(8)));
      facts.aceSpec = tags.has("ace-spec") || /\bace spec\b/i.test(str(d.description));
      facts.radiant ||= tags.has("radiant");
      if (tags.has("prism-star")) facts.copyLimit = 1;
      if (tags.has("basic") && fields.HP) facts.basicPokemon = true;
      else if (["stage-1", "stage-2", "trainer", "energy", "vmax", "vstar", "break", "mega"].some((t) => tags.has(t)))
        facts.basicPokemon = false;
    }
  }
  if (facts.basic) {
    const saved = facts.legality;
    facts.copyLimit = Infinity;
    facts.legality = (key) => (saved(key) === "unknown" ? "legal" : saved(key));
  }
  return facts;
}

// --- the check -------------------------------------------------------------

type DeckEntry = { quantity: number; card: CheckCard };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function checkDeck(format: DeckFormat, entries: DeckEntry[]): DeckCheckResult {
  const items: DeckCheckItem[] = [];
  const notes: string[] = [];
  const flagged: Record<string, string> = {};
  const flag = (refs: CheckCardRef[], why: string) => refs.forEach((r) => (flagged[r.id] ??= why));
  const gameLabel = GAME_LABELS[format.game];

  const withFacts = entries.map((e) => ({ ...e, facts: cardFacts(e.card) }));
  const total = entries.reduce((s, e) => s + e.quantity, 0);

  // Size.
  const exact = format.maxCards === format.minCards;
  const sizeTitle = exact ? `Exactly ${format.minCards} cards` : `At least ${format.minCards} cards`;
  if (total < format.minCards) {
    items.push({ id: "size", status: "fail", title: sizeTitle, detail: `Has ${total} — add ${format.minCards - total} more.` });
  } else if (format.maxCards !== undefined && total > format.maxCards) {
    items.push({ id: "size", status: "fail", title: sizeTitle, detail: `Has ${total} — take out ${total - format.maxCards}.` });
  } else {
    items.push({ id: "size", status: "pass", title: sizeTitle, detail: `Has ${total}.` });
  }

  // Cards from another game (or sports cards) can't be in the deck at all.
  const offGame = withFacts.filter((e) => e.facts.game !== format.game);
  const inGame = withFacts.filter((e) => e.facts.game === format.game);
  if (offGame.length) {
    const refs = offGame.map((e) => ({ id: e.card.id, name: e.card.name }));
    flag(refs, `Not a ${gameLabel} card`);
    items.push({
      id: "game",
      status: "fail",
      title: `Only ${gameLabel} cards`,
      detail: `${plural(offGame.reduce((s, e) => s + e.quantity, 0), "card")} from another game.`,
      cards: refs,
    });
  }

  // Copies per card name. Different printings of a card share the limit.
  const groups = new Map<string, { name: string; count: number; limit: number; refs: CheckCardRef[]; entries: typeof inGame }>();
  for (const e of inGame) {
    const key = cardNameKey(e.card.name);
    const g = groups.get(key) ?? { name: e.card.name, count: 0, limit: format.copyLimit, refs: [], entries: [] };
    g.count += e.quantity;
    g.refs.push({ id: e.card.id, name: e.card.name });
    g.entries.push(e);
    if (e.facts.copyLimit !== null) {
      // Basic lands/energy can always go above the format's limit; Prism Star
      // and similar cards only ever restrict it.
      g.limit = e.facts.copyLimit > format.copyLimit ? Math.max(g.limit, e.facts.copyLimit) : Math.min(g.limit, e.facts.copyLimit);
    }
    groups.set(key, g);
  }
  const overLimit = Array.from(groups.values()).filter((g) => g.count > g.limit);
  const exceptions = format.game === "mtg" ? "basic lands" : "basic Energy";
  const copiesTitle =
    format.copyLimit === 1
      ? `One copy of each card (except ${exceptions})`
      : `Up to ${format.copyLimit} copies of each card (except ${exceptions})`;
  if (overLimit.length) {
    const refs = overLimit.map((g) => ({ id: g.refs[0].id, name: g.name, note: `${g.count} copies, max ${g.limit}` }));
    overLimit.forEach((g) => flag(g.refs, `Too many copies (max ${g.limit})`));
    items.push({ id: "copies", status: "fail", title: copiesTitle, detail: `${plural(overLimit.length, "card")} over the limit.`, cards: refs });
  } else {
    items.push({ id: "copies", status: "pass", title: copiesTitle });
  }

  // Legality, judged once per card name from whichever printing has data.
  const banned: CheckCardRef[] = [];
  const notLegal: CheckCardRef[] = [];
  const unknown: CheckCardRef[] = [];
  let dataAsOf: string | null = null;
  for (const g of Array.from(groups.values())) {
    const known = g.entries.find((e) => e.facts.legality(format.legalityKey) !== "unknown");
    const status = known ? known.facts.legality(format.legalityKey) : "unknown";
    const ref = { id: g.refs[0].id, name: g.name };
    if (known?.facts.fetchedAt && (!dataAsOf || known.facts.fetchedAt < dataAsOf)) dataAsOf = known.facts.fetchedAt;
    if (status === "banned") {
      banned.push({ ...ref, note: "Banned" });
      flag(g.refs, "Banned");
    } else if (status === "restricted" && !format.restrictedAsOne) {
      banned.push({ ...ref, note: "Restricted" });
      flag(g.refs, "Restricted");
    } else if (status === "restricted" && g.count > 1) {
      banned.push({ ...ref, note: `Restricted — ${g.count} copies, max 1` });
      flag(g.refs, "Restricted (max 1)");
    } else if (status === "not_legal") {
      notLegal.push(ref);
      flag(g.refs, `Not legal in ${format.label}`);
    } else if (status === "unknown") {
      unknown.push(ref);
    }
  }
  const legalTitle = `Every card is legal in ${format.label}`;
  if (banned.length || notLegal.length) {
    items.push({
      id: "legality",
      status: "fail",
      title: legalTitle,
      detail: [banned.length && `${banned.length} banned or restricted`, notLegal.length && `${notLegal.length} not legal`]
        .filter(Boolean)
        .join(", ") + ".",
      cards: [...banned, ...notLegal.map((r) => ({ ...r, note: "Not legal" }))],
    });
  } else if (unknown.length === 0 && groups.size > 0) {
    items.push({ id: "legality", status: "pass", title: legalTitle });
  }
  if (unknown.length) {
    items.push({
      id: "unverified",
      status: "warn",
      title: `Couldn't verify ${plural(unknown.length, "card")}`,
      detail: "No format data is saved for these cards. Cards you scanned can fetch it with Refresh data on the card's page.",
      cards: unknown,
    });
  }

  if (format.game === "pokemon") {
    // At least one Basic Pokémon to start the game with.
    const basics = inGame.filter((e) => e.facts.basicPokemon === true);
    const unsure = inGame.some((e) => e.facts.basicPokemon === null && !e.facts.basic);
    items.push({
      id: "basic-pokemon",
      status: basics.length ? "pass" : unsure ? "warn" : "fail",
      title: "At least 1 Basic Pokémon",
      detail: basics.length
        ? `Has ${basics.reduce((s, e) => s + e.quantity, 0)}.`
        : unsure
          ? "Couldn't tell which cards are Basic Pokémon from the saved card data."
          : "Add a Basic Pokémon to start the game with.",
    });

    for (const [id, label, test] of [
      ["ace-spec", "ACE SPEC", (f: CardFacts) => f.aceSpec],
      ["radiant", "Radiant Pokémon", (f: CardFacts) => f.radiant],
    ] as const) {
      const hits = inGame.filter((e) => test(e.facts));
      if (!hits.length) continue;
      const count = hits.reduce((s, e) => s + e.quantity, 0);
      const refs = hits.map((e) => ({ id: e.card.id, name: e.card.name }));
      if (count > 1) flag(refs, `Only 1 ${label} card allowed`);
      items.push({
        id,
        status: count > 1 ? "fail" : "pass",
        title: `No more than 1 ${label} card`,
        detail: `Has ${count}.`,
        ...(count > 1 ? { cards: refs } : {}),
      });
    }
  }

  if (format.id === "mtg-commander") {
    notes.push("Commander color identity isn't checked — Card Vault doesn't know which card is your commander yet.");
  } else if (format.game === "mtg") {
    notes.push("Sideboards aren't tracked, so only the main deck is checked.");
  }

  const verdict = items.some((i) => i.status === "fail") ? "illegal" : items.some((i) => i.status === "warn") ? "unverified" : "legal";
  return { format, verdict, items, notes, dataAsOf, flagged };
}
