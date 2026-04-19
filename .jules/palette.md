## 2024-04-19 - Missing ARIA Labels on Modal Close Buttons
**Learning:** Custom UI modal implementations (like full-screen Diff View overlays) often omit aria-labels on icon-only close buttons, breaking accessibility for screen readers.
**Action:** Always ensure any `<Button size="icon">` containing only an icon like `<X />` explicitly includes an `aria-label` describing the action (e.g., "Close [view name]").
