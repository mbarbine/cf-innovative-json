## 2024-05-18 - Improve icon-only buttons accessibility and async visual feedback
**Learning:** Found that some icon-only buttons (like those in the ShareDialog) lacked `aria-label` attributes for screen readers, and some were missing the `size="icon"` property which ensures proper sizing for icon-only buttons in the UI component library. Also, replacing text-based loading states (like "...") with visual spinners (like `Loader2` with `animate-spin`) provides much clearer async feedback for users.
**Action:** Always ensure icon-only buttons have an `aria-label` and `size="icon"` (if using the standard Button component). Use spinning icons for async operations instead of text.
## 2024-04-17 - Missing ARIA Labels in Nested Components
**Learning:** Icon-only buttons nested deep within auxiliary views (like diff views and breadcrumbs) often lack ARIA labels, even if the primary toolbar is well-labeled.
**Action:** Always check nested components and dialogs for missing `aria-label`s on icon-only buttons when reviewing UI components.
