import React from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-ui-primary text-ui-on-primary hover:bg-ui-primary-strong shadow-panel',
  secondary: 'border border-ui-border bg-ui-surface text-ui-foreground hover:bg-ui-surface-muted',
  success: 'bg-ui-success-strong text-ui-on-primary hover:brightness-95',
  danger: 'bg-ui-danger text-ui-on-primary hover:brightness-95',
  ghost: 'text-ui-muted hover:bg-ui-surface-muted hover:text-ui-foreground',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-2.5 text-sm font-bold transition duration-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring/20 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    {...props}
  >
    {loading && (
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
    )}
    {children}
  </button>
);

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  variant = 'ghost',
  className = '',
  children,
  ...props
}) => (
  <Button
    aria-label={label}
    title={label}
    variant={variant}
    className={`h-11 w-11 px-0 ${className}`}
    {...props}
  >
    {children}
  </Button>
);
