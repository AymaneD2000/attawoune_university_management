import { vi, type Mock, type MockInstance } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { CountedResponse, StudentListParams } from '../../types';
import api from '../../services/api';
import studentService from '../../services/studentService';
import {
  studentQueryKeys,
  useStudentFinanceQuery,
  useStudentSummaryQuery,
} from './studentQueries';
import { useStudentListParams } from './useStudentListParams';
import { useStudentListScroll } from './useStudentListScroll';

let mockInitialSearch = '';
let mockCurrentSearch = '';

vi.mock(
  'react-router-dom',
  () => {
    const ReactModule = require('react');
    return {
      useSearchParams: () => {
        const [searchParams, setSearchParamsState] = ReactModule.useState(
          () => new URLSearchParams(mockInitialSearch)
        );

        const setSearchParams = (
          next:
            | URLSearchParams
            | ((previous: URLSearchParams) => URLSearchParams)
        ) => {
          setSearchParamsState((previous: URLSearchParams) => {
            const resolved = typeof next === 'function' ? next(previous) : next;
            const copy = new URLSearchParams(resolved);
            mockCurrentSearch = copy.toString();
            return copy;
          });
        };

        return [searchParams, setSearchParams] as const;
      },
    };
  }
);

const defaultParams: StudentListParams = {
  page: 1,
  search: '',
  program: null,
  current_level: null,
  status: '',
  current_year_only: true,
  ordering: '',
};

describe('studentQueryKeys', () => {
  test('uses stable exact prefixes for list and profile data', () => {
    const params = { ...defaultParams, page: 2, search: 'mariam' };

    expect(studentQueryKeys.all).toEqual(['students']);
    expect(studentQueryKeys.lists()).toEqual(['students', 'list']);
    expect(studentQueryKeys.list(params)).toEqual(['students', 'list', params]);
    expect(studentQueryKeys.summaries()).toEqual(['students', 'summary']);
    expect(studentQueryKeys.summary(true)).toEqual(['students', 'summary', true]);
    expect(studentQueryKeys.detail(7)).toEqual(['students', 'detail', 7]);
    expect(studentQueryKeys.enrollments(7)).toEqual(['students', 7, 'enrollments']);
    expect(studentQueryKeys.grades(7)).toEqual(['students', 7, 'grades']);
    expect(studentQueryKeys.attendance(7)).toEqual(['students', 7, 'attendance']);
    expect(studentQueryKeys.bulletins(7)).toEqual(['students', 7, 'bulletins']);
    expect(studentQueryKeys.finance(7)).toEqual(['students', 7, 'finance']);
    expect(studentQueryKeys.idCard(7)).toEqual(['students', 7, 'id-card']);
  });
});

describe('student custom-action response contracts', () => {
  test('requires only count and results for counted response envelopes', () => {
    const counted: CountedResponse<number> = { count: 1, results: [7] };
    const enrollments: Awaited<ReturnType<typeof studentService.getEnrollments>> = {
      count: 0,
      results: [],
    };
    const grades: Awaited<ReturnType<typeof studentService.getGrades>> = {
      exam_grades: { count: 0, results: [] },
      course_grades: { count: 0, results: [] },
    };

    expect(counted.results).toEqual([7]);
    expect(enrollments.count).toBe(0);
    expect(grades.exam_grades.results).toEqual([]);
  });
});

