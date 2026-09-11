"use client";

import { useRouter } from "next/navigation";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest added" },
  { value: "oldest", label: "Oldest added" },
  { value: "name", label: "Name A–Z" },
  { value: "value-desc", label: "Value: high → low" },
  { value: "value-asc", label: "Value: low → high" },
  { value: "year-desc", label: "Year: newest" },
];

export function CollectionControls({
  basePath,
  params,
  years,
  teams,
}: {
  basePath: string;
  params: Record<string, string>;
  years: number[];
  teams: string[];
}) {
  const router = useRouter();

  function navigate(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    router.push(`${basePath}?${next.toString()}`);
  }

  const selectStyle = { width: "auto", minHeight: 34, padding: "6px 10px", fontSize: 13 } as const;

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
      <select
        className="input"
        style={selectStyle}
        value={params.sort ?? "newest"}
        onChange={(e) => navigate("sort", e.target.value === "newest" ? "" : e.target.value)}
        aria-label="Sort"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            Sort: {o.label}
          </option>
        ))}
      </select>

      <select
        className="input"
        style={selectStyle}
        value={params.year ?? ""}
        onChange={(e) => navigate("year", e.target.value)}
        aria-label="Year"
      >
        <option value="">All years</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>

      {teams.length > 0 && (
        <select
          className="input"
          style={selectStyle}
          value={params.team ?? ""}
          onChange={(e) => navigate("team", e.target.value)}
          aria-label="Team or type"
        >
          <option value="">All teams / types</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
