import React from 'react';

export interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon,
  children,
}) => (
  <fieldset className="rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface p-4 sm:p-5">
    <legend className="px-2 text-base font-extrabold text-ui-foreground">
      <span className="inline-flex items-center gap-2">
        {icon}
        {title}
      </span>
    </legend>
    {description && <p className="mb-4 text-sm text-ui-muted">{description}</p>}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
  </fieldset>
);

export interface StickyFormActionsProps {
  children: React.ReactNode;
}

export const StickyFormActions: React.FC<StickyFormActionsProps> = ({ children }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">{children}</div>
);
