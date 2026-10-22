import { vi, type Mock, type MockInstance } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ar from '../locales/ar/translation.json';
import fr from '../locales/fr/translation.json';
import MainLayout from '../components/layout/MainLayout';
import StudentsPage from '../pages/students/StudentsPage';
import StudentFormModal from '../pages/students/StudentFormModal';
import StudentProfilePage from '../pages/students/profile/StudentProfilePage';
import ExcelImportModal from '../pages/students/ExcelImportModal';
import { Student, StudentListParams } from '../types';
import universityService from '../services/universityService';

expect.extend(toHaveNoViolations);

const student: Student = {
  id: 1,
  user: 2,
  user_full_name: 'Mariam Diallo',
  first_name: 'Mariam',
  last_name: 'Diallo',
  date_of_birth: '2005-01-01',
  user_email: 'mariam@example.com',
  user_phone: '70000000',
  student_id: 'ATT-001',
  program: 3,
  program_name: 'Études islamiques',
  current_level: 1,
  level_display: 'Licence 1',
  enrollment_date: '2025-09-01',
  status: 'ACTIVE',
  guardian_name: '',
  guardian_phone: '',
  emergency_contact: '',
  photo: null,
};

const defaultParams: StudentListParams = {
  page: 1,
  search: '',
  program: null,
  current_level: null,
  status: '',
  current_year_only: true,
  ordering: '',
};

let mockParams = { ...defaultParams };
let mockListQuery: any;
let mockSummaryQuery: any;
let mockStudentQuery: any;
let mockLocation = { pathname: '/students', search: '' };
let mockSearchParams = new URLSearchParams('tab=info');
const mockSetParam = vi.fn();
const mockClearFilters = vi.fn();
const mockNavigate = vi.fn();
const mockSetSearchParams = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
const getAnimationsDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'getAnimations');
let consoleError: MockInstance;

