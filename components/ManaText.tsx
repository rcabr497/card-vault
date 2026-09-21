// Renders text containing Magic symbols like {R}, {2}{U}, {T} or {W/U} with the
// symbols drawn as small colored icons. Plain text passes through untouched.
const COLOR_CLASS: Record<string, string> = { W: "w", U: "u", B: "b", R: "r", G: "g" };

function symbolClass(token: string): string {
  const parts = token.split("/").map((p) => p.toUpperCase());
  const colors = parts.filter((p) => COLOR_CLASS[p]);
  if (colors.length === 1 && parts.every((p) => p === colors[0] || p === "P")) return `mana-${COLOR_CLASS[colors[0]]}`;
  if (colors.length >= 2) return "mana-hybrid";
  return "mana-generic";
}

export function ManaText({ text }: { text: string }) {
  const parts = text.split(/(\{[^}\s]+\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\{([^}\s]+)\}$/);
        if (!m) return part;
        return (
          <span key={i} className={`mana ${symbolClass(m[1])}`} title={part} aria-label={m[1]}>
            {m[1]}
          </span>
        );
      })}
    </>
  );
}
