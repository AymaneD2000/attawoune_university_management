import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { StudentListParams } from '../../types';

const STATUSES: readonly Exclude<StudentListParams['status'], ''>[] = [
  'ACTIVE',
  'GRADUATED',
  'SUSPENDED',
  'DROPPED',
];

const ORDERINGS: readonly Exclude<StudentListParams['ordering'], ''>[] = [
  'student_id',
  '-student_id',
  'enrollment_date',
  '-enrollment_date',
  'created_at',
  '-created_at',
];

const parsePositiveInteger = (value: string | null): number | null => {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const isAllowed = <T extends string>(value: string | null, values: readonly T[]): value is T =>
  value !== null && values.some((candidate) => candidate === value);

const readParams = (searchParams: URLSearchParams): StudentListParams => {
  const page = parsePositiveInteger(searchParams.get('page'));
  const status = searchParams.get('status');
  const ordering = searchParams.get('ordering');

  return {
    page: page || 1,
    search: searchParams.get('search') || '',
    program: parsePositiveInteger(searchParams.get('program')),
    current_level: parsePositiveInteger(searchParams.get('current_level')),
    status: isAllowed(status, STATUSES) ? status : '',
    current_year_only: searchParams.get('current_year_only') !== 'false',
    ordering: isAllowed(ordering, ORDERINGS) ? ordering : '',
  };
};

const writeParam = <K extends keyof StudentListParams>(
  searchParams: URLSearchParams,
  key: K,
  value: StudentListParams[K]
) => {
  if (key === 'page' || key === 'program' || key === 'current_level') {
    const parsed = value === null ? null : parsePositiveInteger(String(value));
    if (parsed === null || (key === 'page' && parsed === 1)) {
      searchParams.delete(key);
    } else {
      searchParams.set(key, String(parsed));
    }
    return;
  }

  const isDefault =
    value === '' ||
    value === null ||
    (key === 'current_year_only' && value === true);

  if (isDefault) {
    searchParams.delete(key);
  } else {
    searchParams.set(key, String(value));
  }
};

export const useStudentListParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = React.useMemo(() => readParams(searchParams), [searchParams]);

  const setParam = React.useCallback(<K extends keyof StudentListParams>(
    key: K,
    value: StudentListParams[K]
  ) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (key !== 'page') next.delete('page');
      writeParam(next, key, value);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const clearFilters = React.useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { params, setParam, clearFilters };
};
