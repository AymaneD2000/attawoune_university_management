import { vi, type Mock, type MockInstance } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Student } from '../../types';
import studentService from '../../services/studentService';
import arTranslation from '../../locales/ar/translation.json';
import frTranslation from '../../locales/fr/translation.json';
import StudentProfilePage from './profile/StudentProfilePage';

let mockRole = 'ADMIN';
const mockNavigate = vi.fn();
const mockSetSearchParams = vi.fn();
let mockStudentId = '1';
let mockSearch = '';
let mockLocationState: { from?: string } | null = null;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ studentId: mockStudentId }),
  useLocation: () => ({ pathname: `/students/${mockStudentId}`, state: mockLocationState }),
  useSearchParams: () => {
    const ReactModule = require('react');
    const [params, setParams] = ReactModule.useState(() => new URLSearchParams(mockSearch));
    const update = (
      next: URLSearchParams,
      options?: { replace?: boolean; state?: { from?: string } | null },
    ) => {
      const resolved = new URLSearchParams(next);
      mockSetSearchParams(resolved, options);
      mockLocationState = options?.state ?? null;
      setParams(resolved);
    };
    return [params, update];
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string | Record<string, unknown>) => {
      if (typeof fallback === 'string') return fallback;
      if (typeof fallback?.defaultValue === 'string') return fallback.defaultValue;
      return _key;
    },
    i18n: { language: 'fr' },
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: mockRole } }),
}));

vi.mock('../../services/studentService', () => ({
  __esModule: true,
  default: {
    getStudent: vi.fn(),
    getEnrollments: vi.fn(),
    getGrades: vi.fn(),
    getAttendance: vi.fn(),
    getReportCards: vi.fn(),
    getFinancialStatement: vi.fn(),
    downloadIdCard: vi.fn(),
    downloadReportCard: vi.fn(),
    downloadFinancialStatement: vi.fn(),
  },
}));

vi.mock('./StudentFormModal', () => ({
  default: ({ student, onClose }: any) => (
    <div role="dialog" aria-label="Formulaire étudiant">
      Modifier {student.student_id}
      <button type="button" onClick={onClose}>Fermer</button>
    </div>
  ),
}));

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

const renderProfile = (entry = '/students/1', state: { from?: string } | null = null) => {
  const [pathname, search = ''] = entry.split('?');
  mockStudentId = pathname.split('/').pop() || '1';
  mockSearch = search ? `?${search}` : '';
  mockLocationState = state;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StudentProfilePage />
    </QueryClientProvider>,
  );
};

const recursiveKeys = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    recursiveKeys(child, prefix ? `${prefix}.${key}` : key));
};

