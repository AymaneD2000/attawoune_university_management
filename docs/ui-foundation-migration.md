# UI Foundation Migration Guide

This guide is the contract for progressively moving existing Attawoune management screens to the UI foundation. It preserves all existing endpoints, permissions, serializers, validation, database models, photo behavior, and changed-field PATCH behavior.

## Foundation tokens

Use semantic tokens and Tailwind `ui.*` aliases, never raw brand colors in migrated components.

| Meaning | Tokens | Approved source color |
| --- | --- | --- |
| Primary action and information | `ui-primary`, `ui-primary-strong`, `ui-info`, `ui-ring` | Attawoune blue `#1A4C91`; navy `#142E54` |
| Shell and high-emphasis surfaces | `ui-primary-strong`, `ui-on-primary` | Attawoune navy `#0B1B33` / `#142E54` |
| Positive state | `ui-success`, `ui-success-strong` | Green `#1BAB53` |
| Attention state | `ui-warning`, `ui-earth` | Orange `#E59741`; earth `#6A310D` |
| Destructive or validation state | `ui-danger` | Semantic danger red |
| Layout and readable content | `ui-canvas`, `ui-surface`, `ui-surface-muted`, `ui-foreground`, `ui-muted`, `ui-border`, `ui-disabled` | Semantic neutral mapping |

Also use `--space-*`, `--radius-control`, `--radius-panel`, `--elevation-*`, `--z-*`, and `--motion-*`. Light theme is the shipped experience. `[data-theme='dark']` is reserved mapping only; do not add a theme switcher. Existing `brand-*` aliases remain compatibility paths until their owning pages migrate.

## Shared imports and contracts

- `components/ui/Button`: `Button` accepts native button props plus `variant` (`primary`, `secondary`, `success`, `danger`, `ghost`) and `loading`; it disables itself and sets `aria-busy` while loading. `IconButton` requires a text `label` and provides a 44px labelled target.
- `components/ui/Field`: wrap one form control with `id`, visible `label`, optional `hint`, `error`, and `required`. It creates the label association, invalid state, required state, and message description.
- `components/ui/DialogShell`: provide `open`, `title`, `onClose`, `children`, and optional `description`, `footer`, `size`, and `busy`. The shell owns dialog semantics, focus trapping, Escape/backdrop behavior, and its single scroll body. Busy dialogs cannot close.
- `components/ui/ConfirmationDialog`: provide `open`, text labels, `onConfirm`, `onCancel`, optional `tone`, and `busy`. Use it for destructive and dirty-form dismissals.
- `components/ui/Feedback`: use `PageSkeleton`, `EmptyState`, `ErrorState`, and `RestrictedState` rather than page-local replacements. Error states provide Retry only when retry is meaningful.
- `components/ui/ResponsiveDataView`: provide `loading`, `backgroundFetching`, `error`, `empty`, desktop and mobile render nodes, state text, and `onRetry`. It keeps data visible during a background refresh.
- `components/ui/FilterToolbar`: provide a visible/accessible `label`, controls, active chips, `onClear`, and `clearLabel`; each chip has its own remove action.
- `components/ui/FormSection`: use `title`, optional `description` and `icon`, and grouped fields. `StickyFormActions` keeps form actions in the dialog footer flow.
- `components/common/PageHeader`: provide `title`, optional `eyebrow`, `description`, `icon`, and `actions` for consistent page framing.
- `components/common/EntityDisplay`: retain legacy imports during phased migration; new work should prefer the focused primitives above.

All primary controls must use a 44px minimum target. Use Heroicons for structural icons and give every icon-only action an accessible name.

## Page-state and responsive rules

Initial fetches show a layout-matched `PageSkeleton`. Empty states explain the result and offer a relevant permitted action. Network failures show an `ErrorState` and a scoped Retry. HTTP 403 uses `RestrictedState` without Retry. Mutations announce completion through the toast provider and never optimistically update identity, enrollment, grade, attendance, or finance data.

On desktop, render administration collections as semantic tables with labelled row actions and `aria-sort` for sortable headers. At mobile widths, render the same information and actions as cards; do not depend on horizontal table scrolling as the primary mobile experience. At 375px, the document must not overflow horizontally. Validate layouts at 375, 768, 1024, and 1440px.

## Dialogs and forms

Use `DialogShell`, not a page-local `fixed inset-0` backdrop. A dialog must expose a title (and description when supplied), trap focus, close with Escape when not busy, and return focus to its trigger. Long forms have one scrollable dialog body and actions outside it. Use `Field` for visible labels, hints, field-level errors, and required state; use a focusable error summary when several errors exist. Dirty forms require `ConfirmationDialog` before dismissal. Continue sending only changed attributes for edits.

## RTL and translation parity

French and Arabic must expose identical `students`, `common`, and `sidebar` key paths, information, and actions. Use CSS logical properties (`start`, `end`, `ps`, `pe`, `ms`, `me`, `inset-inline-*`) rather than left/right positioning. Directional icons must use the existing `rtl:rotate-180` pattern. Keep identifiers and numeric values appropriately LTR/tabular where needed. Set `dir="ltr"` only for content whose reading direction is inherently Latin/numeric. Verify tabs, drawers, sort controls, dialogs, and focus order in both directions.

## Query-key and invalidation conventions

Keep query keys centralized in `pages/students/studentQueries.ts`. The list key includes the complete typed, URL-backed `StudentListParams`; summaries are keyed independently; detail and each profile resource have a distinct key. Profile-tab queries are enabled only when their tab is active. Mutations invalidate only affected prefixes and exact resources:

- create/update: `lists()` and `summaries()`;
- saved student: exact `detail(savedStudent.id)`;
- photo replacement: exact `idCard(savedStudent.id)` as well as detail;
- never invalidate every profile-tab query merely because one resource changed.

Preserve URL filters, ordering, pagination, profile return location, and route-keyed list scroll restoration.

## Later-module migration checklist

Apply this checklist independently to Teachers, Users, Courses, Grades, and Finance:

- [ ] Retain current endpoint paths, roles, validation, and mutation semantics.
- [ ] Replace raw visual values with semantic tokens while keeping legacy aliases available.
- [ ] Replace local buttons, fields, feedback, filters, and dialogs with the shared contracts.
- [ ] Define typed, centralized query keys; use URL-backed collection state where applicable.
- [ ] Implement initial loading, non-blocking refresh, empty, error/Retry, and restricted states.
- [ ] Render desktop tables and equivalent mobile cards with the same labels, actions, and permissions.
- [ ] Add labelled row actions, `aria-sort` for sortable columns, keyboard support, and 44px targets.
- [ ] Test French/Arabic key parity, RTL logical layout, directional icons, and reduced motion.
- [ ] Add focused behavior and axe regression tests, then run the full frontend suite and production build.
