import { vi, type Mock, type MockInstance } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import FinancePage from './FinancePage';
import financeService from '../../services/financeService';
import universityService from '../../services/universityService';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'finance.tabs.dashboard': 'Tableau de bord',
        'finance.tabs.payments': 'Paiements',
        'finance.tabs.salaries': 'Salaires',
        'finance.tabs.expenses': 'Dépenses',
        'finance.tabs.recovery': 'Recouvrement',
        'finance.payments.title': 'Historique des paiements',
        'finance.payments.delete': 'Supprimer',
        'finance.payments.delete_title': 'Supprimer ce paiement ?',
        'finance.payments.confirm_delete': 'Supprimer le paiement',
        'finance.empty.payments': 'Aucun paiement enregistré',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'ADMIN' } }),
}));

vi.mock('../../services/financeService', () => ({
  __esModule: true,
  default: {
    getDashboardStats: vi.fn(),
    getPayments: vi.fn(),
    deletePayment: vi.fn(),
    exportPayments: vi.fn(),
    importPayments: vi.fn(),
    downloadPaymentTemplate: vi.fn(),
    getSalaries: vi.fn(),
    getExpenses: vi.fn(),
    getOutstandingBalances: vi.fn(),
    importSalaries: vi.fn(),
    downloadSalaryTemplate: vi.fn(),
    importExpenses: vi.fn(),
    downloadExpenseTemplate: vi.fn(),
  },
}));

vi.mock('../../services/universityService', () => ({
  __esModule: true,
  default: {
    getLevels: vi.fn().mockResolvedValue({ results: [] }),
    getSemesters: vi.fn().mockResolvedValue({ results: [] }),
    getTeachers: vi.fn().mockResolvedValue({ results: [] }),
  },
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

vi.mock('./FinanceAnalytics', () => ({
  default: () => <div>Finance analytics</div>,
}));
vi.mock('./PaymentExcelImportModal', () => ({ default: () => null }));
vi.mock('./FinanceExcelImportModal', () => ({ default: () => null }));
vi.mock('../../components/common/SearchableSelect', () => ({
  default: () => <div />,
}));

const payment = {
  id: 42,
  student: 7,
  student_name: 'Aminata Traoré',
  student_matricule: 'ATT-007',
  academic_year: 3,
  academic_year_name: '2026-2027',
  level: 2,
  level_name: 'Licence 2',
  semester: null,
  semester_name: '',
  amount: '125000.00',
  payment_method: 'CASH',
  payment_method_display: 'Espèces',
  status: 'COMPLETED' as const,
  status_display: 'Complété',
  reference: 'PAY-DELETE-001',
  payment_date: '2026-07-15',
};

describe('Finance payment deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (financeService.getDashboardStats as Mock).mockResolvedValue({});
    (financeService.getPayments as Mock)
      .mockResolvedValueOnce({ results: [payment], count: 1 })
      .mockResolvedValue({ results: [], count: 0 });
    (financeService.deletePayment as Mock).mockResolvedValue(undefined);
    (universityService.getLevels as Mock).mockResolvedValue({ results: [] });
    (universityService.getSemesters as Mock).mockResolvedValue({ results: [] });
    (universityService.getTeachers as Mock).mockResolvedValue({ results: [] });
  });

  it('requires confirmation and refreshes the payment ledger after deletion', async () => {
    render(<FinancePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Paiements' }));
    expect(await screen.findByText('PAY-DELETE-001')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Supprimer PAY-DELETE-001' }),
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Supprimer ce paiement ?')).toBeInTheDocument();
    expect(within(dialog).getByText('Aminata Traoré')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Supprimer le paiement' }),
    );

    await waitFor(() => {
      expect(financeService.deletePayment).toHaveBeenCalledWith(42);
    });
    expect(await screen.findByText('Aucun paiement enregistré')).toBeInTheDocument();
  });
});
