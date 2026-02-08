import api from './api';
import { TuitionPayment, PaginatedResponse } from '../types';

export interface DashboardData {
    current_year: string;
    total_tuition_collected: number;
    total_salaries_paid: number;
    total_expenses: number;
    pending_payments_count: number;
    outstanding_balances: number;
    net_balance: number;
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
    }
};

export default financeService;
