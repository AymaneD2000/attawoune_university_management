import { vi, type Mock, type MockInstance } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Student, StudentListParams } from '../../types';
import studentService from '../../services/studentService';
import universityService from '../../services/universityService';
import frTranslation from '../../locales/fr/translation.json';
import arTranslation from '../../locales/ar/translation.json';
import StudentsPage from './StudentsPage';

const mockNavigate = vi.fn();
const mockSetParam = vi.fn();
const mockClearFilters = vi.fn();
const mockUseStudentsQuery = vi.fn();
const mockUseStudentSummaryQuery = vi.fn();
const mockUseStudentListScroll = vi.fn();
const mockToastError = vi.fn();
const mockToastApi = { success: vi.fn(), error: mockToastError, info: vi.fn() };
let mockRole = 'ADMIN';
let mockLocation = { pathname: '/students', search: '' };
let mockParams: StudentListParams;
let mockListQuery: any;
let mockSummaryQuery: any;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => {
    const translations: Record<string, string> = {
      'common.view': 'Voir le dossier',
      'common.edit': 'Modifier',
      'common.cancel': 'Annuler',
      'common.retry': 'Réessayer',
      'students.title': 'Gestion des Étudiants',
      'students.subtitle': '{{count}} étudiants au total',
      'students.actions.add': 'Ajouter',
      'students.actions.import': 'Importer',
      'students.actions.export': 'Exporter',
      'students.actions.id_card': "Carte d'étudiant",
      'students.actions.download_cards': 'Télécharger les cartes',
      'students.summary.total': 'Total',
      'students.summary.active': 'Actifs',
      'students.summary.graduated': 'Diplômés',
      'students.summary.suspended': 'Suspendus',
      'students.summary.loading': 'Chargement du résumé des étudiants',
      'students.summary.error_title': 'Impossible de charger le résumé',
      'students.summary.error_description': 'Les indicateurs sont indisponibles. La liste reste accessible.',
      'students.filters.label': 'Filtres étudiants',
      'students.filters.search': 'Recherche',
      'students.filters.program': 'Programme',
      'students.filters.level': 'Niveau',
      'students.filters.status': 'Statut',
      'students.filters.all_programs': 'Tous les programmes',
      'students.filters.all_levels': 'Tous les niveaux',
      'students.filters.all_status': 'Tous les statuts',
      'students.filters.current_year_only': 'Année en cours uniquement',
      'students.filters.clear': 'Effacer les filtres',
      'students.filters.active': 'Actif',
      'students.filters.graduated': 'Diplômé',
      'students.filters.suspended': 'Suspendu',
      'students.filters.dropped': 'Abandonné',
      'students.table.student': 'Étudiant',
      'students.table.matricule': 'Matricule',
      'students.table.academic': 'Parcours académique',
      'students.table.program': 'Programme',
      'students.table.level': 'Niveau',
      'students.table.enrollment': 'Inscription',
      'students.table.status': 'Statut',
      'students.table.actions': 'Actions',
      'students.selection.select_all': 'Sélectionner tous les étudiants',
      'students.selection.selected': '{{count}} étudiant(s) sélectionné(s)',
      'students.loading': 'Chargement des étudiants',
      'students.refreshing': 'Actualisation des étudiants',
      'students.error.title': 'Impossible de charger les étudiants',
      'students.error.description': 'Vérifiez votre connexion puis réessayez.',
      'students.restricted.title': 'Accès restreint',
      'students.restricted.description': "Votre rôle ne permet pas d'afficher cette liste.",
      'students.empty.title': 'Aucun étudiant trouvé',
      'students.empty.subtitle': 'Modifiez les filtres ou ajoutez un nouvel étudiant.',
    };

    const interpolate = (value: string, options?: Record<string, unknown>) =>
      value.replace(/{{(\w+)}}/g, (_match, key) => String(options?.[key] ?? ''));

    return {
      t: (key: string, options?: string | Record<string, unknown>) => {
        const values = typeof options === 'object' ? options : undefined;
        const fallback = typeof options === 'string'
          ? options
          : typeof options?.defaultValue === 'string'
            ? options.defaultValue
            : key;
        return interpolate(translations[key] || fallback, values);
      },
      i18n: { language: 'fr' },
    };
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: mockRole } }),
}));

vi.mock('../../components/ui/ToastProvider', () => ({
  useToast: () => mockToastApi,
}));

