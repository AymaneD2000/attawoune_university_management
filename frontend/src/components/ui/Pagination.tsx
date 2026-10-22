import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export interface PaginationProps {
  page: number;
  pageSize: number;
  currentCount: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  currentCount,
  total,
  onPrevious,
  onNext,
  nextDisabled,
}) => {
  const { t, i18n } = useTranslation();
  const fallback = i18n.language.startsWith('ar');
  const navigationLabel = t('common.pagination', fallback ? 'التنقل بين الصفحات' : 'Pagination');
  const previousLabel = t('common.prev', fallback ? 'السابق' : 'Précédent');
  const nextLabel = t('common.next', fallback ? 'التالي' : 'Suivant');
  const ofLabel = t('common.of', fallback ? 'من' : 'sur');
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(start + currentCount - 1, total);
  const isNextDisabled = nextDisabled ?? end >= total;

  return (
    <nav
      aria-label={navigationLabel}
      className="flex flex-col gap-3 border-t border-ui-border bg-ui-surface-muted px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-ui-muted">
        <span className="font-bold tabular-nums text-ui-foreground">{start}–{end}</span>{' '}
        {ofLabel} <span className="font-bold tabular-nums text-ui-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          aria-label={previousLabel}
          onClick={onPrevious}
          disabled={page <= 1}
        >
          <ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          <span className="hidden sm:inline">{previousLabel}</span>
        </Button>
        <span
          aria-current="page"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] bg-ui-primary px-3 font-bold tabular-nums text-ui-on-primary"
        >
          {page}
        </span>
        <Button
          variant="secondary"
          aria-label={nextLabel}
          onClick={onNext}
          disabled={isNextDisabled}
        >
          <span className="hidden sm:inline">{nextLabel}</span>
          <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
};
