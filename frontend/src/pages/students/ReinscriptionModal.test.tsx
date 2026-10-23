import { vi, type Mock } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import studentService from '../../services/studentService';
import ReinscriptionModal from './ReinscriptionModal';

const mockCandidates = studentService.getReinscriptionCandidates as Mock;

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

vi.mock('../../services/studentService', () => ({
  __esModule: true,
  default: {
    getReinscriptionCandidates: vi.fn(),
    reinscribeStudent: vi.fn(),
  },
}));

vi.mock('../../services/universityService', () => ({
  __esModule: true,
  default: { getLevels: vi.fn() },
}));

const renderModal = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ReinscriptionModal open onClose={vi.fn()} onSuccess={vi.fn()} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  mockCandidates.mockReset();
  mockCandidates.mockResolvedValue([]);
});

describe('ReinscriptionModal enrollment date filter', () => {
  test('renders an enrollment date filter input', async () => {
    renderModal();

    const input = await screen.findByLabelText(/Date d'inscription/);
    expect(input.getAttribute('type')).toBe('date');
  });

  test('requests all candidates while the date filter is empty', async () => {
    renderModal();

    await waitFor(() =>
      expect(mockCandidates).toHaveBeenCalledWith(undefined, undefined, expect.anything()),
    );
  });

  test('requests candidates with the selected enrollment date', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText(/Date d'inscription/), {
      target: { value: '2026-10-13' },
    });

    await waitFor(() =>
      expect(mockCandidates).toHaveBeenLastCalledWith(undefined, '2026-10-13', expect.anything()),
    );
  });
});
