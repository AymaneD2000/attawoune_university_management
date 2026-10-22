import React from 'react';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export const PageSkeleton: React.FC<{ rows?: number; loadingLabel?: string }> = ({
  rows = 5,
  loadingLabel,
}) => {
  const { t, i18n } = useTranslation();
  const label = loadingLabel ?? t(
    'common.loading',
    i18n.language.startsWith('ar') ? 'جارٍ التحميل' : 'Chargement',
  );

  return (
    <div role="status" className="animate-pulse space-y-3 p-5" aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-20 rounded-2xl bg-ui-surface-muted" />
      ))}
    </div>
  );
};

interface StateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<StateProps> = ({ title, description, action }) => (
  <div className="flex flex-col items-center px-6 py-16 text-center">
    <MagnifyingGlassIcon className="h-10 w-10 text-ui-primary" aria-hidden="true" />
    <h2 className="mt-5 text-lg font-extrabold text-ui-foreground">{title}</h2>
    <p className="mt-2 max-w-md text-sm text-ui-muted">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState: React.FC<StateProps & { onRetry: () => void; retryLabel?: string }> = ({
  title,
  description,
  onRetry,
  retryLabel,
}) => {
  const { t, i18n } = useTranslation();
  const label = retryLabel ?? t(
    'common.retry',
    i18n.language.startsWith('ar') ? 'إعادة المحاولة' : 'Réessayer',
  );

  return (
    <div role="alert" className="flex flex-col items-center px-6 py-16 text-center">
      <ExclamationTriangleIcon className="h-10 w-10 text-ui-danger" aria-hidden="true" />
      <h2 className="mt-5 text-lg font-extrabold text-ui-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-ui-muted">{description}</p>
      <Button variant="secondary" className="mt-5" onClick={onRetry}>
        {label}
      </Button>
    </div>
  );
};

export const RestrictedState: React.FC<StateProps> = ({ title, description }) => (
  <div className="flex flex-col items-center px-6 py-16 text-center">
    <ShieldExclamationIcon className="h-10 w-10 text-ui-warning" aria-hidden="true" />
    <h2 className="mt-5 text-lg font-extrabold text-ui-foreground">{title}</h2>
    <p className="mt-2 max-w-md text-sm text-ui-muted">{description}</p>
  </div>
);
