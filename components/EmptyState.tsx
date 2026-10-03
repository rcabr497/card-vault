import Link from "next/link";

// Friendly placeholder for an empty list: a small card stack, a title, one
// sentence, and (optionally) the action that fills it.
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string } | React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-stack" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h2>{title}</h2>
      <p>{body}</p>
      {action &&
        (typeof action === "object" && action !== null && "href" in action ? (
          <Link href={action.href} className="btn btn-primary">
            {action.label}
          </Link>
        ) : (
          action
        ))}
    </div>
  );
}
