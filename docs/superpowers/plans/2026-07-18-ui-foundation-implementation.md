# UI Foundation and Students Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Institutional Command Center UI foundation, transform the application shell, and migrate the complete Students workflow as the reusable reference implementation.

**Architecture:** Introduce semantic CSS/Tailwind tokens first, then accessible shared React primitives, then transform the shell. Move Students data to React Query with URL-backed list state, migrate the list to responsive table/card views, and replace the detail modal with a deep-linkable profile route while preserving current APIs, permissions, photo handling, and partial updates.

**Tech Stack:** React 19, TypeScript 4.9, React Router 7, TanStack React Query 5, Tailwind CSS 3.4, Headless UI 2.2, Heroicons 2.2, React Testing Library, Jest, Axios, i18next.

## Global Constraints

- Visual direction is Institutional Command Center.
- Use Attawoune navy `#0B1B33` / `#142E54`, blue `#1A4C91`, green `#1BAB53`, orange `#E59741`, and earth `#6A310D` through semantic tokens.
- Ship a light theme; define dark-ready token mappings without enabling a theme switcher.
- Optimize for desktop/laptop while remaining fully responsive at 375, 768, 1024, and 1440px.
- Preserve current backend endpoints, permissions, validation, serializers, database models, photo behavior, and changed-field PATCH behavior.
- Do not redesign non-shell Teachers, Users, Courses, Grades, Finance, Dashboard, Scheduling, or structure pages in this plan.
- No optimistic mutations for identity, enrollment, grade, attendance, or finance data.
- All primary controls have at least a 44px target and all migrated workflows must be keyboard-operable.
- French and Arabic must expose the same information and actions; use logical layout properties and mirrored directional icons.
- Keep existing brand class aliases working until later pages migrate.
- The worktree contains unrelated staged and unstaged changes. Every commit command must use `git commit --only` with the task paths so unrelated changes remain untouched.

---

## Planned File Structure

### Design foundation

- Create `frontend/src/styles/tokens.css` — semantic light/dark-ready CSS variables.
- Modify `frontend/src/index.css` — import tokens and retain compatibility classes.
- Modify `frontend/tailwind.config.js` — expose semantic `ui.*` colors and elevation tokens.
- Modify `frontend/public/index.html` — load Inter and Noto Sans Arabic with `display=swap`.

### Shared UI

- Create `frontend/src/components/ui/Button.tsx` — button variants and loading state.
- Create `frontend/src/components/ui/Feedback.tsx` — skeleton, empty, error, and restricted states.
- Create `frontend/src/components/ui/ToastProvider.tsx` — accessible confirmation/error notices.
- Create `frontend/src/components/ui/DialogShell.tsx` — Headless UI dialog behavior.
- Create `frontend/src/components/ui/ConfirmationDialog.tsx` — shared destructive/unsaved-change confirmation.
- Create `frontend/src/components/ui/Field.tsx` — labelled input/select/textarea and field-message contracts.
- Create `frontend/src/components/ui/FormSection.tsx` — grouped fields and sticky actions.
- Create `frontend/src/components/ui/ResponsiveDataView.tsx` — desktop/mobile content switch with shared states.
- Create `frontend/src/components/ui/FilterToolbar.tsx` — labelled filter groups and active chips.
- Create `frontend/src/components/ui/Pagination.tsx` — accessible previous/next controls.
- Modify `frontend/src/components/common/EntityDisplay.tsx` — compatibility exports using the new primitives.

### Shell

- Create `frontend/src/components/layout/RouteFocusManager.tsx` — route-change focus behavior.
- Modify `frontend/src/components/layout/MainLayout.tsx` — skip link, semantic main region, new top bar.
- Modify `frontend/src/components/layout/Sidebar.tsx` — Institutional Command Center styling and improved mobile semantics.

### Students data and UI

- Modify `frontend/src/types/index.ts` — typed list filters, summary, and profile resource shapes.
- Modify `frontend/src/services/studentService.ts` — typed list, summary, profile-tab, and ID-card methods.
- Create `frontend/src/pages/students/studentQueries.ts` — query keys and React Query hooks.
- Create `frontend/src/pages/students/useStudentListParams.ts` — URL-backed filters and pagination.
- Create `frontend/src/pages/students/useStudentListScroll.ts` — route-keyed list scroll restoration.
- Create `frontend/src/pages/students/StudentSummary.tsx` — four summary metrics.
- Create `frontend/src/pages/students/StudentFilters.tsx` — search/program/level/status/current-year controls.
- Create `frontend/src/pages/students/StudentListView.tsx` — desktop table and mobile cards.
- Modify `frontend/src/pages/students/StudentsPage.tsx` — orchestration, navigation, downloads, and mutations.
- Move `frontend/src/pages/students/StudentDetailsModal.tsx` to `frontend/src/pages/students/profile/StudentProfileContent.tsx` — preserve tab content without modal framing.
- Create `frontend/src/pages/students/profile/StudentProfilePage.tsx` — route orchestration and student header.
- Modify `frontend/src/pages/students/StudentFormModal.tsx` — shared dialog/form primitives and query invalidation.
- Modify `frontend/src/components/common/PageHeader.tsx` — semantic-token compatibility styling.
- Modify `frontend/src/App.tsx` — add `/students/:studentId` route and toast provider.

### Tests and documentation

- Create `frontend/src/styles/tokens.test.ts`.
- Create `frontend/src/components/ui/ui.test.tsx`.
- Create `frontend/src/components/layout/MainLayout.test.tsx`.
- Create `frontend/src/pages/students/studentQueries.test.tsx`.
- Create `frontend/src/pages/students/StudentsPage.test.tsx`.
- Create `frontend/src/pages/students/StudentProfilePage.test.tsx`.
- Modify `frontend/src/pages/students/StudentModals.test.tsx`.
- Modify `frontend/src/components/layout/Sidebar.test.tsx`.
- Modify `frontend/src/locales/fr/translation.json` and `frontend/src/locales/ar/translation.json`.
- Create `frontend/src/accessibility/foundation.a11y.test.tsx`.
- Create `docs/ui-foundation-migration.md`.

---

### Task 1: Semantic Tokens and Explicit Font Loading

**Files:**
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/tokens.test.ts`
- Modify: `frontend/src/index.css:1-170`
- Modify: `frontend/tailwind.config.js:1-96`
- Modify: `frontend/public/index.html:1-40`

**Interfaces:**
- Produces CSS variables for primary/info/success/warning/danger colors, canvas/surface/foreground/border states, disabled/focus states, spacing, typography, radius, elevation, z-index, and motion.
- Produces Tailwind aliases `ui.primary`, `ui.info`, `ui.surface`, `ui.canvas`, `ui.foreground`, `ui.muted`, `ui.border`, `ui.disabled`, `ui.success`, `ui.warning`, and `ui.danger`.
- Existing `blue`, `green`, `orange`, and `brand.*` aliases remain available.

- [ ] **Step 1: Write the failing token contract test**

```ts
// frontend/src/styles/tokens.test.ts
import fs from 'fs';
import path from 'path';

