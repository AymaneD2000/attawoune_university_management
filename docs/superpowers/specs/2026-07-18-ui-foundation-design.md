# UI Foundation and Students Pilot Design

**Date:** 2026-07-18  
**Status:** Approved design  
**Product:** Université Privée Attawoune Management Platform

## 1. Context

The platform already uses the university logo colors and has partial shared styling, RTL support, responsive navigation, and several redesigned entity screens. However, visual and interaction patterns remain fragmented across pages. Dialogs, tables, forms, loading states, errors, page headers, and data-fetching behavior are implemented repeatedly and inconsistently.

The first modernization batch will establish a reusable UI foundation, transform the application shell, and migrate the complete Students workflow as the reference implementation for later Teachers, Users, Courses, Grades, Finance, and structure migrations.

## 2. Approved Direction

- **Visual personality:** Institutional Command Center
- **Transformation strength:** Strong visual transformation
- **Delivery approach:** Token-first progressive migration
- **Device priority:** Desktop/laptop first with fully responsive mobile behavior
- **Theme scope:** Light theme now with dark-ready semantic tokens
- **Pilot scope:** Foundation, application shell, and complete Students workflow

## 3. Goals

1. Create a coherent design system based on the Attawoune brand.
2. Replace repeated ad hoc UI patterns with accessible shared primitives.
3. Transform navigation and page framing without changing permissions or backend APIs.
4. Make the Students workflow the reusable reference for later migrations.
5. Preserve French and Arabic feature parity, including correct RTL behavior.
6. Improve loading, error, empty, and mutation feedback.
7. Introduce React Query patterns for predictable caching and invalidation.
8. Preserve all unrelated worktree changes.

## 4. Non-Goals

- Redesigning Teachers, Users, Courses, Grades, Finance, Dashboard, Scheduling, or university structure pages in this batch.
- Enabling a dark-mode toggle in this batch.
- Changing backend endpoints, permissions, serializers, database models, or business rules.
- Adding optimistic updates for identity, enrollment, academic, or financial mutations.
- Replacing the existing localization framework.

## 5. Architecture

The foundation has four layers.

### 5.1 Semantic Design Tokens

CSS variables and Tailwind aliases will express purpose rather than raw color names. Tokens cover:

- Primary, secondary, accent, success, warning, danger, and informational colors.
- Canvas, elevated surface, muted surface, border, foreground, and muted text.
- Focus rings and disabled states.
- Four/eight-pixel spacing scale.
- Typography roles and tabular numeric styling.
- Radius, shadow, z-index, and motion scales.
- Light-theme values plus reserved dark-theme mappings.

Core brand values:

- Navigation navy: `#0B1B33` and `#142E54`
- Primary blue: `#1A4C91`
- Success green: `#1BAB53`
- Attention orange: `#E59741`
- Supporting earth accent: `#6A310D`

Blue represents navigation and primary actions, green represents positive status, orange represents attention, red represents destructive actions, and earth is a restrained supporting accent.

### 5.2 Shared UI Primitives

The foundation will provide focused, reusable components:

- Buttons and icon buttons
- Inputs, selects, textareas, and field messages
- Badges, status pills, avatars, and metadata rows
- Page headers and section headers
- Modal shell and confirmation dialog
- Form section and sticky form actions
- Filter toolbar and active-filter chips
- Responsive data view with desktop table and mobile cards
- Pagination controls
- Loading skeletons, background progress, empty states, errors, and permission states
- Accessible toast notifications

Components expose stable props, contain their own accessibility behavior, and avoid coupling to Students-specific data.

### 5.3 Application Shell

`MainLayout` and `Sidebar` will become the Institutional Command Center shell:

- Deep navy desktop sidebar with clear grouped navigation and active-state hierarchy.
- Clean white work surfaces on a cool neutral canvas.
- Compact sticky top bar with page context, language switcher, and user identity.
- Responsive mobile drawer with a strong scrim and reliable close behavior.
- Skip-to-content support and focus movement on route changes.
- Logical CSS properties and mirrored directional icons for RTL.
- One predictable content-width and spacing system across routes.

### 5.4 Students Reference Implementation

Students will consume the new tokens, primitives, shell, data patterns, error handling, and responsive rules. Later modules should be able to migrate by following the Students structure without redefining UI conventions.

## 6. Visual and Interaction System

### 6.1 Typography

- Inter will serve French and Latin text.
- Noto Sans Arabic will serve Arabic text.
- Fonts will be loaded explicitly with non-blocking behavior.
- French and Arabic share the same semantic type scale.
- Financial values, matricules, identifiers, and table figures use tabular numerals.
- Body text remains at least 16px on mobile form controls.

### 6.2 Surfaces and Density

- Main panels use consistent 16–20px radii.
- Borders remain visible but restrained.
- Shadows use a small semantic elevation scale rather than arbitrary values.
- Desktop data screens remain dense enough for administration without reducing touch targets.
- Content gutters adapt at 375, 768, 1024, and 1440px.

### 6.3 Interaction

