import api from './api';
import { TuitionPayment, PaginatedResponse, StudentDebt } from '../types';

export interface DashboardData {
    current_year: string;
    total_tuition_collected: number;
    total_salaries_paid: number;
    total_expenses: number;
    pending_payments_count: number;
    outstanding_balances: number;
    net_balance: number;
    expected_revenue: number;
    collection_rate: number;
    monthly_cash_flow: MonthlyCashFlow[];
    expense_categories: ExpenseCategorySummary[];
    payment_methods: PaymentMethodSummary[];
    payment_statuses: PaymentStatusSummary[];
}

export interface MonthlyCashFlow {
    month: string;
    revenue: number | string;
    salaries: number | string;
    expenses: number | string;
    net: number | string;
}

export interface ExpenseCategorySummary {
    category: string;
    label: string;
    amount: number | string;
    count: number;
    percentage: number;
}

export interface PaymentMethodSummary {
    method: string;
    label: string;
    amount: number | string;
    count: number;
    percentage: number;
}

export interface PaymentStatusSummary {
    status: string;
    label: string;
    amount: number | string;
    count: number;
}

export interface Salary {
    id: number;
    employee: number;
    employee_name: string;
    month: number;
    year: number;
    base_salary: string;
    bonuses: string;
    deductions: string;
    net_salary: string;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    payment_date?: string;
}

export interface Expense {
    id: number;
    category: 'SALARIES' | 'UTILITIES' | 'MAINTENANCE' | 'EQUIPMENT' | 'SUPPLIES' | 'OTHER';
    description: string;
    amount: string;
    date: string;
    approved_by?: number;
    created_by: number;
    status?: string; // If applicable
}

export const financeService = {
    // Dashboard
    getDashboardStats: async () => {
        const response = await api.get<DashboardData>('/finance/dashboard/');
        return response.data;
    },

    // Payments
    getPayments: async (params?: any) => {
        const response = await api.get<PaginatedResponse<TuitionPayment>>('/finance/tuition-payments/', { params });
        return response.data;
    },

    createPayment: async (data: any) => {
        const response = await api.post<TuitionPayment>('/finance/tuition-payments/', data);
        return response.data;
    },

    approvePayment: async (id: number) => {
        const response = await api.post(`/finance/tuition-payments/${id}/approve/`);
        return response.data;
    },

    deletePayment: async (id: number) => {
        await api.delete(`/finance/tuition-payments/${id}/`);
    },

    // Salaries
    getSalaries: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Salary>>('/finance/salaries/', { params });
        return response.data;
    },

    createSalary: async (data: any) => {
        const response = await api.post<Salary>('/finance/salaries/', data);
        return response.data;
    },

    paySalary: async (id: number) => {
        const response = await api.post<Salary>(`/finance/salaries/${id}/pay/`);
        return response.data;
    },

    // Expenses
    getExpenses: async (params?: any) => {
        // params: { category, start_date, end_date }
        const response = await api.get<PaginatedResponse<Expense>>('/finance/expenses/', { params });
        return response.data;
    },

    createExpense: async (data: any) => {
        const response = await api.post<Expense>('/finance/expenses/', data);
        return response.data;
    },

    getExpensesSummary: async (params?: any) => {
        const response = await api.get('/finance/expenses/summary/', { params });
        return response.data;
    },

    getStudentStatement: async (studentId: number | string) => {
        const response = await api.get(`/finance/student-balances/statement/?student_id=${studentId}`);
        return response.data;
    },

    getOutstandingBalances: async (params?: any) => {
        const response = await api.get('/finance/student-balances/outstanding/', { params });
        return response.data;
    },

    // Student debts (legacy debts from untracked years)
    getDebts: async (params?: any) => {
        const response = await api.get<PaginatedResponse<StudentDebt>>('/finance/student-debts/', { params });
        return response.data;
    },

    getDebt: async (id: number) => {
        const response = await api.get<StudentDebt>(`/finance/student-debts/${id}/`);
        return response.data;
    },

    createDebt: async (data: {
        student: number | string;
        academic_year?: number | string;
        amount_due: string;
        description?: string;
    }) => {
        const response = await api.post<StudentDebt>('/finance/student-debts/', data);
        return response.data;
    },

    updateDebt: async (id: number, data: {
        amount_due?: string;
        description?: string;
    }) => {
        const response = await api.patch<StudentDebt>(`/finance/student-debts/${id}/`, data);
        return response.data;
    },

    deleteDebt: async (id: number) => {
        await api.delete(`/finance/student-debts/${id}/`);
    },

    recordDebtPayment: async (debtId: number, data: {
        amount: string;
        payment_date: string;
        payment_method?: string;
        notes?: string;
    }) => {
        const response = await api.post(`/finance/student-debts/${debtId}/record-payment/`, data);
        return response.data;
    },

    deleteDebtPayment: async (debtId: number, paymentId: number) => {
        const response = await api.delete(`/finance/student-debts/${debtId}/payments/${paymentId}/`);
        return response.data;
    },

    // Excel Import/Export
    exportPayments: async (params?: any) => {
        const response = await api.get('/finance/tuition-payments/export_excel/', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    importPayments: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/finance/tuition-payments/import_excel/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    downloadPaymentTemplate: async () => {
        const response = await api.get('/finance/tuition-payments/download_template/', {
            responseType: 'blob'
        });
        return response.data;
    },

    // Salary Excel Import/Export
    exportSalaries: async (params?: any) => {
        const response = await api.get('/finance/salaries/export_excel/', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    importSalaries: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/finance/salaries/import_excel/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    downloadSalaryTemplate: async () => {
        const response = await api.get('/finance/salaries/download_template/', {
            responseType: 'blob'
        });
        return response.data;
    },

    // Expense Excel Import/Export
    exportExpenses: async (params?: any) => {
        const response = await api.get('/finance/expenses/export_excel/', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    importExpenses: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/finance/expenses/import_excel/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    downloadExpenseTemplate: async () => {
        const response = await api.get('/finance/expenses/download_template/', {
            responseType: 'blob'
        });
        return response.data;
    },
};

export default financeService;
