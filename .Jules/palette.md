## 2024-05-18 - Improve icon-only buttons accessibility and async visual feedback
**Learning:** Found that some icon-only buttons (like those in the ShareDialog) lacked `aria-label` attributes for screen readers, and some were missing the `size="icon"` property which ensures proper sizing for icon-only buttons in the UI component library. Also, replacing text-based loading states (like "...") with visual spinners (like `Loader2` with `animate-spin`) provides much clearer async feedback for users.
**Action:** Always ensure icon-only buttons have an `aria-label` and `size="icon"` (if using the standard Button component). Use spinning icons for async operations instead of text.

## 2024-05-18 - Missing Tooltips on Icon-Only Dialog Triggers
**Learning:** Some icon-only buttons that trigger Dialogs (like "Share & Import JSON" and "Keyboard Shortcuts") were missing tooltips, while other regular buttons in the toolbar had them. This was an inconsistency that harmed discoverability. Also learned that when nesting a `TooltipTrigger` and a `DialogTrigger` using Radix UI, it is safe to wrap the `DialogTrigger` directly inside the `TooltipTrigger` using `asChild` for both, without requiring an intermediate wrapper element like a `div` or `span`.
**Action:** When adding Dialogs triggered by icon-only buttons, consistently add a `Tooltip` wrapper around the `DialogTrigger` using the nested `asChild` pattern.
## 2026-04-14 - ARIA Labels for Icon-Only Buttons
**Learning:** Found multiple instances where icon-only buttons lacked ARIA labels, making them inaccessible to screen readers.
**Action:** Always ensure `aria-label` is added to `Button` components that contain only an icon.
