import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface FilterToolbarProps {
  label: string;
  children: React.ReactNode;
  chips: FilterChip[];
  onClear: () => void;
  clearLabel: string;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  label,
  children,
  chips,
  onClear,
  clearLabel,
}) => (
  <section
    aria-label={label}
    className="rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface p-4 shadow-panel"
  >
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">{children}</div>
    {chips.length > 0 && (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ui-border bg-ui-surface-muted px-3 text-sm font-semibold text-ui-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring/20"
          >
            {chip.label}
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
        <Button variant="ghost" onClick={onClear}>{clearLabel}</Button>
      </div>
    )}
  </section>
);