describe('UI token contract', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src/styles/tokens.css'), 'utf8');
  const html = fs.readFileSync(path.join(process.cwd(), 'public/index.html'), 'utf8');

  it('defines light and dark-ready semantic variables', () => {
    expect(css).toContain(':root');
    expect(css).toContain("[data-theme='dark']");
    [
      '--ui-primary', '--ui-surface', '--ui-canvas', '--ui-foreground',
      '--ui-muted', '--ui-border', '--ui-success', '--ui-info', '--ui-warning',
      '--ui-danger', '--ui-ring', '--ui-disabled', '--font-arabic',
      '--radius-panel', '--z-dialog', '--motion-fast',
    ].forEach((token) => expect(css).toContain(token));
  });

  it('loads both approved font families with swap behavior', () => {
    expect(html).toContain('family=Inter');
    expect(html).toContain('family=Noto+Sans+Arabic');
    expect(html).toContain('display=swap');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/styles/tokens.test.ts`

Expected: FAIL because `src/styles/tokens.css` does not exist.

- [ ] **Step 3: Create the semantic token file**

```css
/* frontend/src/styles/tokens.css */
:root {
  color-scheme: light;
  --ui-primary: 26 76 145;
  --ui-primary-strong: 20 46 84;
  --ui-on-primary: 255 255 255;
  --ui-success: 27 171 83;
  --ui-success-strong: 21 128 61;
  --ui-info: 26 76 145;
  --ui-warning: 229 151 65;
  --ui-danger: 220 38 38;
  --ui-earth: 106 49 13;
  --ui-canvas: 244 247 246;
  --ui-surface: 255 255 255;
  --ui-surface-muted: 241 245 244;
  --ui-foreground: 15 23 42;
  --ui-muted: 100 116 139;
  --ui-border: 216 226 222;
  --ui-ring: 26 76 145;
  --ui-disabled: 148 163 184;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-arabic: 'Noto Sans Arabic', system-ui, sans-serif;
  --radius-control: 0.75rem;
  --radius-panel: 1.125rem;
  --elevation-panel: 0 10px 30px rgb(20 46 84 / 0.08);
  --elevation-floating: 0 22px 60px rgb(11 27 51 / 0.22);
  --z-sticky: 30;
  --z-drawer: 50;
  --z-dialog: 70;
  --z-toast: 90;
  --motion-fast: 160ms;
  --motion-standard: 220ms;
}

[data-theme='dark'] {
  color-scheme: dark;
  --ui-primary: 87 148 211;
  --ui-primary-strong: 20 46 84;
  --ui-on-primary: 255 255 255;
  --ui-success: 74 201 120;
  --ui-success-strong: 34 197 94;
  --ui-info: 141 184 228;
  --ui-warning: 242 185 94;
  --ui-danger: 248 113 113;
  --ui-earth: 229 151 65;
  --ui-canvas: 11 27 51;
  --ui-surface: 20 46 84;
  --ui-surface-muted: 21 54 100;
  --ui-foreground: 248 250 252;
  --ui-muted: 203 213 225;
  --ui-border: 51 65 85;
  --ui-ring: 141 184 228;
  --ui-disabled: 100 116 139;
}
```

- [ ] **Step 4: Wire tokens into Tailwind and base CSS**

Add this import before Tailwind directives in `frontend/src/index.css`:

```css
@import './styles/tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Change canvas, foreground, border, focus, panel, control, and motion rules to use `rgb(var(--ui-*) / <alpha-value>)`. Add these aliases inside `theme.extend.colors` in `frontend/tailwind.config.js`:

```js
ui: {
  primary: 'rgb(var(--ui-primary) / <alpha-value>)',
  'primary-strong': 'rgb(var(--ui-primary-strong) / <alpha-value>)',
  'on-primary': 'rgb(var(--ui-on-primary) / <alpha-value>)',
  success: 'rgb(var(--ui-success) / <alpha-value>)',
  'success-strong': 'rgb(var(--ui-success-strong) / <alpha-value>)',
  info: 'rgb(var(--ui-info) / <alpha-value>)',
  warning: 'rgb(var(--ui-warning) / <alpha-value>)',
  danger: 'rgb(var(--ui-danger) / <alpha-value>)',
  earth: 'rgb(var(--ui-earth) / <alpha-value>)',
  canvas: 'rgb(var(--ui-canvas) / <alpha-value>)',
  surface: 'rgb(var(--ui-surface) / <alpha-value>)',
  'surface-muted': 'rgb(var(--ui-surface-muted) / <alpha-value>)',
  foreground: 'rgb(var(--ui-foreground) / <alpha-value>)',
  muted: 'rgb(var(--ui-muted) / <alpha-value>)',
  border: 'rgb(var(--ui-border) / <alpha-value>)',
  ring: 'rgb(var(--ui-ring) / <alpha-value>)',
  disabled: 'rgb(var(--ui-disabled) / <alpha-value>)',
},
fontFamily: {
  sans: ['var(--font-sans)'],
  arabic: ['var(--font-arabic)'],
},
```

Add these base rules after Tailwind's directives so Arabic typography, mobile form sizing, tabular identifiers, and reduced motion are deterministic:

```css
@layer base {
  html { font-family: var(--font-sans); background: rgb(var(--ui-canvas)); color: rgb(var(--ui-foreground)); }
  html[dir='rtl'] { font-family: var(--font-arabic); }
  input, select, textarea, button { font: inherit; }
  .tabular-nums, [data-numeric='true'] { font-variant-numeric: tabular-nums; }
  :focus-visible { outline: 3px solid rgb(var(--ui-ring) / 0.35); outline-offset: 2px; }
}

@media (max-width: 767px) {
  input, select, textarea { font-size: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
}
```

- [ ] **Step 5: Load approved fonts explicitly**

Add to `frontend/public/index.html` inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 6: Run the token test and production build**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/styles/tokens.test.ts && npm run build`

Expected: token tests PASS and the React production build exits with code 0.

- [ ] **Step 7: Commit only token files**

```bash
git add frontend/src/styles/tokens.css frontend/src/styles/tokens.test.ts frontend/src/index.css frontend/tailwind.config.js frontend/public/index.html
git commit --only frontend/src/styles/tokens.css frontend/src/styles/tokens.test.ts frontend/src/index.css frontend/tailwind.config.js frontend/public/index.html -m "feat(ui): establish semantic design tokens"
```

---

### Task 2: Core Buttons, Feedback, and Accessible Toasts

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/Feedback.tsx`
- Create: `frontend/src/components/ui/ToastProvider.tsx`
- Create: `frontend/src/components/ui/ui.test.tsx`
- Modify: `frontend/src/App.tsx:1-95`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

**Interfaces:**
- Produces `Button`, `IconButton`, `PageSkeleton`, `EmptyState`, `ErrorState`, `RestrictedState`, `ToastProvider`, and `useToast`.
- `useToast()` returns `{ success(message: string): void; error(message: string): void; info(message: string): void }`.

- [ ] **Step 1: Add the accessibility assertion dependency**

Run: `cd frontend && npm install --save-dev jest-axe@10.0.0`

Expected: `jest-axe` appears in `devDependencies` and the lockfile changes.

- [ ] **Step 2: Write failing component behavior tests**

```tsx
// frontend/src/components/ui/ui.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button, IconButton } from './Button';
import { ErrorState } from './Feedback';
import { ToastProvider, useToast } from './ToastProvider';

const ToastTrigger = () => {
  const toast = useToast();
  return <button onClick={() => toast.success('Étudiant enregistré')}>notify</button>;
};

expect.extend(toHaveNoViolations);

describe('UI foundation primitives', () => {
  it('disables a loading button and exposes busy state', () => {
    render(<Button loading>Enregistrer</Button>);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('requires an accessible label for icon-only buttons', () => {
    render(<IconButton label="Modifier"><span aria-hidden="true">x</span></IconButton>);
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('offers a retry action on request failure', () => {
    const retry = jest.fn();
    render(<ErrorState title="Chargement impossible" description="Réessayez." onRetry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('announces success without moving focus', () => {
    render(<ToastProvider><ToastTrigger /></ToastProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'notify' }));
    expect(screen.getByRole('status')).toHaveTextContent('Étudiant enregistré');
  });

  it('has no basic axe violations', async () => {
    const { container } = render(<Button>Ajouter</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/components/ui/ui.test.tsx`

Expected: FAIL because the UI modules do not exist.

- [ ] **Step 4: Implement buttons and feedback states**

```tsx
// frontend/src/components/ui/Button.tsx
import React from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-ui-primary text-ui-on-primary hover:bg-ui-primary-strong shadow-panel',
  secondary: 'border border-ui-border bg-ui-surface text-ui-foreground hover:bg-ui-surface-muted',
  success: 'bg-ui-success-strong text-white hover:brightness-95',
  danger: 'bg-ui-danger text-white hover:brightness-95',
  ghost: 'text-ui-muted hover:bg-ui-surface-muted hover:text-ui-foreground',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', loading = false, disabled, className = '', children, ...props }) => (
  <button
    type="button"
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-2.5 text-sm font-bold transition duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring/20 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    {...props}
  >
    {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
    {children}
  </button>
);

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
}

export const IconButton: React.FC<IconButtonProps> = ({ label, variant = 'ghost', className = '', children, ...props }) => (
  <Button aria-label={label} title={label} variant={variant} className={`h-11 w-11 px-0 ${className}`} {...props}>
    {children}
  </Button>
);
```

```tsx
// frontend/src/components/ui/Feedback.tsx
import React from 'react';
import { ExclamationTriangleIcon, MagnifyingGlassIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

export const PageSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="animate-pulse space-y-3 p-5" aria-label="Chargement">
    {Array.from({ length: rows }).map((_, index) => <div key={index} className="h-20 rounded-2xl bg-ui-surface-muted" />)}
  </div>
);

interface StateProps { title: string; description: string; action?: React.ReactNode; }

export const EmptyState: React.FC<StateProps> = ({ title, description, action }) => (
  <div className="flex flex-col items-center px-6 py-16 text-center">
    <MagnifyingGlassIcon className="h-10 w-10 text-ui-primary" aria-hidden="true" />
    <h2 className="mt-5 text-lg font-extrabold text-ui-foreground">{title}</h2>
    <p className="mt-2 max-w-md text-sm text-ui-muted">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState: React.FC<StateProps & { onRetry: () => void }> = ({ title, description, onRetry }) => (
  <div role="alert" className="flex flex-col items-center px-6 py-16 text-center">
    <ExclamationTriangleIcon className="h-10 w-10 text-ui-danger" aria-hidden="true" />
    <h2 className="mt-5 text-lg font-extrabold text-ui-foreground">{title}</h2>
    <p className="mt-2 max-w-md text-sm text-ui-muted">{description}</p>
    <Button variant="secondary" className="mt-5" onClick={onRetry}>Réessayer</Button>
  </div>
);

export const RestrictedState: React.FC<StateProps> = ({ title, description }) => (
  <div className="flex flex-col items-center px-6 py-16 text-center">
    <ShieldExclamationIcon className="h-10 w-10 text-ui-warning" aria-hidden="true" />
    <h2 className="mt-5 text-lg font-extrabold text-ui-foreground">{title}</h2>
    <p className="mt-2 max-w-md text-sm text-ui-muted">{description}</p>
  </div>
);
```

- [ ] **Step 5: Implement the toast provider and mount it in App**

```tsx
// frontend/src/components/ui/ToastProvider.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type ToastTone = 'success' | 'error' | 'info';
interface ToastNotice { id: number; tone: ToastTone; message: string; }
interface ToastApi {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);
const toneClasses: Record<ToastTone, string> = {
  success: 'border-ui-success/30 bg-ui-surface text-ui-foreground',
  error: 'border-ui-danger/30 bg-ui-surface text-ui-foreground',
  info: 'border-ui-info/30 bg-ui-surface text-ui-foreground',
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [notices, setNotices] = useState<ToastNotice[]>([]);
  const dismiss = useCallback((id: number) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);
  const publish = useCallback((tone: ToastTone, message: string) => {
    const id = Date.now() + Math.random();
    setNotices((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);
  const api = useMemo<ToastApi>(() => ({
    success: (message) => publish('success', message),
    error: (message) => publish('error', message),
    info: (message) => publish('info', message),
  }), [publish]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed end-4 top-4 z-[var(--z-toast)] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {notices.map((notice) => (
          <div
            key={notice.id}
            role={notice.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-control)] border px-4 py-3 shadow-floating ${toneClasses[notice.tone]}`}
          >
            <span className="text-sm font-semibold">{notice.message}</span>
            <button type="button" aria-label="Fermer" onClick={() => dismiss(notice.id)} className="rounded-lg p-2 hover:bg-ui-surface-muted">
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used within ToastProvider');
  return value;
};
```

In `frontend/src/App.tsx`, wrap the existing `<AuthProvider>` with `<ToastProvider>` inside the existing `QueryClientProvider`; do not create a second query client/provider.

- [ ] **Step 6: Run primitive tests**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/components/ui/ui.test.tsx`

Expected: all UI primitive tests PASS with zero axe violations.

- [ ] **Step 7: Commit only primitive files**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/components/ui/Button.tsx frontend/src/components/ui/Feedback.tsx frontend/src/components/ui/ToastProvider.tsx frontend/src/components/ui/ui.test.tsx frontend/src/App.tsx
git commit --only frontend/package.json frontend/package-lock.json frontend/src/components/ui/Button.tsx frontend/src/components/ui/Feedback.tsx frontend/src/components/ui/ToastProvider.tsx frontend/src/components/ui/ui.test.tsx frontend/src/App.tsx -m "feat(ui): add accessible foundation primitives"
```

---

### Task 3: Accessible Dialog and Form Structure

**Files:**
- Create: `frontend/src/components/ui/DialogShell.tsx`
- Create: `frontend/src/components/ui/ConfirmationDialog.tsx`
- Create: `frontend/src/components/ui/Field.tsx`
- Create: `frontend/src/components/ui/FormSection.tsx`
- Modify: `frontend/src/components/ui/ui.test.tsx`

**Interfaces:**
- `DialogShellProps`: `open`, `title`, `description?`, `onClose`, `children`, `footer?`, `size?`, `busy?`.
- `ConfirmationDialogProps`: `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `tone`, `busy`, `onConfirm`, `onCancel`.
- `FieldProps`: `id`, `label`, `error?`, `hint?`, `required?`, `children`; the child control receives `aria-describedby` and `aria-invalid`.
- `FormSectionProps`: `title`, `description?`, `icon?`, `children`.
- `StickyFormActionsProps`: `children`.

- [ ] **Step 1: Add failing dialog tests**

Extend the test imports with `within` from Testing Library and `userEvent` from `@testing-library/user-event`.

```tsx
it('associates title/description and keeps actions outside the scroll body', () => {
  render(<DialogShell open title="Modifier" description="Dossier étudiant" onClose={jest.fn()} footer={<button>Enregistrer</button>}><p>Formulaire</p></DialogShell>);
  const dialog = screen.getByRole('dialog', { name: 'Modifier' });
  expect(dialog).toHaveAccessibleDescription('Dossier étudiant');
  expect(within(screen.getByTestId('dialog-scroll-body')).queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
});

it('prevents dismissal while busy', async () => {
  const onClose = jest.fn();
  render(<DialogShell open busy title="Modifier" onClose={onClose}>Formulaire</DialogShell>);
  await userEvent.keyboard('{Escape}');
  expect(onClose).not.toHaveBeenCalled();
});

it('restores focus after a confirmation closes', async () => {
  const Harness = () => {
    const [open, setOpen] = React.useState(false);
    return <><button onClick={() => setOpen(true)}>Supprimer</button><ConfirmationDialog open={open} title="Confirmer" description="Action irréversible" confirmLabel="Supprimer" cancelLabel="Annuler" tone="danger" onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)} /></>;
  };
  render(<Harness />);
  await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
  await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(screen.getByRole('button', { name: 'Supprimer' })).toHaveFocus();
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/components/ui/ui.test.tsx`

Expected: FAIL because `DialogShell` and `FormSection` are missing.

- [ ] **Step 3: Implement the Headless UI dialog shell**

```tsx
// frontend/src/components/ui/DialogShell.tsx
import React from 'react';
import { Dialog, DialogBackdrop, DialogDescription, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { IconButton } from './Button';

type DialogSize = 'md' | 'lg' | 'xl';
const widths: Record<DialogSize, string> = { md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };

export interface DialogShellProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: DialogSize;
  busy?: boolean;
}

export const DialogShell: React.FC<DialogShellProps> = ({ open, title, description, onClose, children, footer, size = 'md', busy = false }) => (
  <Dialog open={open} onClose={() => { if (!busy) onClose(); }} className="relative z-[70]">
    <DialogBackdrop transition className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity data-[closed]:opacity-0" />
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
      <DialogPanel transition className={`flex max-h-[calc(100dvh-1rem)] w-full ${widths[size]} flex-col overflow-hidden rounded-[var(--radius-panel)] bg-ui-surface shadow-floating transition data-[closed]:translate-y-3 data-[closed]:opacity-0 sm:max-h-[90dvh]`}>
        <header className="shrink-0 border-b border-ui-border bg-ui-primary-strong px-5 py-4 text-white sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div><DialogTitle className="text-xl font-extrabold">{title}</DialogTitle>{description && <DialogDescription className="mt-1 text-sm text-blue-100/80">{description}</DialogDescription>}</div>
            <IconButton label="Fermer" variant="ghost" disabled={busy} onClick={onClose} className="text-white hover:bg-white/10 hover:text-white"><XMarkIcon className="h-6 w-6" /></IconButton>
          </div>
        </header>
        <div data-testid="dialog-scroll-body" className="min-h-0 flex-1 overflow-y-auto bg-ui-canvas p-4 sm:p-6">{children}</div>
        {footer && <footer className="shrink-0 border-t border-ui-border bg-ui-surface px-4 py-3 sm:px-6">{footer}</footer>}
      </DialogPanel>
    </div>
  </Dialog>
);
```

- [ ] **Step 4: Implement form grouping primitives**

```tsx
// frontend/src/components/ui/FormSection.tsx
import React from 'react';

export const FormSection: React.FC<{ title: string; description?: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, description, icon, children }) => (
  <fieldset className="rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface p-4 sm:p-5">
    <legend className="px-2 text-base font-extrabold text-ui-foreground"><span className="inline-flex items-center gap-2">{icon}{title}</span></legend>
    {description && <p className="mb-4 text-sm text-ui-muted">{description}</p>}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
  </fieldset>
);

export const StickyFormActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
);
```

```tsx
// frontend/src/components/ui/ConfirmationDialog.tsx
import React from 'react';
import { Button } from './Button';
import { DialogShell } from './DialogShell';

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ open, title, description, confirmLabel, cancelLabel, tone = 'primary', busy = false, onConfirm, onCancel }) => (
  <DialogShell
    open={open}
    title={title}
    description={description}
    onClose={onCancel}
    busy={busy}
    footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</Button><Button variant={tone} onClick={onConfirm} loading={busy}>{confirmLabel}</Button></div>}
  >
    <p className="text-sm text-ui-muted">{description}</p>
  </DialogShell>
);
```

```tsx
// frontend/src/components/ui/Field.tsx
import React from 'react';

export const Field: React.FC<{ id: string; label: string; error?: string; hint?: string; required?: boolean; children: React.ReactElement }> = ({ id, label, error, hint, required, children }) => {
  const messageId = `${id}-message`;
  return <div className="space-y-1.5"><label htmlFor={id} className="block text-sm font-bold text-ui-foreground">{label}{required && <span aria-hidden="true" className="ms-1 text-ui-danger">*</span>}</label>{React.cloneElement(children, { id, 'aria-invalid': Boolean(error), 'aria-describedby': error || hint ? messageId : undefined, className: `brand-input ${children.props.className || ''}` })}{(error || hint) && <p id={messageId} className={`text-sm ${error ? 'text-ui-danger' : 'text-ui-muted'}`}>{error || hint}</p>}</div>;
};
```

- [ ] **Step 5: Run dialog tests and commit**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/components/ui/ui.test.tsx`

Expected: PASS.

```bash
git add frontend/src/components/ui/DialogShell.tsx frontend/src/components/ui/ConfirmationDialog.tsx frontend/src/components/ui/Field.tsx frontend/src/components/ui/FormSection.tsx frontend/src/components/ui/ui.test.tsx
git commit --only frontend/src/components/ui/DialogShell.tsx frontend/src/components/ui/ConfirmationDialog.tsx frontend/src/components/ui/Field.tsx frontend/src/components/ui/FormSection.tsx frontend/src/components/ui/ui.test.tsx -m "feat(ui): add accessible dialogs and form sections"
```

---

### Task 4: Responsive Data, Filters, Pagination, and Compatibility

**Files:**
- Create: `frontend/src/components/ui/ResponsiveDataView.tsx`
- Create: `frontend/src/components/ui/FilterToolbar.tsx`
- Create: `frontend/src/components/ui/Pagination.tsx`
- Modify: `frontend/src/components/common/EntityDisplay.tsx:1-180`
- Modify: `frontend/src/components/common/PageHeader.tsx:1-120`
- Modify: `frontend/src/components/ui/ui.test.tsx`

**Interfaces:**
- `ResponsiveDataViewProps`: loading, backgroundFetching, error, empty, desktop, mobile, retry.
- `FilterToolbarProps`: `label`, `children`, `chips`, `onClear`, `clearLabel`.
- `PaginationProps`: page, pageSize, currentCount, total, previous/next callbacks.

- [ ] **Step 1: Add failing responsive-state tests**

```tsx
it('switches responsive data states and exposes background refresh', () => {
  const { rerender } = render(<ResponsiveDataView loading backgroundFetching={false} error={false} empty={false} desktop={<p>desktop</p>} mobile={<p>mobile</p>} emptyTitle="Vide" emptyDescription="Aucune donnée" errorTitle="Erreur" errorDescription="Impossible" onRetry={jest.fn()} />);
  expect(screen.getByLabelText('Chargement')).toBeInTheDocument();
  rerender(<ResponsiveDataView loading={false} backgroundFetching error={false} empty={false} desktop={<p>desktop</p>} mobile={<p>mobile</p>} emptyTitle="Vide" emptyDescription="Aucune donnée" errorTitle="Erreur" errorDescription="Impossible" onRetry={jest.fn()} />);
  expect(screen.getByRole('progressbar', { name: 'Actualisation' })).toBeInTheDocument();
  expect(screen.getByText('desktop').parentElement).toHaveClass('hidden', 'md:block');
  expect(screen.getByText('mobile').parentElement).toHaveClass('md:hidden');
});

it('disables pagination at both boundaries', () => {
  const { rerender } = render(<Pagination page={1} pageSize={20} currentCount={20} total={21} onPrevious={jest.fn()} onNext={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
  rerender(<Pagination page={2} pageSize={20} currentCount={1} total={21} onPrevious={jest.fn()} onNext={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/components/ui/ui.test.tsx`

Expected: FAIL because responsive data modules do not exist.

- [ ] **Step 3: Implement responsive data state switching**

```tsx
// frontend/src/components/ui/ResponsiveDataView.tsx
import React from 'react';
import { EmptyState, ErrorState, PageSkeleton } from './Feedback';

export interface ResponsiveDataViewProps {
  loading: boolean;
  backgroundFetching: boolean;
  error: boolean;
  empty: boolean;
  desktop: React.ReactNode;
  mobile: React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
  errorTitle: string;
  errorDescription: string;
  onRetry: () => void;
}

export const ResponsiveDataView: React.FC<ResponsiveDataViewProps> = (props) => {
  if (props.loading) return <PageSkeleton />;
  if (props.error) return <ErrorState title={props.errorTitle} description={props.errorDescription} onRetry={props.onRetry} />;
  if (props.empty) return <EmptyState title={props.emptyTitle} description={props.emptyDescription} action={props.emptyAction} />;
  return <div className="relative">{props.backgroundFetching && <div role="progressbar" aria-label="Actualisation" className="absolute inset-x-0 top-0 z-[var(--z-sticky)] h-0.5 overflow-hidden bg-ui-primary/15"><div className="h-full w-1/3 animate-pulse bg-ui-primary" /></div>}<div className="md:hidden">{props.mobile}</div><div className="hidden md:block">{props.desktop}</div></div>;
};
```

- [ ] **Step 4: Implement filters and pagination**

```tsx
// frontend/src/components/ui/FilterToolbar.tsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

export interface FilterChip { key: string; label: string; onRemove: () => void; }
export const FilterToolbar: React.FC<{ label: string; children: React.ReactNode; chips: FilterChip[]; onClear: () => void; clearLabel: string }> = ({ label, children, chips, onClear, clearLabel }) => (
  <section aria-label={label} className="rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface p-4 shadow-panel">
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">{children}</div>
    {chips.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2">{chips.map((chip) => <button key={chip.key} type="button" onClick={chip.onRemove} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ui-border bg-ui-surface-muted px-3 text-sm font-semibold text-ui-foreground">{chip.label}<XMarkIcon className="h-4 w-4" aria-hidden="true" /></button>)}<Button variant="ghost" onClick={onClear}>{clearLabel}</Button></div>}
  </section>
);
```

```tsx
// frontend/src/components/ui/Pagination.tsx
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export const Pagination: React.FC<{ page: number; pageSize: number; currentCount: number; total: number; onPrevious: () => void; onNext: () => void }> = ({ page, pageSize, currentCount, total, onPrevious, onNext }) => {
  const { t } = useTranslation();
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(start + currentCount - 1, total);
  return <nav aria-label={t('common.pagination', 'Pagination')} className="flex flex-col gap-3 border-t border-ui-border bg-ui-surface-muted px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-ui-muted"><span className="font-bold tabular-nums text-ui-foreground">{start}–{end}</span> {t('common.of', 'sur')} <span className="font-bold tabular-nums text-ui-foreground">{total}</span></p><div className="flex items-center gap-2"><Button variant="secondary" aria-label={t('common.prev', 'Précédent')} onClick={onPrevious} disabled={page === 1}><ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /><span className="hidden sm:inline">{t('common.prev', 'Précédent')}</span></Button><span aria-current="page" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-ui-primary px-3 font-bold tabular-nums text-ui-on-primary">{page}</span><Button variant="secondary" aria-label={t('common.next', 'Suivant')} onClick={onNext} disabled={end >= total}><span className="hidden sm:inline">{t('common.next', 'Suivant')}</span><ChevronRightIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /></Button></div></nav>;
};
```

- [ ] **Step 5: Preserve compatibility exports**

Update `EntityDisplay.tsx` so `EmptyState` and `ListLoading` delegate to `EmptyState`/`PageSkeleton`, and `PaginationBar` maps `currentPage` to the new `Pagination.page` prop while retaining every current prop signature. Leave `EntityAvatar`, `StatusPill`, and `IconActionButton` exported for non-migrated pages. Update `PageHeader.tsx` only by replacing raw surface/color/radius classes with semantic token classes; retain its current props so non-migrated pages compile unchanged.

- [ ] **Step 6: Run UI tests and commit**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/components/ui/ui.test.tsx`

Expected: PASS.

```bash
git add frontend/src/components/ui/ResponsiveDataView.tsx frontend/src/components/ui/FilterToolbar.tsx frontend/src/components/ui/Pagination.tsx frontend/src/components/common/EntityDisplay.tsx frontend/src/components/common/PageHeader.tsx frontend/src/components/ui/ui.test.tsx
git commit --only frontend/src/components/ui/ResponsiveDataView.tsx frontend/src/components/ui/FilterToolbar.tsx frontend/src/components/ui/Pagination.tsx frontend/src/components/common/EntityDisplay.tsx frontend/src/components/common/PageHeader.tsx frontend/src/components/ui/ui.test.tsx -m "feat(ui): add responsive data foundation"
```

---

### Task 5: Transform the Application Shell

**Files:**
- Create: `frontend/src/components/layout/RouteFocusManager.tsx`
- Create: `frontend/src/components/layout/MainLayout.test.tsx`
- Modify: `frontend/src/components/layout/MainLayout.tsx:1-118`
- Modify: `frontend/src/components/layout/Sidebar.tsx:1-288`
- Modify: `frontend/src/components/layout/Sidebar.test.tsx:1-76`
- Modify: `frontend/src/index.css:1-190`

**Interfaces:**
- `RouteFocusManager({ targetId: string })` focuses the target after pathname changes.
- Main content id is `main-content` and remains the skip-link target in both directions.
- Sidebar navigation data and role filtering remain unchanged.

- [ ] **Step 1: Write failing shell accessibility tests**

Test that MainLayout renders a skip link to `#main-content`, the main region has `tabIndex={-1}`, route changes focus it, the mobile menu button has an accessible name, and Sidebar retains semantic start positioning in RTL.

- [ ] **Step 2: Run shell tests to verify failure**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/components/layout/MainLayout.test.tsx src/components/layout/Sidebar.test.tsx`

Expected: MainLayout tests FAIL because skip-link and route focus behavior are missing.

- [ ] **Step 3: Implement route focus management**

```tsx
// frontend/src/components/layout/RouteFocusManager.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RouteFocusManager: React.FC<{ targetId: string }> = ({ targetId }) => {
  const { pathname } = useLocation();
  useEffect(() => {
    const target = document.getElementById(targetId);
    target?.focus({ preventScroll: true });
  }, [pathname, targetId]);
  return null;
};

export default RouteFocusManager;
```

- [ ] **Step 4: Transform MainLayout**

Add a visually hidden skip link that becomes visible on focus, mount `RouteFocusManager`, set `<main id="main-content" tabIndex={-1}>`, and apply the approved navy/white Institutional Command Center hierarchy. Retain the language switcher, localized date, user identity, and Outlet.

- [ ] **Step 5: Transform Sidebar without changing authorization**

Keep the existing `navigation`, `hasRole`, path matching, group state, logout, and collapse behavior. Replace visual classes with semantic `ui.*` tokens, ensure every icon-only button has `aria-label`, keep `app-sidebar`/`app-sidebar-open`, and use `aria-current="page"` on active links.

- [ ] **Step 6: Run shell tests and build**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/components/layout/MainLayout.test.tsx src/components/layout/Sidebar.test.tsx && npm run build`

Expected: all shell tests PASS and build exits 0.

- [ ] **Step 7: Commit the shell**

```bash
git add frontend/src/components/layout/RouteFocusManager.tsx frontend/src/components/layout/MainLayout.tsx frontend/src/components/layout/MainLayout.test.tsx frontend/src/components/layout/Sidebar.tsx frontend/src/components/layout/Sidebar.test.tsx frontend/src/index.css
git commit --only frontend/src/components/layout/RouteFocusManager.tsx frontend/src/components/layout/MainLayout.tsx frontend/src/components/layout/MainLayout.test.tsx frontend/src/components/layout/Sidebar.tsx frontend/src/components/layout/Sidebar.test.tsx frontend/src/index.css -m "feat(ui): transform the application shell"
```

---

### Task 6: Typed Students Query Layer and URL State

**Files:**
- Modify: `frontend/src/types/index.ts:80-125`
- Modify: `frontend/src/services/studentService.ts:1-67`
- Create: `frontend/src/pages/students/studentQueries.ts`
- Create: `frontend/src/pages/students/useStudentListParams.ts`
- Create: `frontend/src/pages/students/useStudentListScroll.ts`
- Create: `frontend/src/pages/students/studentQueries.test.tsx`

**Interfaces:**
- `StudentListParams`: page, search, program, current_level, status, current_year_only, ordering.
- `StudentSummary`: total, active, graduated, suspended.
- `studentQueryKeys.list(params)`, `.detail(id)`, `.enrollments(id)`, `.grades(id)`, `.attendance(id)`, `.bulletins(id)`, `.finance(id)`, `.idCard(id)`.
- `useStudentListParams()` returns `{ params, setParam, clearFilters }` backed by `useSearchParams`.
- `useStudentListScroll(key)` restores `window.scrollY` after cached list data renders and stores it on unmount.

- [ ] **Step 1: Write failing query-key and URL-state tests**

Test stable query keys, parsing `?page=2&search=mariam&program=3&current_level=1&status=ACTIVE&current_year_only=true&ordering=-enrollment_date`, resetting page to 1 when another filter changes, clearing all filters while keeping `current_year_only=true`, and restoring a saved scroll offset for the exact URL key.

- [ ] **Step 2: Run tests to verify failure**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/pages/students/studentQueries.test.tsx`

Expected: FAIL because the query and URL modules are missing.

- [ ] **Step 3: Add exact Students types**

```ts
export interface StudentListParams {
  page: number;
  search: string;
  program: number | null;
  current_level: number | null;
  status: '' | Student['status'];
  current_year_only: boolean;
  ordering: '' | 'student_id' | '-student_id' | 'enrollment_date' | '-enrollment_date' | 'created_at' | '-created_at';
}

export interface StudentSummary {
  total: number;
  active: number;
  graduated: number;
  suspended: number;
}
```

Add these exact response contracts (retain any additional serializer fields already present):

```ts
export interface StudentEnrollmentSummary { id: number; academic_year: number; academic_year_name: string; program: number; program_name: string; level: number; level_display: string; status: string; }
export interface StudentGradesResponse { exam_grades: PaginatedResponse<Grade>; course_grades: PaginatedResponse<CourseGrade>; }
export interface StudentAttendanceStatistics { student_id: number; student_name: string; statistics: { total_sessions: number; present: number; absent: number; late: number; excused: number; attendance_rate: number; }; }
export interface StudentReportCard { id: number; academic_year_name?: string; semester_name?: string; gpa?: string; is_published?: boolean; }
export interface StudentFinancialTransaction { id?: number; date?: string; description?: string; amount?: string; type?: string; }
export interface StudentFinancialStatement { total_due: string; total_paid: string; balance: string; transactions: StudentFinancialTransaction[]; }
export type StudentProfileTab = 'info' | 'enrollments' | 'grades' | 'attendance' | 'bulletins' | 'finance' | 'idcard';
```

- [ ] **Step 4: Type and extend studentService**

Use the following service signatures and preserve these existing endpoint paths:

```ts
getStudents(params: StudentListParams, signal?: AbortSignal): Promise<PaginatedResponse<Student>>;
getStudent(id: number, signal?: AbortSignal): Promise<Student>;
exportStudents(params: StudentListParams): Promise<Blob>;
getStudentSummary(currentYearOnly: boolean): Promise<StudentSummary>; // GET /students/ four times: unfiltered + ACTIVE + GRADUATED + SUSPENDED
getEnrollments(id: number, signal?: AbortSignal): Promise<PaginatedResponse<StudentEnrollmentSummary>>; // /students/:id/enrollments/
getGrades(id: number, signal?: AbortSignal): Promise<StudentGradesResponse>; // /students/:id/grades/
getAttendance(id: number, signal?: AbortSignal): Promise<StudentAttendanceStatistics>; // /students/:id/attendance_stats/
getReportCards(id: number, signal?: AbortSignal): Promise<PaginatedResponse<StudentReportCard>>; // /academics/report-cards/?student=:id
getFinancialStatement(id: number, signal?: AbortSignal): Promise<StudentFinancialStatement>; // /finance/student-balances/statement/?student_id=:id
downloadIdCard(id: number, signal?: AbortSignal): Promise<Blob>; // /students/:id/generate_id_card/
```

Build request params by omitting `null` and empty-string filter values. Pass React Query's `signal` to Axios for cancellable profile/list requests. Do not change an endpoint or add a backend summary endpoint.

- [ ] **Step 5: Implement query keys and hooks**

```ts
// frontend/src/pages/students/studentQueries.ts
import { useQuery } from '@tanstack/react-query';
import studentService from '../../services/studentService';
import { StudentListParams } from '../../types';

export const studentQueryKeys = {
  all: ['students'] as const,
  lists: () => ['students', 'list'] as const,
  list: (params: StudentListParams) => [...studentQueryKeys.lists(), params] as const,
  summaries: () => ['students', 'summary'] as const,
  summary: (currentYearOnly: boolean) => [...studentQueryKeys.summaries(), currentYearOnly] as const,
  detail: (id: number) => ['students', 'detail', id] as const,
  enrollments: (id: number) => ['students', id, 'enrollments'] as const,
  grades: (id: number) => ['students', id, 'grades'] as const,
  attendance: (id: number) => ['students', id, 'attendance'] as const,
  bulletins: (id: number) => ['students', id, 'bulletins'] as const,
  finance: (id: number) => ['students', id, 'finance'] as const,
  idCard: (id: number) => ['students', id, 'id-card'] as const,
};

export const useStudentsQuery = (params: StudentListParams) => useQuery({ queryKey: studentQueryKeys.list(params), queryFn: ({ signal }) => studentService.getStudents(params, signal), staleTime: 30_000 });
export const useStudentSummaryQuery = (currentYearOnly: boolean) => useQuery({ queryKey: studentQueryKeys.summary(currentYearOnly), queryFn: () => studentService.getStudentSummary(currentYearOnly), staleTime: 60_000 });
export const useStudentQuery = (id: number) => useQuery({ queryKey: studentQueryKeys.detail(id), queryFn: ({ signal }) => studentService.getStudent(id, signal), enabled: id > 0, staleTime: 30_000 });
```

Add `useStudentEnrollmentsQuery`, `useStudentGradesQuery`, `useStudentAttendanceQuery`, `useStudentBulletinsQuery`, `useStudentFinanceQuery`, and `useStudentIdCardQuery`. Each accepts `(id, enabled)`, uses its exact key/service method, and sets `enabled: id > 0 && enabled`. The ID-card hook uses a 15-second Axios timeout and returns a `Blob`; `StudentProfileContent` creates one object URL from the blob and revokes it in effect cleanup.

- [ ] **Step 6: Implement URL-backed list parameters**

Create `useStudentListParams.ts` with strict positive-integer parsing, an allow-list for `status` and `ordering`, `setParam` that always resets `page` to 1 except when changing page itself, and `clearFilters` that restores page 1 and `current_year_only=true`. URL serialization omits defaults (`page=1`, blank filters) but writes `current_year_only=false` when selected.

Create `useStudentListScroll.ts` with this storage contract:

```ts
const positions = new Map<string, number>();
export const useStudentListScroll = (key: string, ready: boolean) => {
  React.useLayoutEffect(() => {
    if (ready) window.requestAnimationFrame(() => window.scrollTo({ top: positions.get(key) || 0 }));
    return () => { positions.set(key, window.scrollY); };
  }, [key, ready]);
};
```

- [ ] **Step 7: Run tests and commit**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/pages/students/studentQueries.test.tsx`

Expected: PASS.

```bash
git add frontend/src/types/index.ts frontend/src/services/studentService.ts frontend/src/pages/students/studentQueries.ts frontend/src/pages/students/useStudentListParams.ts frontend/src/pages/students/useStudentListScroll.ts frontend/src/pages/students/studentQueries.test.tsx
git commit --only frontend/src/types/index.ts frontend/src/services/studentService.ts frontend/src/pages/students/studentQueries.ts frontend/src/pages/students/useStudentListParams.ts frontend/src/pages/students/useStudentListScroll.ts frontend/src/pages/students/studentQueries.test.tsx -m "feat(students): add typed query and URL state"
```

---

### Task 7: Migrate the Students List

**Files:**
- Create: `frontend/src/pages/students/StudentSummary.tsx`
- Create: `frontend/src/pages/students/StudentFilters.tsx`
- Create: `frontend/src/pages/students/StudentListView.tsx`
- Create: `frontend/src/pages/students/StudentsPage.test.tsx`
- Modify: `frontend/src/pages/students/StudentsPage.tsx:1-442`
- Modify: `frontend/src/locales/fr/translation.json`
- Modify: `frontend/src/locales/ar/translation.json`

**Interfaces:**
- `StudentSummary({ summary, loading })` renders total/active/graduated/suspended.
- `StudentFilters({ params, programs, levels, onChange, onClear })` renders all approved filters.
- `StudentListView({ students, selectedIds, ordering, onSort, onToggle, onToggleAll, onView, onEdit, onDownloadCard, canManage })` renders desktop table and mobile cards.

- [ ] **Step 1: Write failing Students page tests**

Mock query hooks and assert summary metrics, URL-backed filters/order, error Retry, non-blocking background refresh, mobile/desktop renderers, accessible selection labels, navigation to `/students/1`, restored scroll position, and allowed edit actions for ADMIN/DEAN/SECRETARY only.

- [ ] **Step 2: Run tests to verify failure**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/pages/students/StudentsPage.test.tsx`

Expected: FAIL because the new components and route navigation are missing.

- [ ] **Step 3: Implement StudentSummary and StudentFilters**

Use semantic cards with visible labels and tabular values. Load programs and levels through existing `universityService` methods. Every filter receives a visible `<label>`, and active filters appear as removable chips. Filter changes call `setParam` with exact keys `search`, `program`, `current_level`, `status`, and `current_year_only`; do not keep duplicate local filter state.

- [ ] **Step 4: Implement StudentListView**

Move current name/status helpers, selection, mobile cards, and desktop rows into the new component. Replace handwritten controls with `IconButton`, add `aria-label` to row/select-all checkboxes, use a sticky table header, and call `onView(student.id)` rather than opening a modal. Make the Matricule and Inscription headers buttons: clicking toggles `student_id`/`-student_id` and `enrollment_date`/`-enrollment_date`; set `aria-sort="ascending"`, `"descending"`, or `"none"` on their `<th>` elements. Mobile cards retain the server order and do not add a separate client sort.

- [ ] **Step 5: Rewrite StudentsPage as orchestration**

Use `useStudentListParams`, `useStudentListScroll(location.pathname + location.search, query.isSuccess)`, `useStudentsQuery`, and `useStudentSummaryQuery`. Use `useNavigate` for profiles. Pass `query.isLoading` and `query.isFetching && !query.isLoading` separately to `ResponsiveDataView`. Preserve export, import, bulk ID-card download, single ID-card download, create, and edit behavior. Replace `alert()` with `useToast().error()` and query errors with Retry; map HTTP 403 to `RestrictedState` rather than a generic request error.

- [ ] **Step 6: Add French and Arabic list translations**

Add matching keys for summary labels, program/level filters, clear filters, loading, retry, restricted state, selection labels, and accessible checkbox names in both locale files.

- [ ] **Step 7: Run Students tests and commit**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/pages/students/StudentsPage.test.tsx src/pages/students/StudentModals.test.tsx`

Expected: PASS.

```bash
git add frontend/src/pages/students/StudentSummary.tsx frontend/src/pages/students/StudentFilters.tsx frontend/src/pages/students/StudentListView.tsx frontend/src/pages/students/StudentsPage.tsx frontend/src/pages/students/StudentsPage.test.tsx frontend/src/locales/fr/translation.json frontend/src/locales/ar/translation.json
git commit --only frontend/src/pages/students/StudentSummary.tsx frontend/src/pages/students/StudentFilters.tsx frontend/src/pages/students/StudentListView.tsx frontend/src/pages/students/StudentsPage.tsx frontend/src/pages/students/StudentsPage.test.tsx frontend/src/locales/fr/translation.json frontend/src/locales/ar/translation.json -m "feat(students): migrate the responsive student list"
```

---

### Task 8: Replace the Student Detail Modal with a Profile Route

**Files:**
- Create: `frontend/src/pages/students/profile/StudentProfilePage.tsx`
- Move: `frontend/src/pages/students/StudentDetailsModal.tsx` → `frontend/src/pages/students/profile/StudentProfileContent.tsx`
- Create: `frontend/src/pages/students/StudentProfilePage.test.tsx`
- Modify: `frontend/src/App.tsx:35-65`
- Modify: `frontend/src/pages/students/StudentsPage.tsx`
- Modify: `frontend/src/pages/students/StudentModals.test.tsx`

**Interfaces:**
- Route: `/students/:studentId`.
- `StudentProfileContent({ student, activeTab, onTabChange })` renders the existing overview and tab content without modal framing.
- Back navigation uses `location.state.from` when available and `/students` otherwise.

- [ ] **Step 1: Write failing profile route tests**

Test detail loading, Back destination preservation, URL-backed tab activation, no attendance request before attendance tab activation, independent tab Retry, a Retry action on ID-card timeout, and Edit/ID-card action visibility for ADMIN/DEAN/SECRETARY but not ACCOUNTANT.

- [ ] **Step 2: Run tests to verify failure**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/pages/students/StudentProfilePage.test.tsx`

Expected: FAIL because the profile route does not exist.

- [ ] **Step 3: Add the route**

```tsx
<Route path="students" element={<StudentsPage />} />
<Route path="students/:studentId" element={<StudentProfilePage />} />
```

- [ ] **Step 4: Create StudentProfilePage orchestration**

Use `useParams`, `useLocation`, `useNavigate`, `useAuth`, `useStudentQuery`, and a URL-backed `tab` search parameter. Parse `studentId` as a strict positive integer and render the existing 404 state when invalid. Accept only `info`, `enrollments`, `grades`, `attendance`, `bulletins`, `finance`, and `idcard`; replace an unknown `tab` with `info`. Render a profile header with Back, photo, full name, matricule, status, program, level, Edit, and ID-card download. Show `PageSkeleton`, `ErrorState`, or `RestrictedState` for top-level query outcomes. `canManageStudent` and `canGenerateIdCard` are both `['ADMIN', 'DEAN', 'SECRETARY'].includes(user.role)` to match backend permissions.

- [ ] **Step 5: Convert modal content to routed content**

Move the file, remove backdrop/dialog/header/close wrappers, accept explicit `activeTab` and `onTabChange`, replace its internal `useEffect` fetch switch with enabled React Query tab hooks, and retain the existing tab render bodies. Each tab consumes only its own hook and renders its own skeleton, `ErrorState` Retry, empty state, or content; a failure in Finance must not replace Grades or the profile header. Replace emojis and handwritten SVG controls with Heroicons. Give each tab `id="student-tab-<name>"`, `aria-controls="student-panel-<name>"`, arrow-key navigation, and a matching `role="tabpanel"`/`aria-labelledby` pair.

- [ ] **Step 6: Preserve list context on navigation**

In `StudentsPage`, navigate with:

```ts
navigate(`/students/${studentId}`, {
  state: { from: `${location.pathname}${location.search}` },
});
```

The profile Back action navigates to `location.state?.from || '/students'`. The list scroll hook from Task 6 restores the recorded offset after the cached list query is ready.

- [ ] **Step 7: Update modal regression tests**

Remove detail-modal viewport assertions from `StudentModals.test.tsx`. Keep form viewport and multipart photo tests. Move ID-card timeout coverage to `StudentProfilePage.test.tsx`.

- [ ] **Step 8: Run route and regression tests, then commit**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/pages/students/StudentProfilePage.test.tsx src/pages/students/StudentsPage.test.tsx src/pages/students/StudentModals.test.tsx`

Expected: PASS.

```bash
git add frontend/src/App.tsx frontend/src/pages/students/StudentsPage.tsx frontend/src/pages/students/profile/StudentProfilePage.tsx frontend/src/pages/students/profile/StudentProfileContent.tsx frontend/src/pages/students/StudentProfilePage.test.tsx frontend/src/pages/students/StudentModals.test.tsx
git commit --only frontend/src/App.tsx frontend/src/pages/students/StudentsPage.tsx frontend/src/pages/students/profile/StudentProfilePage.tsx frontend/src/pages/students/profile/StudentProfileContent.tsx frontend/src/pages/students/StudentProfilePage.test.tsx frontend/src/pages/students/StudentModals.test.tsx -m "feat(students): add deep-linked student profiles"
```

---

### Task 9: Migrate Student Create/Edit and Query Invalidation

**Files:**
- Modify: `frontend/src/pages/students/StudentFormModal.tsx:1-556`
- Modify: `frontend/src/pages/students/StudentModals.test.tsx`
- Modify: `frontend/src/pages/students/StudentsPage.tsx`
- Modify: `frontend/src/pages/students/studentQueries.ts`
- Modify: `frontend/src/utils/apiError.ts`

**Interfaces:**
- Student form continues receiving `student?`, `onClose`, and `onSuccess`.
- `onSuccess(savedStudent)` remains compatible with current imports.
- Form errors use `NormalizedApiError` and `getFieldError`.
- Create invalidates list and summary prefixes; edit invalidates list, summary, and exact detail; photo edit additionally invalidates the exact ID-card key.

- [ ] **Step 1: Add failing form behavior tests**

Extend `StudentModals.test.tsx` to verify DialogShell semantics, sticky footer outside scroll body, unsaved-change confirmation, field-level API errors, changed-field-only PATCH, multipart photo-only PATCH, and profile/ID-card query invalidation after photo success.

- [ ] **Step 2: Run tests to verify failure**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/pages/students/StudentModals.test.tsx`

Expected: new dialog/error/invalidation assertions FAIL.

- [ ] **Step 3: Replace custom modal framing**

Render `DialogShell open title description onClose footer busy`, move the two existing form stages into `FormSection` blocks, wrap each control in `Field`, use shared `Button` controls, and keep the current single scroll region. Preserve the visible two-step indicator and Back/Next controls so progressive disclosure remains clear.

- [ ] **Step 4: Add unsaved-change protection**

Derive `dirty` from current user/student values, initial values, and selected photo. Route all backdrop, Escape, and close-button requests through `ConfirmationDialog` when `dirty && !loading`; Cancel closes only the confirmation and Discard invokes the original `onClose`.

- [ ] **Step 5: Normalize field errors**

Store `NormalizedApiError | null`, pass `response.data` to `normalizeApiError`, render a `role="alert"` linked error summary at the top, and render `getFieldError(error, fieldName)` immediately below each field through `Field.error`. After validation or API failure, focus the first control whose key exists in `error.fields`; if there are no field keys, focus the summary.

- [ ] **Step 6: Invalidate exact queries after success**

Use `useQueryClient` and these exact invalidations; do not invalidate `studentQueryKeys.all` because that would refetch unrelated profile tabs:

```ts
await Promise.all([
  queryClient.invalidateQueries({ queryKey: studentQueryKeys.lists() }),
  queryClient.invalidateQueries({ queryKey: studentQueryKeys.summaries() }),
  ...(savedStudent.id ? [queryClient.invalidateQueries({ queryKey: studentQueryKeys.detail(savedStudent.id), exact: true })] : []),
  ...(selectedPhoto && savedStudent.id ? [queryClient.invalidateQueries({ queryKey: studentQueryKeys.idCard(savedStudent.id), exact: true })] : []),
]);
```

Keep the existing changed-field and FormData construction rules unchanged.

- [ ] **Step 7: Run form tests and commit**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/pages/students/StudentModals.test.tsx src/pages/PartialEditForms.test.tsx`

Expected: PASS, including the existing photo-only payload and partial-update assertions.

```bash
git add frontend/src/pages/students/StudentFormModal.tsx frontend/src/pages/students/StudentModals.test.tsx frontend/src/pages/students/StudentsPage.tsx frontend/src/pages/students/studentQueries.ts frontend/src/utils/apiError.ts
git commit --only frontend/src/pages/students/StudentFormModal.tsx frontend/src/pages/students/StudentModals.test.tsx frontend/src/pages/students/StudentsPage.tsx frontend/src/pages/students/studentQueries.ts frontend/src/utils/apiError.ts -m "feat(students): migrate student forms to UI foundation"
```

---

### Task 10: Accessibility Regression, Migration Documentation, and Full Verification

**Files:**
- Create: `frontend/src/accessibility/foundation.a11y.test.tsx`
- Create: `docs/ui-foundation-migration.md`
- Modify: `frontend/src/locales/fr/translation.json`
- Modify: `frontend/src/locales/ar/translation.json`
- Modify: `.gitignore`

**Interfaces:**
- Migration documentation defines token usage, component imports, page-state behavior, RTL rules, and the sequence for migrating later modules.
- `.superpowers/` is ignored so visual-companion artifacts never enter Git.

- [ ] **Step 1: Write the full accessibility regression test**

Render MainLayout, StudentsPage states, StudentProfilePage, and StudentFormModal under QueryClient, MemoryRouter, AuthContext mocks, and i18n mocks. Run `axe` on each stable render and assert zero violations. Add keyboard assertions for skip link, dialog close, tab activation, and labelled row actions.

- [ ] **Step 2: Run the accessibility test**

Run: `cd frontend && CI=true npm test -- --watchAll=false src/accessibility/foundation.a11y.test.tsx`

Expected before final fixes: FAIL with any remaining missing labels, roles, or contrast-independent state text.

- [ ] **Step 3: Fix only reported accessibility failures**

Add missing labels, roles, heading associations, `aria-current`, `aria-sort`, or visible state text in the exact component reported by the failing test. Do not refactor unrelated pages.

- [ ] **Step 4: Complete French and Arabic parity**

Add this recursive key-set assertion to `foundation.a11y.test.tsx`, then add translated values until it passes:

```ts
const flattenKeys = (value: unknown, prefix = ''): string[] => Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return child && typeof child === 'object' && !Array.isArray(child) ? flattenKeys(child, path) : [path];
});

it('keeps French and Arabic foundation keys in parity', () => {
  (['students', 'common', 'sidebar'] as const).forEach((namespace) => {
    expect(flattenKeys(ar[namespace]).sort()).toEqual(flattenKeys(fr[namespace]).sort());
  });
});
```

- [ ] **Step 5: Write migration documentation**

Document:

- Semantic token names and approved color meanings.
- Shared component import paths and prop contracts.
- Loading/error/empty/restricted state rules.
- Desktop-table/mobile-card rule.
- Dialog and form behavior.
- RTL and translation parity requirements.
- Query-key and invalidation conventions.
- A checklist for migrating Teachers, Users, Courses, Grades, and Finance.

- [ ] **Step 6: Ignore visual-companion artifacts**

Add this line to `.gitignore` without removing existing user entries:

```gitignore
.superpowers/
```

- [ ] **Step 7: Run the complete frontend verification suite**

Run:

```bash
cd frontend
CI=true npm test -- --watchAll=false
npm run build
```

Expected: all frontend test suites PASS with zero failures; production build exits 0.

- [ ] **Step 8: Verify the responsive experience in a real browser**

Run `cd frontend && npm start`, then use the browser against the Students list, one student profile, and the create/edit dialog at widths 375, 768, 1024, and 1440px in both French and Arabic. At 375px, execute `document.documentElement.scrollWidth === document.documentElement.clientWidth` and expect `true`. Keyboard-check skip link, drawer open/close, sortable headers, profile tabs, form dismissal confirmation, and focus restoration. Enable reduced motion and confirm nonessential transitions stop. Record any failure in the owning task test before fixing it.

- [ ] **Step 9: Run targeted source checks**

Run:

```bash
rg -n 'alert\(|📊|🎓|👨‍🏫|📍' src/pages/students src/components/layout
rg -n 'fixed inset-0' src/pages/students
```

Expected: no browser `alert()` or structural emoji remains in migrated Students/shell code; Student forms use `DialogShell` rather than custom fixed backdrops.

- [ ] **Step 10: Commit verification and documentation files**

```bash
git add frontend/src/accessibility/foundation.a11y.test.tsx frontend/src/locales/fr/translation.json frontend/src/locales/ar/translation.json docs/ui-foundation-migration.md .gitignore
git commit --only frontend/src/accessibility/foundation.a11y.test.tsx frontend/src/locales/fr/translation.json frontend/src/locales/ar/translation.json docs/ui-foundation-migration.md .gitignore -m "test(ui): verify accessible foundation migration"
```

---

## Self-Review Findings Resolved

- **Spec coverage:** Added shared field and confirmation primitives, server-backed sortable columns, independent profile-tab states, non-blocking background refresh, strict role-aligned ID-card actions, URL/filter/order preservation, and route-keyed scroll restoration.
- **Existing architecture:** The app already owns one `QueryClientProvider`; the plan reuses it and adds only `ToastProvider` plus the profile route.
- **Backend compatibility:** Sorting is limited to the existing `student_id`, `enrollment_date`, and `created_at` ordering fields. All profile services keep the current endpoint paths, and no backend or permission change is introduced.
- **Mutation scope:** Create/edit invalidation now targets list/summary prefixes and exact detail/ID-card keys instead of invalidating all Student profile tabs.
- **Design quality:** The UI review retained the approved Inter/Noto Sans Arabic pairing and brand palette, while adding explicit contrast-safe success treatment, z-index tokens, reduced motion, 44px targets, labelled controls, and real-browser RTL/responsive checks.
- **Placeholder scan:** Every planned code-changing step names its concrete contract, command, expected result, and owning file; no deferred markers remain.
- **Type consistency:** Query-key names, `StudentListParams.ordering`, profile-tab names, service response types, and mutation invalidation calls use the same signatures throughout the plan.

---

## Final Review Checklist

- [ ] Semantic tokens exist for both light and reserved dark mappings.
- [ ] Legacy pages still compile with existing brand aliases.
- [ ] Shared primitives have focused tests and axe coverage.
- [ ] Shell has skip navigation, route focus, accessible mobile navigation, and RTL parity.
- [ ] Students list state is URL-backed and preserved through profile navigation.
- [ ] Program, level, status, search, and current-year filters reach existing backend query parameters.
- [ ] Student details are reachable at `/students/:studentId`.
- [ ] Profile tabs fetch only after activation.
- [ ] Student form still submits only changed attributes.
- [ ] Photo replacement invalidates profile and ID-card data.
- [ ] No unauthorized action or data becomes visible.
- [ ] No horizontal overflow at 375px.
- [ ] All frontend tests pass and production build succeeds.
- [ ] `.superpowers/` is ignored.
- [ ] Every task commit contains only its declared paths.
