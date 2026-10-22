import React from 'react';
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { StudentSummary as StudentSummaryData } from '../../types';

interface StudentSummaryProps {
  summary?: StudentSummaryData;
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
}

const metrics = [
  {
    key: 'total' as const,
    labelKey: 'students.summary.total',
    fallback: 'Total',
    icon: UsersIcon,
    tone: 'text-ui-primary bg-ui-primary/10',
  },
  {
    key: 'active' as const,
    labelKey: 'students.summary.active',
    fallback: 'Actifs',
    icon: CheckCircleIcon,
    tone: 'text-ui-success-strong bg-ui-success/10',
  },
  {
    key: 'graduated' as const,
    labelKey: 'students.summary.graduated',
    fallback: 'Diplômés',
    icon: AcademicCapIcon,
    tone: 'text-ui-info bg-ui-info/10',
  },
  {
    key: 'suspended' as const,
    labelKey: 'students.summary.suspended',
    fallback: 'Suspendus',
    icon: PauseCircleIcon,
    tone: 'text-ui-warning bg-ui-warning/10',
  },
];

const StudentSummary: React.FC<StudentSummaryProps> = ({
  summary,
  loading,
  error = false,
  onRetry,
}) => {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t('students.summary.label', 'Résumé des étudiants')}
      aria-busy={loading}
      className={error
        ? 'rounded-[var(--radius-panel)] border border-ui-danger/25 bg-ui-surface p-5 shadow-panel'
        : 'grid grid-cols-2 gap-3 xl:grid-cols-4'}
    >
      {error ? (
        <div role="alert" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-ui-danger/10 text-ui-danger">
              <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-extrabold text-ui-foreground">
                {t('students.summary.error_title', 'Impossible de charger le résumé')}
              </h2>
              <p className="mt-1 text-sm text-ui-muted">
                {t(
                  'students.summary.error_description',
                  'Les indicateurs sont indisponibles. La liste reste accessible.',
                )}
              </p>
            </div>
          </div>
          {onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              {t('common.retry', 'Réessayer')}
            </Button>
          )}
        </div>
      ) : (
        <>
          {loading && (
            <span role="status" className="sr-only">
              {t('students.summary.loading', 'Chargement du résumé des étudiants')}
            </span>
          )}
          {metrics.map(({ key, labelKey, fallback, icon: Icon, tone }) => (
            <dl
              key={key}
              className="rounded-[var(--radius-panel)] border border-ui-border bg-ui-surface p-4 shadow-panel sm:p-5"
            >
              <dt className="flex items-center justify-between gap-3 text-sm font-bold text-ui-muted">
                <span>{t(labelKey, fallback)}</span>
                <span
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${tone}`}
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </dt>
              <dd className="mt-3 text-2xl font-black tabular-nums text-ui-foreground">
                {loading ? (
                  <span
                    aria-hidden="true"
                    className="block h-8 w-16 animate-pulse rounded-lg bg-ui-surface-muted"
                  />
                ) : summary?.[key] ?? '—'}
              </dd>
            </dl>
          ))}
        </>
      )}
    </section>
  );
};

export default StudentSummary;