vi.mock('react-router-dom', () => {
  const React = require('react');
  return {
    MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
    Routes: ({ children }: { children: React.ReactNode }) => children,
    Route: ({ element }: { element: React.ReactElement }) => element,
    Outlet: () => <p>Contenu de la route</p>,
    Link: ({ children, to, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
      <a href={to} {...props}>{children}</a>
    ),
    useLocation: () => mockLocation,
    useNavigate: () => mockNavigate,
    useParams: () => ({ studentId: '1' }),
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

vi.mock('react-i18next', () => {
  const translations = require('../locales/fr/translation.json');
  const lookup = (key: string) => key.split('.').reduce<unknown>(
    (value, segment) => value && typeof value === 'object'
      ? (value as Record<string, unknown>)[segment]
      : undefined,
    translations,
  );
  const interpolate = (value: string, options?: Record<string, unknown>) => value.replace(
    /{{(\w+)}}/g,
    (_match, key) => String(options?.[key] ?? ''),
  );

  return {
    useTranslation: () => ({
      t: (key: string, options?: string | Record<string, unknown>) => {
        const fallback = typeof options === 'string'
          ? options
          : typeof options?.defaultValue === 'string'
            ? options.defaultValue
            : key;
        const value = lookup(key);
        return interpolate(typeof value === 'string' ? value : fallback,
          typeof options === 'object' ? options : undefined);
      },
      i18n: { language: 'fr' },
    }),
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'admin',
      first_name: 'Admin',
      last_name: 'Test',
      full_name: 'Admin Test',
      role: 'ADMIN',
    },
    logout: vi.fn(),
  }),
}));

vi.mock('../components/ui/ToastProvider', () => ({
  useToast: () => mockToast,
}));

vi.mock('../pages/students/useStudentListParams', () => ({
  useStudentListParams: () => ({
    params: mockParams,
    setParam: mockSetParam,
    clearFilters: mockClearFilters,
  }),
}));

vi.mock('../pages/students/useStudentListScroll', () => ({
  useStudentListScroll: vi.fn(),
}));

vi.mock('../pages/students/studentQueries', () => ({
  studentQueryKeys: {
    lists: () => ['students', 'list'],
    summaries: () => ['students', 'summary'],
    detail: (id: number) => ['students', 'detail', id],
    idCard: (id: number) => ['students', id, 'id-card'],
  },
  useStudentsQuery: () => mockListQuery,
  useStudentSummaryQuery: () => mockSummaryQuery,
  useStudentQuery: () => mockStudentQuery,
  useStudentEnrollmentsQuery: () => ({ isLoading: false, isError: false, data: { results: [] }, refetch: vi.fn() }),
  useStudentGradesQuery: () => ({ isLoading: false, isError: false, data: { exam_grades: { results: [] } }, refetch: vi.fn() }),
  useStudentAttendanceQuery: () => ({ isLoading: false, isError: false, data: undefined, refetch: vi.fn() }),
  useStudentBulletinsQuery: () => ({ isLoading: false, isError: false, data: { results: [] }, refetch: vi.fn() }),
  useStudentFinanceQuery: () => ({ isLoading: false, isError: false, data: undefined, refetch: vi.fn() }),
  useStudentIdCardQuery: () => ({ isLoading: false, isError: false, data: undefined, refetch: vi.fn() }),
}));

vi.mock('../services/universityService', () => ({
  __esModule: true,
  default: {
    getPrograms: vi.fn().mockResolvedValue({ results: [] }),
    getLevels: vi.fn().mockResolvedValue({ results: [] }),
  },
}));

vi.mock('../services/studentService', () => ({
  __esModule: true,
  default: {
    createStudent: vi.fn(),
    getStudent: vi.fn(),
    updateStudent: vi.fn(),
    downloadIdCard: vi.fn().mockResolvedValue(new Blob(['card'])),
    downloadBulkIdCards: vi.fn().mockResolvedValue(new Blob(['cards'])),
    exportStudents: vi.fn().mockResolvedValue(new Blob(['students'])),
    importStudents: vi.fn(),
    downloadImportTemplate: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  __esModule: true,
  default: {
    getUser: vi.fn().mockResolvedValue({
      id: 2,
      first_name: 'Mariam',
      last_name: 'Diallo',
      email: 'mariam@example.com',
      username: 'mariam',
      phone: '70000000',
      address: '',
      date_of_birth: '2005-01-01',
      gender: 'M',
    }),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const renderWithProviders = (node: React.ReactElement, route = '/students') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
};

const flattenKeys = (value: unknown, prefix = ''): string[] => Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return child && typeof child === 'object' && !Array.isArray(child) ? flattenKeys(child, path) : [path];
});

describe('foundation accessibility regression', () => {
  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value: () => [],
    });
  });

  afterAll(() => {
    if (getAnimationsDescriptor) {
      Object.defineProperty(Element.prototype, 'getAnimations', getAnimationsDescriptor);
    } else {
      Reflect.deleteProperty(Element.prototype, 'getAnimations');
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockParams = { ...defaultParams };
    mockLocation = { pathname: '/students', search: '' };
    mockSearchParams = new URLSearchParams('tab=info');
    mockListQuery = {
      data: { count: 1, next: null, previous: null, results: [student] },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
    mockSummaryQuery = {
      data: { total: 1, active: 1, graduated: 0, suspended: 0 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
    mockStudentQuery = {
      data: student,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
    (universityService.getPrograms as Mock).mockImplementation(
      () => new Promise(() => undefined),
    );
    (universityService.getLevels as Mock).mockImplementation(
      () => new Promise(() => undefined),
    );
  });

  afterEach(() => {
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('keeps French and Arabic foundation keys in parity', () => {
    (['students', 'common', 'sidebar'] as const).forEach((namespace) => {
      expect(flattenKeys(ar[namespace]).sort()).toEqual(flattenKeys(fr[namespace]).sort());
    });
  });

  it('defines the Excel-import workflow copy in French and Arabic', () => {
    const frenchImport = (fr.students as Record<string, any>).import_dialog;
    const arabicImport = (ar.students as Record<string, any>).import_dialog;

    expect(frenchImport).toEqual(expect.objectContaining({
      title: 'Importer des Étudiants (Excel)',
      download_template: 'Télécharger le template',
      choose_file: 'Choisir un fichier',
    }));
    expect(arabicImport).toEqual(expect.objectContaining({
      title: 'استيراد الطلاب (Excel)',
      download_template: 'تحميل النموذج',
      choose_file: 'اختيار ملف',
    }));
  });

  it('keeps the shell skip navigation keyboard reachable and free of axe violations', async () => {
    const { container } = renderWithProviders(
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/students" element={<p>Contenu des étudiants</p>} />
        </Route>
      </Routes>,
    );

    const skipLink = screen.getByRole('link', { name: 'Aller au contenu principal' });
    skipLink.focus();
    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ['loaded', () => undefined],
    ['loading', () => { mockListQuery = { ...mockListQuery, data: undefined, isLoading: true, isSuccess: false }; }],
    ['empty', () => { mockListQuery = { ...mockListQuery, data: { count: 0, results: [] } }; }],
    ['request error', () => { mockListQuery = { ...mockListQuery, data: undefined, isSuccess: false, isError: true, error: new Error('offline') }; }],
    ['restricted', () => { mockListQuery = { ...mockListQuery, data: undefined, isSuccess: false, isError: true, error: { response: { status: 403 } } }; }],
  ])('has no axe violations in the StudentsPage %s state', async (_state, setup) => {
    setup();
    const { container } = renderWithProviders(<StudentsPage />);
    await waitFor(() => expect(container.firstChild).not.toBeNull());
    expect(await axe(container)).toHaveNoViolations();
  });

  it('exposes labelled keyboard-operable list actions and sort state', async () => {
    renderWithProviders(<StudentsPage />);

    const view = screen.getAllByRole('button', { name: 'Voir le dossier' })[0];
    const edit = screen.getAllByRole('button', { name: 'Modifier' })[0];
    expect(view).toHaveAccessibleName('Voir le dossier');
    expect(edit).toHaveAccessibleName('Modifier');

    const sort = screen.getByRole('button', { name: 'Matricule' });
    sort.focus();
    await userEvent.keyboard('{Enter}');
    expect(mockSetParam).toHaveBeenCalledWith('ordering', 'student_id');
    expect(screen.getByRole('columnheader', { name: 'Matricule' })).toHaveAttribute('aria-sort', 'none');
  });

  it('keeps the profile tabs keyboard-operable and free of axe violations', async () => {
    const { container } = renderWithProviders(
      <Routes>
        <Route path="/students/:studentId" element={<StudentProfilePage />} />
      </Routes>,
      '/students/1?tab=info',
    );

    const info = screen.getByRole('tab', { name: 'Informations' });
    info.focus();
    fireEvent.keyDown(info, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Inscriptions' })).toHaveFocus();
    expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(URLSearchParams), {
      state: undefined,
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('labels the student form dialog, supports Escape dismissal, and has no axe violations', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <StudentFormModal onClose={onClose} onSuccess={vi.fn()} />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Nouvel Étudiant' });
    expect(dialog)
      .toHaveAccessibleDescription('Nouvelle inscription');
    expect(await axe(dialog)).toHaveNoViolations();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('renders Excel import in the shared labelled dialog shell', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <ExcelImportModal isOpen onClose={onClose} onRefresh={vi.fn()} />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Importer des Étudiants (Excel)' });
    expect(dialog)
      .toBeInTheDocument();
    expect(await axe(dialog)).toHaveNoViolations();
    fireEvent.click(screen.getAllByRole('button', { name: 'Fermer' })[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