vi.mock('./useStudentListParams', () => ({
  useStudentListParams: () => ({
    params: mockParams,
    setParam: mockSetParam,
    clearFilters: mockClearFilters,
  }),
}));

vi.mock('./useStudentListScroll', () => ({
  useStudentListScroll: (key: string, ready: boolean) => mockUseStudentListScroll(key, ready),
}));

vi.mock('./studentQueries', () => ({
  useStudentsQuery: (params: StudentListParams) => mockUseStudentsQuery(params),
  useStudentSummaryQuery: (currentYearOnly: boolean) =>
    mockUseStudentSummaryQuery(currentYearOnly),
}));

vi.mock('../../services/studentService', () => ({
  __esModule: true,
  default: {
    downloadIdCard: vi.fn(),
    downloadBulkIdCards: vi.fn(),
    exportStudents: vi.fn(),
  },
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: vi.fn().mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
    }),
  },
}));

vi.mock('../../services/universityService', () => ({
  __esModule: true,
  default: {
    getPrograms: vi.fn(),
    getLevels: vi.fn(),
  },
}));

vi.mock('./StudentFormModal', () => ({
  default: ({ student, onClose }: any) => (
    <div role="dialog" aria-label="Formulaire étudiant">
      {student ? `Modifier ${student.student_id}` : 'Créer un étudiant'}
      <button type="button" onClick={onClose}>Fermer le formulaire</button>
    </div>
  ),
}));

