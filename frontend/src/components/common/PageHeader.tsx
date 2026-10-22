import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions, icon }) => (
  <section className="relative overflow-hidden rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface p-5 shadow-panel sm:p-6">
    <div className="absolute inset-y-0 start-0 w-1.5 bg-gradient-to-b from-ui-primary via-ui-success to-ui-warning" />
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-ui-surface-muted text-ui-primary ring-1 ring-ui-primary/15">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="brand-kicker">{eyebrow}</p>}
          <h2 className="brand-title mt-1">{title}</h2>
          {description && <p className="brand-subtitle">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </section>
);

export default PageHeader;