- Primary controls have at least a 44px interactive area.
- Hover, focus, pressed, loading, disabled, and destructive states are visually distinct.
- Motion lasts approximately 160–240ms and uses opacity or transforms.
- Reduced-motion preferences remove nonessential transitions.
- Heroicons are the single structural icon family.
- Decorative emojis and duplicate handwritten SVG icons are removed from migrated areas.

### 6.4 Dialogs and Forms

- Dialogs trap focus, close with Escape, restore trigger focus, and expose correct semantics.
- Dialogs use a sticky header and footer with one internal scroll region.
- Long forms are grouped into titled sections.
- Errors appear beside their fields and in a summary when several fields fail.
- Unsaved changes require confirmation before dismissal.
- Edit requests continue sending only changed attributes.

## 7. Students Workflow

### 7.1 Students List

The list includes:

- Summary metrics for total, active, graduated, and suspended students.
- Search plus program, level, and status filters.
- Active-filter chips and a clear-all action.
- URL-backed filters and pagination.
- A sortable desktop table with sticky header and labelled row actions.
- Responsive mobile cards showing photo, identity, matricule, program, level, and status.
- Layout-matched loading skeletons, empty guidance, retryable failures, and permission states.

Returning from a profile restores the previous filters, page, and scroll position.

### 7.2 Student Profile Route

Student details move from a large modal to `/students/:id`.

The page includes:

- Identity header with photo, matricule, status, and allowed actions.
- Overview, enrollments, grades, attendance, bulletins, finance, and ID-card tabs.
- Deep linking and predictable browser Back behavior.
- Lazy data loading when a tab is first opened.
- Independent loading, error, empty, and retry states per tab.

The profile route does not expose data that the current user cannot access.

### 7.3 Create and Edit

Create and edit remain bounded modal workflows. Fields are grouped into:

- Identity
- Contact
- Academic placement
- Account information

Existing validation, permissions, photo upload, and partial-update behavior remain unchanged. Successful photo updates invalidate both profile and ID-card queries.

## 8. Data Flow

The Students pilot will use React Query with centralized query keys:

- Student list queries include URL-backed filters and pagination.
- Student detail and each detail tab have distinct keys.
- Requests are cached and cancelled when obsolete.
- Mutations invalidate only affected list, detail, or tab queries.
- Background refresh does not replace visible content with a blocking spinner.
- Identity, enrollment, grade, attendance, and finance updates are not optimistic.

No backend API changes are required for the foundation design.

## 9. Error and Feedback Model

- Initial requests show skeletons shaped like the eventual content.
- Background requests show subtle non-blocking progress.
- Empty states explain why no data is shown and offer a relevant action.
- Request failures show cause-appropriate messaging and Retry.
- Field errors appear beside the affected control.
- Multiple form errors also produce an accessible summary.
- Successful mutations produce an `aria-live` confirmation toast.
- Permission failures produce an explicit restricted state.
- Destructive actions use confirmation dialogs and separated danger styling.

## 10. Accessibility and Localization

- WCAG AA contrast is required for text and functional graphics.
- All functionality must work with keyboard-only navigation.
- Focus order follows visual order.
- Icon-only controls have accessible names.
- Tables expose sortable-column state.
- Dialog and tab semantics are complete.
- French and Arabic expose the same information and actions.
- RTL layouts use logical spacing and mirrored directional icons.
- Reduced motion is respected.
- No horizontal page overflow is permitted at 375px.

## 11. Rollout

Implementation proceeds in these stages:

1. Semantic tokens and compatibility aliases.
2. Shared accessible UI primitives.
3. Application shell transformation.
4. Students list and responsive data views.
5. Student profile route and lazy-loaded tabs.
6. Create/edit forms and confirmation dialogs.
7. Cleanup, documentation, accessibility checks, and verification.

Existing screens continue working during migration. Compatibility aliases prevent the new foundation from forcing unrelated page rewrites.

## 12. Testing

Testing will cover:

- Component default, hover, focus, loading, disabled, error, and empty states.
- Navigation, dialog, tab, and table keyboard behavior.
- Dialog focus trapping and restoration.
- French and Arabic rendering and RTL behavior.
- Responsive behavior at 375, 768, 1024, and 1440px.
- Students filters, URL state, pagination, and browser restoration.
- Profile routing and lazy tab loading.
- Partial edits, photo changes, and ID-card invalidation.
- API failures, permission errors, and Retry actions.
- Automated accessibility checks.
- Existing frontend tests and the production build.

## 13. Acceptance Criteria

The batch is complete when:

1. The new shell and Students workflow match the Institutional Command Center direction.
2. No horizontal page overflow occurs at 375px.
3. All primary controls meet the 44px target requirement.
4. The migrated workflow is usable without a mouse.
5. Dialogs trap and restore focus correctly.
6. French and Arabic provide feature and information parity.
7. Existing permissions, APIs, validation, photo handling, and partial updates remain unchanged.
8. Existing frontend tests pass and the production build succeeds.
9. Students patterns are documented and reusable for later module migrations.
10. Unrelated worktree changes remain intact.