describe('cancellable student queries', () => {
  const createWrapper = (queryClient: QueryClient) =>
    ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('passes React Query signal to all summary requests through the service', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const summarySpy = vi.spyOn(studentService, 'getStudentSummary').mockResolvedValue({
      total: 4,
      active: 2,
      graduated: 1,
      suspended: 1,
    });

    renderHook(() => useStudentSummaryQuery(true), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(summarySpy).toHaveBeenCalledTimes(1));
    expect(summarySpy).toHaveBeenCalledWith(true, expect.any(AbortSignal));
    queryClient.clear();
  });

  test('reuses one cancellation signal for all four summary list requests', async () => {
    const signal = new AbortController().signal;
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
    });

    await studentService.getStudentSummary(true, signal);

    expect(getSpy).toHaveBeenCalledTimes(4);
    expect(getSpy).toHaveBeenNthCalledWith(1, '/students/', expect.objectContaining({
      params: { current_year_only: true },
      signal,
    }));
    expect(getSpy).toHaveBeenNthCalledWith(2, '/students/', expect.objectContaining({
      params: { current_year_only: true, status: 'ACTIVE' },
      signal,
    }));
    expect(getSpy).toHaveBeenNthCalledWith(3, '/students/', expect.objectContaining({
      params: { current_year_only: true, status: 'GRADUATED' },
      signal,
    }));
    expect(getSpy).toHaveBeenNthCalledWith(4, '/students/', expect.objectContaining({
      params: { current_year_only: true, status: 'SUSPENDED' },
      signal,
    }));
  });

  test('passes React Query signal to the finance service request', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const financeSpy = vi.spyOn(studentService, 'getFinancialStatement').mockResolvedValue({
      total_due: '1000',
      total_paid: '400',
      balance: '600',
      transactions: [],
    });

    renderHook(() => useStudentFinanceQuery(9, true), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(financeSpy).toHaveBeenCalledTimes(1));
    expect(financeSpy).toHaveBeenCalledWith(9, expect.any(AbortSignal));
    queryClient.clear();
  });

  test('passes the finance cancellation signal to Axios', async () => {
    const signal = new AbortController().signal;
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
      data: { total_due: '1000', total_paid: '400', balance: '600', transactions: [] },
    });

    await studentService.getFinancialStatement(9, signal);

    expect(getSpy).toHaveBeenCalledWith(
      '/finance/student-balances/statement/',
      { params: { student_id: 9 }, signal }
    );
  });

  test('downloads protected bulletin and financial PDFs through authenticated Axios requests', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: new Blob(['pdf']) });

    await studentService.downloadReportCard(7);
    await studentService.downloadFinancialStatement(9);

    expect(getSpy).toHaveBeenNthCalledWith(1, '/academics/report-cards/7/download_pdf/', {
      responseType: 'blob',
    });
    expect(getSpy).toHaveBeenNthCalledWith(2, '/finance/student-balances/download_statement/', {
      params: { student_id: 9 },
      responseType: 'blob',
    });
  });
});

type ListParamsHook = ReturnType<typeof useStudentListParams>;

const renderListParams = (initialEntry: string) => {
  let current: ListParamsHook | undefined;
  mockInitialSearch = initialEntry.split('?')[1] || '';
  mockCurrentSearch = mockInitialSearch;

  const Harness = () => {
    current = useStudentListParams();
    return null;
  };

  const view = render(<Harness />);

  return {
    ...view,
    result: () => {
      if (!current) throw new Error('Hook did not render');
      return current;
    },
    search: () => (mockCurrentSearch ? `?${mockCurrentSearch}` : ''),
  };
};

describe('useStudentListParams', () => {
  test('strictly parses the complete supported URL state', () => {
    const view = renderListParams(
      '/students?page=2&search=mariam&program=3&current_level=1&status=ACTIVE&current_year_only=true&ordering=-enrollment_date'
    );

    expect(view.result().params).toEqual({
      page: 2,
      search: 'mariam',
      program: 3,
      current_level: 1,
      status: 'ACTIVE',
      current_year_only: true,
      ordering: '-enrollment_date',
    });
  });

  test('rejects malformed integers and values outside status and ordering allow-lists', () => {
    const view = renderListParams(
      '/students?page=02&program=3x&current_level=0&status=active&ordering=-name&current_year_only=maybe'
    );

    expect(view.result().params).toEqual(defaultParams);
  });

  test('resets page to one when a filter changes and omits default values', () => {
    const view = renderListParams('/students?page=4&search=mariam');

    act(() => view.result().setParam('program', 3));

    expect(view.result().params).toEqual({
      ...defaultParams,
      search: 'mariam',
      program: 3,
    });
    expect(view.search()).toBe('?search=mariam&program=3');

    act(() => view.result().setParam('search', ''));
    expect(view.search()).toBe('?program=3');

    act(() => view.result().setParam('program', null));
    expect(view.search()).toBe('');
  });

  test('changes page without resetting it and serializes false current-year scope', () => {
    const view = renderListParams('/students');

    act(() => view.result().setParam('page', 3));
    expect(view.search()).toBe('?page=3');

    act(() => view.result().setParam('current_year_only', false));
    expect(view.search()).toBe('?current_year_only=false');
    expect(view.result().params.page).toBe(1);
  });

  test('clears all filters and restores page one with current-year scope enabled', () => {
    const view = renderListParams(
      '/students?page=5&search=mariam&program=3&current_level=1&status=SUSPENDED&current_year_only=false&ordering=student_id'
    );

    act(() => view.result().clearFilters());

    expect(view.result().params).toEqual(defaultParams);
    expect(view.search()).toBe('');
  });

  test('removes invalid numeric mutations and applies the normal page reset', () => {
    const view = renderListParams('/students?page=4&program=3&current_level=2');

    act(() => view.result().setParam('page', 0));
    expect(view.result().params.page).toBe(1);
    expect(view.search()).toBe('?program=3&current_level=2');

    act(() => view.result().setParam('program', -1));
    expect(view.result().params.program).toBeNull();
    expect(view.search()).toBe('?current_level=2');

    act(() => view.result().setParam('current_level', Number.MAX_SAFE_INTEGER + 1));
    expect(view.result().params.current_level).toBeNull();
    expect(view.search()).toBe('');
  });
});

