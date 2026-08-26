import Link from "next/link";

const ENTRIES: { date: string; title: string; items: string[] }[] = [
  {
    date: "August 26, 2026",
    title: "Pagination on the Dashboard, and faster image loading",
    items: [
      "The Dashboard's \"All cards\" section loaded your entire collection at once, images and all. It's now paginated at 12 per page (a 3x4 grid), with search and page links working the same way binders already do.",
      "Card and deck thumbnails across the site now load lazily, so a page only fetches the images actually in view instead of every image on the page at once.",
    ],
  },
  {
    date: "August 26, 2026",
    title: "Fixed the Add Card dialog on mobile",
    items: [
      "On narrow screens, the search box and \"selected\" count in the Add Card dialog (deck view and new deck form) could visually collide instead of wrapping to their own line.",
    ],
  },
  {
    date: "August 26, 2026",
    title: "Deck type breakdown, fixed",
    items: [
      "A deck's \"Type breakdown\" now actually reflects type: Magic decks break down by mana color, Pokémon decks by elemental type.",
      "Sports decks no longer show a \"Type breakdown\" at all, since sports cards don't have a type.",
    ],
  },
  {
    date: "August 26, 2026",
    title: "Public Showcase for decks and binders",
    items: [
      "Binders can now be made public with a Share toggle, the same way decks already could — sharing a binder gives it its own public page with no sign-in required.",
      "New Showcase page on the public site listing every deck and binder the community has made public, each linking to its shared page. Nothing on it reveals who owns a deck or binder.",
    ],
  },
  {
    date: "August 26, 2026",
    title: "Add a card straight from the Dashboard",
    items: [
      "The Dashboard's Add Card button now adds straight to your collection, with an optional Binder picker on the form — no more being forced to pick a binder first.",
    ],
  },
  {
    date: "August 26, 2026",
    title: "Cards can live in more than one binder",
    items: [
      "A card now belongs to your collection first, and can be placed in zero, one, or several binders — the same card can live in more than one binder at once.",
      "Deleting a binder never deletes the cards inside it — they stay in your collection and in any other binders they're part of.",
      "Cards, binders, and decks can all be deleted now, with a confirmation step first.",
    ],
  },
  {
    date: "August 23, 2026",
    title: "Accordion mobile navigation",
    items: [
      "The mobile menu collapses to a simple bar with a menu button instead of a crowded, scrolling row of icons — tap it to expand Dashboard, Binder, Decks, Changelog, and your profile.",
      "Profile settings are reachable on mobile for the first time.",
    ],
  },
  {
    date: "August 23, 2026",
    title: "Home page and login polish",
    items: [
      "Visiting the sign up / log in page while already signed in now takes you straight to your dashboard instead of showing the form again.",
      "The public homepage's \"Your Vault\" preview now shows real (anonymized) card data and thumbnails from across the collection instead of a mockup.",
    ],
  },
  {
    date: "August 23, 2026",
    title: "Full card editing",
    items: [
      "Cards can now be edited after saving — name, set, condition, quantity, notes, and every other field — from a new Edit button on the card detail page, not just the price.",
    ],
  },
  {
    date: "August 23, 2026",
    title: "CardSight pricing and Remember Me",
    items: [
      "Cards identified by photo or camera now get their estimated value straight from CardSight's own real eBay sold/asking listings, and the \"Refresh price\" action prefers the same source when available.",
      "Added a \"Remember me\" checkbox at login: checked keeps you signed in for 30 days, unchecked signs you out after a day.",
    ],
  },
  {
    date: "August 22, 2026",
    title: "CSV export wizard",
    items: [
      "New Export page: a 3-step wizard to export your cards as a CSV — pick whole collection, a binder, or a deck, choose which columns to include, then confirm and download.",
      "Deck exports show how many of each card are in the deck; collection and binder exports show how many you own.",
    ],
  },
  {
    date: "August 22, 2026",
    title: "Save + Add New, and official card art thumbnails",
    items: [
      "Add Card now has a \"Save + Add New\" button that saves the card and keeps the form open (same entry mode) so you can keep logging cards back-to-back.",
      "Cards identified by photo or camera now show the official card artwork as their thumbnail in binders, decks, and the dashboard, while your own photo is kept on the card's detail page.",
      "Graded slabs (PSA, BGS, CGC, etc.) detected in a photo now auto-fill the grading company and grade.",
    ],
  },
  {
    date: "August 21, 2026",
    title: "Switched card scanning to CardSight AI",
    items: [
      "Photo and camera card recognition now runs on CardSight AI for more reliable scans.",
      "Manual card search now starts looking automatically once you've typed 3 characters, instead of requiring a click.",
    ],
  },
  {
    date: "August 20, 2026",
    title: "Free market pricing and live search",
    items: [
      "Adding a card (manually, by photo, or by camera) now automatically estimates its market value using real pricing data.",
      "Search on the dashboard, binders, decks, and inside a binder is now instant as you type.",
      "Cards now have their own detail page with a \"Refresh price\" action.",
    ],
  },
  {
    date: "August 20, 2026",
    title: "Card Vault launch",
    items: [
      "Sign up, log in, and manage your profile.",
      "Create binders (Pokémon, Magic: The Gathering, or Sports) and log cards into them by hand, by uploading a photo, or with your camera.",
      "Build decks from your collection, with a featured cover image and a shareable public link.",
      "Dashboard with collection totals and value over time.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div>
      <nav className="nav">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text)" }}>
          <span className="brand-mark" style={{ width: 32, height: 32 }} />
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 19 }}>Card Vault</span>
        </Link>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/signup" className="btn btn-primary">
            Sign Up
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 34, margin: "0 0 8px" }}>
          Changelog
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-soft)", margin: "0 0 40px" }}>
          What&apos;s new in Card Vault.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {ENTRIES.map((entry, i) => (
            <div key={i} className="surface-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-ink)", marginBottom: 6 }}>
                {entry.date}
              </div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 19, margin: "0 0 14px" }}>
                {entry.title}
              </h2>
              <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {entry.items.map((item, j) => (
                  <li key={j} style={{ fontSize: 14, color: "var(--text-soft)", lineHeight: 1.6 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ padding: "24px 48px 40px", display: "flex", alignItems: "center", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14 }}>Card Vault</span>
        <span style={{ fontSize: 12, color: "var(--text-soft)", marginLeft: "auto" }}>
          © 2026 Card Vault. Built for collectors, by collectors.
        </span>
      </footer>
    </div>
  );
}
