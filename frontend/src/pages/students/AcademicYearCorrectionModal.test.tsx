import { vi, type Mock } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import api from '../../services/api';
import universityService from '../../services/universityService';
import { AcademicYear } from '../../types';
import AcademicYearCorrectionModal from './AcademicYearCorrectionModal';

const years: AcademicYear[] = [
  { id: 4, name: '2025-2026', start_date: '2025-09-01', end_date: '2026-06-30', is_current: false },
  { id: 5, name: '2026-2027', start_date: '2026-09-01', end_date: '2027-06-30', is_current: true },
];

const mixedResponse = {
  transferred: [
    {
      student: 12,
      name: 'Mariam Diallo',
      old_student_id: 'FST2526MA000012',
      new_student_id: 'FST2627MA000001',
    },
  ],
  blocked: [
    { student: 19, student_id: 'FST2526AE000019', reason: 'Paiements trouvés pour 2025-2026.' },
  ],
};

const mockPost = api.post as Mock;
const mockGetAcademicYears = universityService.getAcademicYears as Mock;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: string | Record<string, unknown>) => {
      const fallback = typeof options === 'string'
        ? options
        : (options?.defaultValue as string) || key;
      const values = typeof options === 'object' ? options : undefined;
      return fallback.replace(/{{(\w+)}}/g, (_match, part: string) => String(values?.[part] ?? ''));
    },
    i18n: { language: 'fr' },
  }),
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: { post: vi.fn() },
}));

vi.mock('../../services/universityService', () => ({
  __esModule: true,
  default: { getAcademicYears: vi.fn() },
}));

const renderModal = (
  props: Partial<React.ComponentProps<typeof AcademicYearCorrectionModal>> = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AcademicYearCorrectionModal
        open
        studentIds={[12, 19]}
        onClose={vi.fn()}
        onCompleted={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  );
};

const fillValidForm = async () => {
  // Wait for the years query so the target year default is applied first.
  await waitFor(() =>
    expect(screen.getByLabelText(/Année cible/)).toHaveValue('5'),
  );
  fireEvent.change(screen.getByLabelText(/Année source/), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText(/Date d'inscription corrigée/), {
    target: { value: '2026-10-22' },
  });
};

beforeEach(() => {
  mockPost.mockReset();
  mockGetAcademicYears.mockReset();
  mockGetAcademicYears.mockResolvedValue({
    count: 2,
    next: null,
    previous: null,
    results: years,
  });
});

describe('AcademicYearCorrectionModal', () => {
  test('loads academic years, defaults the target year to the active one, and shows the selected count', async () => {
    renderModal();

    expect(await screen.findByText('2 étudiant(s) sélectionné(s)')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/Année cible/)).toHaveValue('5'),
    );
    await waitFor(() => {
      const options = Array.from(
        (screen.getByLabelText(/Année source/) as HTMLSelectElement).options,
      ).map((option) => option.textContent);
      expect(options).toEqual([
        'Sélectionner une année',
        '2025-2026',
        '2026-2027',
      ]);
    });
  });

  test('defaults the corrected enrollment date to a valid date value', async () => {
    renderModal();

    const input = await screen.findByLabelText(/Date d'inscription corrigée/);
    expect((input as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('posts the exact request payload and renders transferred and blocked results', async () => {
    const onCompleted = vi.fn();
    mockPost.mockResolvedValue({ data: mixedResponse });
    renderModal({ onCompleted });

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: "Corriger l'année académique" }));

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith('/students/correct-academic-year/', {
        student_ids: [12, 19],
        source_academic_year: 4,
        target_academic_year: 5,
        enrollment_date: '2026-10-22',
      }),
    );
    expect(onCompleted).toHaveBeenCalledWith(mixedResponse);

    expect(await screen.findByText('Étudiants transférés')).toBeInTheDocument();
    expect(screen.getByText(/FST2526MA000012\s*→\s*FST2627MA000001/)).toBeInTheDocument();
    expect(screen.getByText('Étudiants bloqués')).toBeInTheDocument();
    expect(screen.getByText('FST2526AE000019')).toBeInTheDocument();
    expect(screen.getByText('Paiements trouvés pour 2025-2026.')).toBeInTheDocument();
  });

  test('disables confirmation while a year is missing or when both years are identical', async () => {
    renderModal();
    const confirm = await screen.findByRole('button', { name: "Corriger l'année académique" });
    expect(confirm).toBeDisabled();

    await fillValidForm();
    expect(confirm).toBeEnabled();

    fireEvent.change(screen.getByLabelText(/Année source/), { target: { value: '5' } });
    expect(confirm).toBeDisabled();
  });

  test('keeps confirmation disabled while the request is pending', async () => {
    mockPost.mockReturnValue(new Promise(() => {}));
    renderModal();

    await fillValidForm();
    fireEvent.click(await screen.findByRole('button', { name: "Corriger l'année académique" }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: "Corriger l'année académique" })).toBeDisabled(),
    );
  });

  test('surfaces API validation errors without closing the dialog', async () => {
    mockPost.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Erreur de validation des données.',
            status_code: 400,
          },
        },
      },
    });
    renderModal();

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: "Corriger l'année académique" }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erreur de validation des données.');
    expect(screen.getByLabelText(/Année source/)).toBeInTheDocument();
  });

  test('lets the operator review the result and close the dialog', async () => {
    const onClose = vi.fn();
    mockPost.mockResolvedValue({ data: mixedResponse });
    renderModal({ onClose });

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: "Corriger l'année académique" }));
    const close = await screen.findByRole('button', { name: 'Terminer' });
    fireEvent.click(close);

    expect(onClose).toHaveBeenCalled();
  });
});