describe('useStudentListScroll', () => {
  const originalScrollY = window.scrollY;
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;
  const originalScrollTo = window.scrollTo;
  let frames: Map<number, FrameRequestCallback>;
  let nextFrameId: number;

  beforeEach(() => {
    frames = new Map();
    nextFrameId = 1;
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = nextFrameId++;
      frames.set(id, callback);
      return id;
    });
    window.cancelAnimationFrame = vi.fn((id: number) => frames.delete(id));
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: originalScrollY });
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    window.scrollTo = originalScrollTo;
  });

  const flushFrame = (id: number) => {
    const callback = frames.get(id);
    if (!callback) throw new Error(`Frame ${id} is not pending`);
    frames.delete(id);
    callback(0);
  };

  const latestFrameId = () => {
    const results = (window.requestAnimationFrame as Mock).mock.results;
    return results[results.length - 1].value as number;
  };

  const ScrollHarness = ({ routeKey, ready = true }: { routeKey: string; ready?: boolean }) => {
    useStudentListScroll(routeKey, ready);
    return null;
  };

  test('preserves the saved offset across a false-to-true ready transition', () => {
    const routeKey = '/students?page=2&search=mariam&case=ready-transition';
    const seed = render(<ScrollHarness routeKey={routeKey} />);
    flushFrame(latestFrameId());

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 420 });
    seed.unmount();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    const view = render(<ScrollHarness routeKey={routeKey} ready={false} />);
    view.rerender(<ScrollHarness routeKey={routeKey} ready />);
    flushFrame(latestFrameId());

    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 420 });
  });

  test('cancels stale restoration frames on key change and unmount', () => {
    const view = render(<ScrollHarness routeKey="/students?case=old-key" />);
    const oldKeyFrame = latestFrameId();

    view.rerender(<ScrollHarness routeKey="/students?case=new-key" />);
    const newKeyFrame = latestFrameId();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(oldKeyFrame);
    expect(frames.has(oldKeyFrame)).toBe(false);

    view.unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(newKeyFrame);
    expect(frames.has(newKeyFrame)).toBe(false);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  test('does not overwrite saved scroll when an unready list unmounts', () => {
    const routeKey = '/students?case=unready-unmount';
    const seed = render(<ScrollHarness routeKey={routeKey} />);
    flushFrame(latestFrameId());

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 510 });
    seed.unmount();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 35 });
    render(<ScrollHarness routeKey={routeKey} ready={false} />).unmount();

    render(<ScrollHarness routeKey={routeKey} />);
    flushFrame(latestFrameId());
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 510 });
  });

  test('does not reuse a restored marker after leaving and revisiting a key unready', () => {
    const routeKey = '/students?case=revisited-unready';
    const view = render(<ScrollHarness routeKey={routeKey} />);
    flushFrame(latestFrameId());

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 610 });
    view.rerender(<ScrollHarness routeKey="/students?case=detour" ready={false} />);
    view.rerender(<ScrollHarness routeKey={routeKey} ready={false} />);

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 45 });
    view.unmount();

    render(<ScrollHarness routeKey={routeKey} />);
    flushFrame(latestFrameId());
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 610 });
  });

  test('stores the final offset after a ready list unmounts', () => {
    const routeKey = '/students?case=final-storage';
    const view = render(<ScrollHarness routeKey={routeKey} />);
    flushFrame(latestFrameId());

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 730 });
    view.unmount();

    render(<ScrollHarness routeKey={routeKey} />);
    flushFrame(latestFrameId());
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 730 });
  });
});
