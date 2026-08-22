export type ExportScope = "collection" | "binder" | "deck";

export type ExportColumnDef = {
  key: string;
  label: string;
  scopes: ExportScope[];
};

const ALL: ExportScope[] = ["collection", "binder", "deck"];

export const EXPORT_COLUMNS: ExportColumnDef[] = [
  { key: "name", label: "Card Name", scopes: ALL },
  { key: "category", label: "Category", scopes: ALL },
  { key: "binderName", label: "Binder", scopes: ["collection", "deck"] },
  { key: "setName", label: "Set / Product", scopes: ALL },
  { key: "cardNumber", label: "Card #", scopes: ALL },
  { key: "year", label: "Year", scopes: ALL },
  { key: "team", label: "Team / Type", scopes: ALL },
  { key: "rarity", label: "Rarity", scopes: ALL },
  { key: "condition", label: "Condition", scopes: ALL },
  { key: "gradingCompany", label: "Grading Company", scopes: ALL },
  { key: "grade", label: "Grade", scopes: ALL },
  { key: "quantity", label: "Quantity Owned", scopes: ["collection", "binder"] },
  { key: "deckQuantity", label: "Qty in Deck", scopes: ["deck"] },
  { key: "purchasePrice", label: "Purchase Price", scopes: ALL },
  { key: "currentValue", label: "Current Value", scopes: ALL },
  { key: "notes", label: "Notes", scopes: ALL },
  { key: "createdAt", label: "Date Added", scopes: ALL },
];

export function columnsForScope(scope: ExportScope): ExportColumnDef[] {
  return EXPORT_COLUMNS.filter((c) => c.scopes.includes(scope));
}
