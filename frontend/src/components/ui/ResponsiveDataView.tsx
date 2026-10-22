import React from 'react';
import { useTranslation } from 'react-i18next';
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
  loadingLabel?: string;
  refreshLabel?: string;
  onRetry: () => void;
}

export const ResponsiveDataView: React.FC<ResponsiveDataViewProps> = ({
  loading,
  backgroundFetching,
  error,
  empty,
  desktop,
  mobile,
  emptyTitle,
  emptyDescription,
  emptyAction,
  errorTitle,
  errorDescription,
  loadingLabel,
  refreshLabel,
  onRetry,
}) => {
  const { t, i18n } = useTranslation();
  const localizedRefreshLabel = refreshLabel ?? t(
    'common.refreshing',
    i18n.language.startsWith('ar') ? 'جارٍ التحديث' : 'Actualisation',
  );

  if (loading) return <PageSkeleton loadingLabel={loadingLabel} />;
  if (error) return <ErrorState title={errorTitle} description={errorDescription} onRetry={onRetry} />;
  if (empty) return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;

  return (
    <div className="relative">
      {backgroundFetching && (
        <div
          role="progressbar"
          aria-label={localizedRefreshLabel}
          className="absolute inset-x-0 top-0 z-[var(--z-sticky)] h-0.5 overflow-hidden bg-ui-primary/15"
        >
          <div className="h-full w-1/3 animate-pulse bg-ui-primary" />
        </div>
      )}
      <div className="md:hidden">{mobile}</div>
      <div className="hidden md:block">{desktop}</div>
    </div>
  );
};