vi.mock('./ExcelImportModal', () => ({
  default: ({ isOpen, onClose }: any) => isOpen ? (
    <div role="dialog" aria-label="Import étudiants">
      Import Excel
      <button type="button" onClick={onClose}>Fermer l'import</button>
    </div>
  ) : null,
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

const defaultParams: StudentListParams = {
  page: 1,
  search: '',
  program: null,
  current_level: null,
  status: '',
  current_year_only: true,
  ordering: '',
};

const renderPage = (entry = '/students') => {
  const [pathname, search = ''] = entry.split('?');
  mockLocation = { pathname, search: search ? `?${search}` : '' };
  return render(<StudentsPage />);
};

describe('StudentsPage migrated list', () => {
  const originalCreateObjectURL = window.URL.createObjectURL;
  const originalRevokeObjectURL = window.URL.revokeObjectURL;
  const originalAnchorClick = HTMLAnchorElement.prototype.click;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'ADMIN';
    mockParams = { ...defaultParams };
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
      data: { total: 17, active: 12, graduated: 3, suspended: 2 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
    mockUseStudentsQuery.mockImplementation(() => mockListQuery);
    mockUseStudentSummaryQuery.mockImplementation(() => mockSummaryQuery);
    (universityService.getPrograms as Mock).mockReturnValue(new Promise(() => undefined));
    (universityService.getLevels as Mock).mockReturnValue(new Promise(() => undefined));
    (studentService.downloadIdCard as Mock).mockResolvedValue(new Blob(['card']));
    (studentService.downloadBulkIdCards as Mock).mockResolvedValue(new Blob(['cards']));
    (studentService.exportStudents as Mock).mockResolvedValue(new Blob(['students']));
    window.URL.createObjectURL = vi.fn(() => 'blob:students');
    window.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  afterAll(() => {
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    HTMLAnchorElement.prototype.click = originalAnchorClick;
  });

  test('provides the shared Retry and summary-state labels in both list locales', () => {
    const frSummary = frTranslation.students.summary as Record<string, string>;
    const arSummary = arTranslation.students.summary as Record<string, string>;

    expect((frTranslation.common as Record<string, string>).retry).toBe('Réessayer');
    expect((arTranslation.common as Record<string, string>).retry).toBe('إعادة المحاولة');
    expect(frSummary.loading).toBe('Chargement du résumé des étudiants');
    expect(frSummary.error_title).toBe('Impossible de charger le résumé');
    expect(frSummary.error_description).toBe(
      'Les indicateurs sont indisponibles. La liste reste accessible.',
    );
    expect(arSummary.loading).toBe('جارٍ تحميل ملخص الطلاب');
    expect(arSummary.error_title).toBe('تعذر تحميل الملخص');
    expect(arSummary.error_description).toBe(
      'المؤشرات غير متاحة. تظل قائمة الطلاب متاحة.',
    );
  });

  test('renders summary metrics, both responsive renderers, labelled selection, and uses URL/query/scroll state', async () => {
    mockParams = { ...defaultParams, search: 'mariam', page: 2 };

    const { container } = renderPage('/students?search=mariam&page=2');

    expect(screen.getByText('Total').closest('dl')).toHaveTextContent('17');
    expect(screen.getByText('Actifs').closest('dl')).toHaveTextContent('12');
    expect(screen.getByText('Diplômés').closest('dl')).toHaveTextContent('3');
    expect(screen.getByText('Suspendus').closest('dl')).toHaveTextContent('2');
    expect(mockUseStudentsQuery).toHaveBeenCalledWith(mockParams);
    expect(mockUseStudentSummaryQuery).toHaveBeenCalledWith(true);
    expect(mockUseStudentListScroll).toHaveBeenCalledWith(
      '/students?search=mariam&page=2',
      true,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="student-mobile-list"]')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', {
      name: 'Sélectionner tous les étudiants',
    })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', {
      name: 'Sélectionner Mariam Diallo',
    })).toHaveLength(2);
    expect(screen.getByRole('columnheader', { name: 'Matricule' })).toHaveAttribute(
      'aria-sort',
      'none',
    );

    await waitFor(() => {
      expect(universityService.getPrograms).toHaveBeenCalledWith({ page_size: 100 });
      expect(universityService.getLevels).toHaveBeenCalledWith({ page_size: 100 });
    });
  });

  test('keeps the student list usable when the summary request fails and retries only the summary', () => {
    mockSummaryQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('summary unavailable'),
      refetch: vi.fn(),
    };

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger le résumé');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Les indicateurs sont indisponibles. La liste reste accessible.',
    );
    expect(screen.queryByText('Total')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(mockSummaryQuery.refetch).toHaveBeenCalledTimes(1);
    expect(mockListQuery.refetch).not.toHaveBeenCalled();
  });

  test('announces the summary loading state without presenting zero metrics', () => {
    mockSummaryQuery = {
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };

    renderPage();

    expect(screen.getByRole('region', { name: 'Résumé des étudiants' }))
      .toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Chargement du résumé des étudiants',
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('uses semantic UI tokens for student avatars and status pills', () => {
    renderPage();

    const avatars = screen.getAllByText('M', { selector: 'div' });
    const statuses = screen.getAllByText('Actif', { selector: 'span' });

    expect(avatars).toHaveLength(2);
    avatars.forEach((avatar) => {
      expect(avatar).toHaveClass('bg-ui-primary', 'text-ui-on-primary', 'ring-ui-primary/10');
      expect(avatar.className).not.toMatch(/(?:from|to|ring)-(?:blue|green|orange)-\d+/);
    });

    expect(statuses).toHaveLength(2);
    statuses.forEach((status) => {
      expect(status).toHaveClass(
        'border-ui-success/30',
        'bg-ui-success/10',
        'text-ui-success-strong',
      );
      expect(status.className).not.toMatch(/(?:border|bg|text)-(?:blue|green|orange|red)-\d+/);
    });
  });

  test('sends every filter and server ordering change through exact URL parameter keys', async () => {
    (universityService.getPrograms as Mock).mockResolvedValue({
      results: [{ id: 3, name: 'Études islamiques' }],
    });
    (universityService.getLevels as Mock).mockResolvedValue({
      results: [{ id: 1, name: 'L1', display_name: 'Licence 1', order: 1 }],
    });
    renderPage();

    await screen.findByRole('option', { name: 'Études islamiques' });
    fireEvent.change(screen.getByLabelText('Recherche'), { target: { value: 'diallo' } });
    fireEvent.change(screen.getByLabelText('Programme'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Niveau'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'ACTIVE' } });
    fireEvent.click(screen.getByLabelText('Année en cours uniquement'));
    fireEvent.click(screen.getByRole('button', { name: 'Matricule' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inscription' }));

    expect(mockSetParam).toHaveBeenCalledWith('search', 'diallo');
    expect(mockSetParam).toHaveBeenCalledWith('program', 3);
    expect(mockSetParam).toHaveBeenCalledWith('current_level', 1);
    expect(mockSetParam).toHaveBeenCalledWith('status', 'ACTIVE');
    expect(mockSetParam).toHaveBeenCalledWith('current_year_only', false);
    expect(mockSetParam).toHaveBeenCalledWith('ordering', 'student_id');
    expect(mockSetParam).toHaveBeenCalledWith('ordering', 'enrollment_date');
  });

  test('exposes active filter chips and clears all URL filters without local state', () => {
    mockParams = { ...defaultParams, search: 'mariam', status: 'ACTIVE' };
    renderPage('/students?search=mariam&status=ACTIVE');

    fireEvent.click(screen.getByRole('button', { name: 'Effacer les filtres' }));

    expect(mockClearFilters).toHaveBeenCalledTimes(1);
  });

  test('reflects server ordering with aria-sort and toggles the same ordering key', () => {
    mockParams = { ...defaultParams, ordering: '-student_id' };
    renderPage('/students?ordering=-student_id');

    expect(screen.getByRole('columnheader', { name: 'Matricule' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(screen.getByRole('columnheader', { name: 'Inscription' })).toHaveAttribute(
      'aria-sort',
      'none',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Matricule' }));
    expect(mockSetParam).toHaveBeenCalledWith('ordering', 'student_id');
  });

  test('keeps list content visible during a non-blocking background refresh', () => {
    mockListQuery = { ...mockListQuery, isFetching: true };
    renderPage();

    expect(screen.getByRole('progressbar', { name: 'Actualisation des étudiants' }))
      .toBeInTheDocument();
    expect(screen.getAllByText('Mariam Diallo').length).toBeGreaterThan(0);
  });

  test('offers Retry for ordinary request failures', () => {
    mockListQuery = {
      ...mockListQuery,
      data: undefined,
      isSuccess: false,
      isError: true,
      error: new Error('offline'),
    };
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(mockListQuery.refetch).toHaveBeenCalledTimes(1);
  });

  test('shows an explicit restricted state without Retry for HTTP 403', () => {
    mockListQuery = {
      ...mockListQuery,
      data: undefined,
      isSuccess: false,
      isError: true,
      error: { response: { status: 403 } },
    };
    renderPage();

    expect(screen.getByText('Accès restreint')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument();
  });

  test.each(['ADMIN', 'DEAN', 'SECRETARY'])(
    'shows every permitted list action and selection control for %s',
    (role) => {
      mockRole = role;
      renderPage();

      expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Importer' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Exporter' })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Modifier' }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: "Carte d'étudiant" }).length)
        .toBeGreaterThan(0);
      expect(screen.getByRole('checkbox', { name: 'Sélectionner tous les étudiants' }))
        .toBeInTheDocument();
    },
  );

  test('keeps the list and profile navigation visible to ACCOUNTANT but hides unauthorized actions and selection', () => {
    mockRole = 'ACCOUNTANT';
    renderPage();

    expect(screen.getAllByRole('button', { name: 'Voir le dossier' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Ajouter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Importer' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exporter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "Carte d'étudiant" })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', {
      name: 'Sélectionner tous les étudiants',
    })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', {
      name: 'Sélectionner Mariam Diallo',
    })).not.toBeInTheDocument();
  });

  test('navigates to the profile route with the complete list URL in location.state.from', () => {
    renderPage('/students?search=mariam&page=2');

    fireEvent.click(screen.getAllByRole('button', { name: 'Voir le dossier' })[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/students/1', {
      state: { from: '/students?search=mariam&page=2' },
    });
  });

  test('preserves create, edit, import, export, single-card, and bulk-card behavior', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(screen.getByRole('dialog', { name: 'Formulaire étudiant' }))
      .toHaveTextContent('Créer un étudiant');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le formulaire' }));

    fireEvent.click(screen.getAllByRole('button', { name: 'Modifier' })[0]);
    expect(screen.getByRole('dialog', { name: 'Formulaire étudiant' }))
      .toHaveTextContent('Modifier ATT-001');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le formulaire' }));

    fireEvent.click(screen.getByRole('button', { name: 'Importer' }));
    expect(screen.getByRole('dialog', { name: 'Import étudiants' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "Fermer l'import" }));

    fireEvent.click(screen.getByRole('button', { name: 'Exporter' }));
    await waitFor(() => expect(studentService.exportStudents).toHaveBeenCalledWith(mockParams));

    fireEvent.click(screen.getAllByRole('button', { name: "Carte d'étudiant" })[0]);
    await waitFor(() => expect(studentService.downloadIdCard).toHaveBeenCalledWith(1));

    fireEvent.click(screen.getAllByRole('checkbox', {
      name: 'Sélectionner Mariam Diallo',
    })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger les cartes' }));
    await waitFor(() => expect(studentService.downloadBulkIdCards).toHaveBeenCalledWith([1]));
  });

  test('reports download failures through the toast instead of alert', async () => {
    (studentService.exportStudents as Mock).mockRejectedValue(new Error('export failed'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Exporter' }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