describe('StudentProfilePage route', () => {
  const originalCreateObjectURL = window.URL.createObjectURL;
  const originalRevokeObjectURL = window.URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'ADMIN';
    mockStudentId = '1';
    mockSearch = '';
    mockLocationState = null;
    (studentService.getStudent as Mock).mockResolvedValue(student);
    (studentService.getEnrollments as Mock).mockResolvedValue({ results: [] });
    (studentService.getGrades as Mock).mockResolvedValue({
      exam_grades: { results: [] },
      course_grades: { results: [] },
    });
    (studentService.getAttendance as Mock).mockResolvedValue({
      statistics: {
        total_sessions: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendance_rate: 0,
      },
    });
    (studentService.getReportCards as Mock).mockResolvedValue({ results: [] });
    (studentService.getFinancialStatement as Mock).mockResolvedValue({
      total_due: '0',
      total_paid: '0',
      balance: '0',
      transactions: [],
    });
    (studentService.downloadIdCard as Mock).mockResolvedValue(new Blob(['card']));
    (studentService.downloadReportCard as Mock).mockResolvedValue(new Blob(['bulletin']));
    (studentService.downloadFinancialStatement as Mock).mockResolvedValue(new Blob(['statement']));
    window.URL.createObjectURL = vi.fn(() => 'blob:student-card');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterAll(() => {
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  test('shows the detail loading state before rendering the routed student profile', async () => {
    let resolveStudent!: (value: Student) => void;
    (studentService.getStudent as Mock).mockReturnValue(
      new Promise<Student>((resolve) => { resolveStudent = resolve; }),
    );

    renderProfile();

    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Chargement du dossier étudiant',
    );

    resolveStudent(student);

    expect(await screen.findByRole('heading', { name: 'Mariam Diallo' })).toBeInTheDocument();
    expect(screen.getByText('ATT-001')).toBeInTheDocument();
    expect(screen.getAllByText('Études islamiques').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Licence 1').length).toBeGreaterThan(0);
  });

  test('returns to the exact list URL stored in location.state.from', async () => {
    renderProfile('/students/1', { from: '/students?search=mariam&page=2' });

    fireEvent.click(await screen.findByRole('button', { name: 'Retour aux étudiants' }));

    expect(mockNavigate).toHaveBeenCalledWith('/students?search=mariam&page=2');
  });

  test('preserves the list return location through profile tab URL normalization and changes', async () => {
    const returnUrl = '/students?search=mariam&page=2';
    const normalized = renderProfile('/students/1?tab=unknown', { from: returnUrl });

    await screen.findByRole('tab', { name: 'Informations' });
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux étudiants' }));
    expect(mockNavigate).toHaveBeenLastCalledWith(returnUrl);

    normalized.unmount();
    renderProfile('/students/1?tab=info', { from: returnUrl });

    fireEvent.click(await screen.findByRole('tab', { name: 'Notes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux étudiants' }));
    expect(mockNavigate).toHaveBeenLastCalledWith(returnUrl);
  });

  test('activates a URL-backed tab and replaces an unknown tab with info', async () => {
    const { unmount } = renderProfile('/students/1?tab=grades');

    const gradesTab = await screen.findByRole('tab', { name: 'Notes' });
    expect(gradesTab).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(studentService.getGrades).toHaveBeenCalledWith(1, expect.anything()));

    unmount();
    renderProfile('/students/1?tab=unknown');

    expect(await screen.findByRole('tab', { name: 'Informations' }))
      .toHaveAttribute('aria-selected', 'true');
    await waitFor(() => {
      expect(mockSetSearchParams).toHaveBeenCalledWith(
        new URLSearchParams('tab=info'),
        { replace: true, state: null },
      );
    });
  });

  test('does not request attendance until the attendance tab is activated', async () => {
    renderProfile();

    const attendanceTab = await screen.findByRole('tab', { name: 'Présence' });
    expect(studentService.getAttendance).not.toHaveBeenCalled();

    fireEvent.click(attendanceTab);

    await waitFor(() => expect(studentService.getAttendance).toHaveBeenCalledTimes(1));
    expect(mockSetSearchParams).toHaveBeenCalledWith(
      new URLSearchParams('tab=attendance'),
      { state: null },
    );
  });

  test('keeps the profile header visible and retries only a failed tab query', async () => {
    (studentService.getFinancialStatement as Mock)
      .mockRejectedValueOnce(new Error('finance unavailable'))
      .mockResolvedValueOnce({
        total_due: '100000',
        total_paid: '80000',
        balance: '20000',
        transactions: [],
      });

    renderProfile('/students/1?tab=finance');

    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger les finances');
    expect(screen.getByRole('heading', { name: 'Mariam Diallo' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() => expect(studentService.getFinancialStatement).toHaveBeenCalledTimes(2));
    expect(studentService.getGrades).not.toHaveBeenCalled();
    expect(await screen.findByText('100000')).toBeInTheDocument();
  });

  test('presents a forbidden finance tab as restricted without a retry control', async () => {
    mockRole = 'STUDENT';
    (studentService.getFinancialStatement as Mock).mockRejectedValue({
      response: { status: 403 },
    });

    renderProfile('/students/1?tab=finance');

    expect(await screen.findByRole('heading', { name: 'Accès restreint' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument();
  });

  test('downloads bulletins and financial statements through the authenticated student service', async () => {
    (studentService.getReportCards as Mock).mockResolvedValue({
      results: [{
        id: 9,
        academic_year_name: '2025-2026',
        semester_name: 'Semestre 2',
        is_published: true,
      }],
    });
    const open = vi.spyOn(window, 'open');
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const bulletins = renderProfile('/students/1?tab=bulletins');
    fireEvent.click(await screen.findByRole('button', { name: 'Télécharger PDF' }));
    await waitFor(() => expect(studentService.downloadReportCard).toHaveBeenCalledWith(9));
    expect(open).not.toHaveBeenCalled();

    bulletins.unmount();
    renderProfile('/students/1?tab=finance');
    fireEvent.click(await screen.findByRole('button', { name: 'Télécharger Relevé' }));
    await waitFor(() => expect(studentService.downloadFinancialStatement).toHaveBeenCalledWith(1));
    expect(open).not.toHaveBeenCalled();

    anchorClick.mockRestore();
    open.mockRestore();
  });

  test('offers Retry after an ID-card timeout and renders the recovered card', async () => {
    (studentService.downloadIdCard as Mock)
      .mockRejectedValueOnce({ code: 'ECONNABORTED' })
      .mockResolvedValueOnce(new Blob(['card']));

    renderProfile('/students/1?tab=idcard');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La génération prend trop de temps',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByRole('img', { name: "Carte d'étudiant" })).toHaveAttribute(
      'src',
      'blob:student-card',
    );
    expect(studentService.downloadIdCard).toHaveBeenCalledTimes(2);
  });

  test.each(['ADMIN', 'DEAN', 'SECRETARY'])(
    'shows Edit and ID-card actions for %s',
    async (role) => {
      mockRole = role;
      renderProfile();

      expect(await screen.findByRole('button', { name: 'Modifier' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: "Carte d'étudiant" })).toBeInTheDocument();
    },
  );

  test('hides Edit and ID-card actions from ACCOUNTANT', async () => {
    mockRole = 'ACCOUNTANT';
    renderProfile();

    expect(await screen.findByRole('heading', { name: 'Mariam Diallo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "Carte d'étudiant" })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: "Carte d'étudiant" })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Finances' })).toBeInTheDocument();
  });

  test('normalizes an unauthorized ID-card deep link without running its query', async () => {
    mockRole = 'ACCOUNTANT';
    renderProfile('/students/1?tab=idcard');

    expect(await screen.findByRole('tab', { name: 'Informations' }))
      .toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tab', { name: "Carte d'étudiant" })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Finances' })).toBeInTheDocument();
    expect(studentService.downloadIdCard).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockSetSearchParams).toHaveBeenCalledWith(
        new URLSearchParams('tab=info'),
        { replace: true, state: null },
      );
    });
  });

  test('uses the available semantic earth token for a non-active status', async () => {
    (studentService.getStudent as Mock).mockResolvedValue({
      ...student,
      status: 'SUSPENDED',
    });
    renderProfile();

    const statuses = await screen.findAllByText('SUSPENDED');
    expect(statuses.find((element) => element.tagName === 'SPAN')).toHaveClass('text-ui-earth');
  });

  test('ships matching French and Arabic profile locale keys and real action labels', () => {
    const frProfile = (frTranslation.students as any).profile;
    const arProfile = (arTranslation.students as any).profile;

    expect(frProfile).toBeDefined();
    expect(arProfile).toBeDefined();
    expect(recursiveKeys(frProfile).sort()).toEqual(recursiveKeys(arProfile).sort());
    expect(frProfile.back).toBe('Retour aux étudiants');
    expect(arProfile.back).toBe('العودة إلى الطلاب');
    expect(frProfile.error.title).toBe('Impossible de charger le dossier étudiant');
    expect(arProfile.error.title).toBe('تعذر تحميل ملف الطالب');
    expect((frTranslation.common as any).edit).toBe('Modifier');
    expect((arTranslation.common as any).edit).toBe('تعديل');
  });

  test('preserves bulletin credits, rank, and localized generation date', async () => {
    (studentService.getReportCards as Mock).mockResolvedValue({
      results: [{
        id: 9,
        academic_year_name: '2025-2026',
        semester_name: 'Semestre 2',
        gpa: '14.5',
        total_credits: 60,
        credits_earned: 48,
        rank: 2,
        is_published: true,
        generated_at: '2026-06-15T00:00:00Z',
      }],
    });

    renderProfile('/students/1?tab=bulletins');

    expect(await screen.findByText(/Crédits/)).toHaveTextContent('Crédits: 48/60');
    expect(screen.getByText(/Rang/)).toHaveTextContent('Rang: 2');
    expect(screen.getByText(/Généré le/)).toHaveTextContent(
      `Généré le: ${new Intl.DateTimeFormat('fr').format(new Date('2026-06-15T00:00:00Z'))}`,
    );
  });

  test('gives every visible tab a matching labelled tabpanel', async () => {
    renderProfile();

    const tabs = await screen.findAllByRole('tab');
    expect(tabs).toHaveLength(7);
    tabs.forEach((tab) => {
      const panelId = tab.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      expect(panel).not.toBeNull();
      expect(panel).toHaveAttribute('role', 'tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    });
  });
});
