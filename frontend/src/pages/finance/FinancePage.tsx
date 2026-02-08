import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import financeService, { DashboardData, Salary, Expense } from '../../services/financeService';
import universityService from '../../services/universityService';
import api from '../../services/api';
import { TuitionPayment } from '../../types';
import {
  BanknotesIcon,
  UserGroupIcon,
  CreditCardIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const FinancePage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'salaries' | 'expenses' | 'recovery'>('dashboard');
  const [loading, setLoading] = useState(true);

  // Data States
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [payments, setPayments] = useState<TuitionPayment[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [studentStatement, setStudentStatement] = useState<any>(null);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Forms
  const [expenseForm, setExpenseForm] = useState({
    category: 'OTHER',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [salaryForm, setSalaryForm] = useState({
    employee: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    base_salary: '',
    bonuses: '0',
    deductions: '0',
    remarks: ''
  });

  useEffect(() => {
    if (dashboardData?.current_year) {
      const year = parseInt(dashboardData.current_year.split('-')[0]);
      setSalaryForm(prev => ({
        ...prev,
        year: year
      }));
    }
  }, [dashboardData]);

  const [paymentForm, setPaymentForm] = useState({
    student: '',
    amount: '',
    payment_method: 'CASH',
    academic_year: '', // Should be fetched or auto-selected
    reference: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const data = await financeService.getDashboardStats();
        setDashboardData(data);
      } else if (activeTab === 'payments') {
        const data = await financeService.getPayments();
        setPayments(data.results);

        // Fetch students for the modal dropdown if not already fetched
        if (students.length === 0) {
          const studentRes = await api.get('/students/');
          setStudents(studentRes.data.results || []);
        }
      } else if (activeTab === 'salaries') {
        const data = await financeService.getSalaries();
        setSalaries(data.results);

        if (teachers.length === 0) {
          const teacherRes = await universityService.getTeachers();
          setTeachers(teacherRes.results || []);
        }
      } else if (activeTab === 'expenses') {
        const data = await financeService.getExpenses();
        setExpenses(data.results);
      } else if (activeTab === 'recovery') {
        const data = await financeService.getOutstandingBalances();
        setOutstandingBalances(data.results || []);

        // Also ensure students are fetched for payment modal from this tab
        if (students.length === 0) {
          const studentRes = await api.get('/students/');
          setStudents(studentRes.data.results || []);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    // Fetch current academic year? For now let backend handle default or user select
  }, [fetchData]);

  const handleCreateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.createSalary({
        ...salaryForm,
        employee: parseInt(salaryForm.employee),
        month: parseInt(salaryForm.month as any),
        year: parseInt(salaryForm.year as any),
        base_salary: parseFloat(salaryForm.base_salary),
        bonuses: parseFloat(salaryForm.bonuses),
        deductions: parseFloat(salaryForm.deductions)
      });
      setShowSalaryModal(false);
      setSalaryForm({
        employee: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        base_salary: '',
        bonuses: '0',
        deductions: '0',
        remarks: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating salary:', error);
      window.alert(t('finance.errors.salary_creation', "Erreur lors de la création du salaire."));
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.createExpense(expenseForm);
      setShowExpenseModal(false);
      setExpenseForm({ category: 'OTHER', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build payload, excluding empty string values
      const payload: any = {
        student: parseInt(paymentForm.student),
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method
      };
      // Only include optional fields if they have values
      if (paymentForm.academic_year) payload.academic_year = parseInt(paymentForm.academic_year);
      if (paymentForm.reference) payload.reference = paymentForm.reference;

      await financeService.createPayment(payload);
      setShowPaymentModal(false);
      setPaymentForm({ student: '', amount: '', payment_method: 'CASH', academic_year: '', reference: '' });
      fetchData();
    } catch (error) {
      console.error("Error creating payment", error);
      window.alert(t('finance.errors.payment_error', "Une erreur est survenue lors du paiement. Veuillez réessayer."));
    }
  };

  useEffect(() => {
    if (paymentForm.student && showPaymentModal) {
      financeService.getStudentStatement(paymentForm.student).then(data => {
        setStudentStatement(data);
        // Optional: Pre-fill amount with balance if useful
        // setPaymentForm(prev => ({ ...prev, amount: data.balance > 0 ? data.balance : '' }));
      }).catch(err => {
        console.error("Error fetching statement", err);
        setStudentStatement(null);
      });
    } else {
      setStudentStatement(null);
    }
  }, [paymentForm.student, showPaymentModal]);

  const handlePaySalary = async (id: number) => {
    try {
      await financeService.paySalary(id);
      fetchData();
    } catch (error) {
      console.error('Error paying salary:', error);
    }
  };

  const handleApprovePayment = async (id: number) => {
    try {
      if (window.confirm(t('common.confirm.validate', "Voulez-vous vraiment valider ce paiement ?"))) {
        await financeService.approvePayment(id);
        fetchData();
      }
    } catch (error) {
      console.error("Error approving payment", error);
      window.alert(t('common.errors.validation_error', "Erreur lors de la validation."));
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-400">{t('finance.dashboard.annual')}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('finance.dashboard.collected_revenue')}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData?.total_tuition_collected || 0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-400">{t('finance.dashboard.annual')}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('finance.dashboard.total_expenses')}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData?.total_expenses || 0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('finance.dashboard.expected_revenue')}</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(Number(dashboardData?.total_tuition_collected || 0) + Number(dashboardData?.outstanding_balances || 0))}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('finance.dashboard.salaries_paid')}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData?.total_salaries_paid || 0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('finance.dashboard.outstanding')}</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(dashboardData?.outstanding_balances || 0)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('finance.dashboard.financial_balance')}</h3>
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <p className="text-gray-500 mb-1">{t('finance.dashboard.net_balance')}</p>
            <p className={`text-3xl font-bold ${dashboardData?.net_balance && dashboardData.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(dashboardData?.net_balance || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700">{t('finance.payments.title')}</h3>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('finance.payments.new')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.reference')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.student')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.amount')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.method')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.payments.table.status')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.payments.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Aucun paiement enregistré
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.reference}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.student_name}</div>
                    <div className="text-sm text-gray-500">{payment.student_matricule}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.payment_method_display}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.payment_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {payment.status === 'PENDING' && (
                      <button
                        onClick={() => handleApprovePayment(payment.id)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Valider
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSalaries = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700">{t('finance.salaries.title')}</h3>
        <button
          onClick={() => setShowSalaryModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('finance.salaries.new')}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.salaries.table.employee')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.salaries.table.period')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.salaries.table.base')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.salaries.table.bonuses')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.salaries.table.deductions')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.salaries.table.net')}</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status', 'Statut')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {salaries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  Aucun salaire enregistré
                </td>
              </tr>
            ) : (
              salaries.map((salary) => (
                <tr key={salary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{salary.employee_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{salary.month}/{salary.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(salary.base_salary)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">+{formatCurrency(salary.bonuses)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">-{formatCurrency(salary.deductions)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">{formatCurrency(salary.net_salary)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{getStatusBadge(salary.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {salary.status === 'PENDING' && (
                      <button
                        onClick={() => handlePaySalary(salary.id)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Payer
                      </button>
                    )}
                  </td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700">{t('finance.expenses.title')}</h3>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('finance.expenses.new')}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.expenses.table.date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.expenses.table.category')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">{t('finance.expenses.table.description')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">{t('finance.expenses.table.amount')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  Aucune dépense enregistrée
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRecovery = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700">Suivi du Recouvrement (Étudiants)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étudiant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Dû</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payé</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reste</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {outstandingBalances.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Aucun impayé trouvé
                </td>
              </tr>
            ) : (
              outstandingBalances.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.student_name}
                    <div className="text-xs text-gray-500">{item.student_matricule}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.student_program || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(item.total_due)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">{formatCurrency(item.total_paid)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-bold">{formatCurrency(item.balance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Impayé
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setPaymentForm(prev => ({ ...prev, student: item.student || item.student_id, amount: item.balance }));
                        setShowPaymentModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Payer
                    </button>
                  </td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('finance.title')}</h1>
          <p className="text-gray-500">{t('finance.subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'dashboard', label: t('finance.tabs.dashboard') },
            { key: 'payments', label: t('finance.tabs.payments') },
            { key: 'salaries', label: t('finance.tabs.salaries') },
            { key: 'expenses', label: t('finance.tabs.expenses') },
            { key: 'recovery', label: t('finance.tabs.recovery') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'payments' && renderPayments()}
          {activeTab === 'salaries' && renderSalaries()}
          {activeTab === 'expenses' && renderExpenses()}
          {activeTab === 'recovery' && renderRecovery()}
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t('finance.modals.payment.title')}</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Étudiant</label>
                <select
                  required
                  value={paymentForm.student}
                  onChange={(e) => setPaymentForm({ ...paymentForm, student: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Sélectionner un étudiant</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.user_name} ({student.student_id})
                    </option>
                  ))}
                </select>
              </div>

              {studentStatement && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Situation Financière</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="block text-xs text-gray-500">Coût Programme</span>
                      <span className="block text-sm font-bold text-gray-900">{formatCurrency(studentStatement.total_due)}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Déjà Payé</span>
                      <span className="block text-sm font-bold text-green-600">{formatCurrency(studentStatement.total_paid)}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Reste à Payer</span>
                      <span className={`block text-sm font-bold ${studentStatement.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(studentStatement.balance)}
                      </span>
                    </div>
                  </div>
                  {studentStatement.balance > 0 && (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => setPaymentForm({ ...paymentForm, amount: studentStatement.balance })}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Payer le solde
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Montant</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Méthode de Paiement</label>
                <select
                  required
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="CASH">Espèces</option>
                  <option value="BANK_TRANSFER">Virement Bancaire</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CHECK">Chèque</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle Dépense</h2>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                <select
                  required
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="SALARIES">Salaires</option>
                  <option value="UTILITIES">Factures (Eau/Élec/Internet)</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="EQUIPMENT">Équipement</option>
                  <option value="SUPPLIES">Fournitures</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Montant</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  rows={3}
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nouveau Salaire</h2>
              <button
                onClick={() => setShowSalaryModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleCreateSalary} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employé</label>
                <select
                  required
                  value={salaryForm.employee}
                  onChange={(e) => setSalaryForm({ ...salaryForm, employee: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Sélectionner un employé</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.user}>
                      {teacher.user_name} ({teacher.employee_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mois</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={salaryForm.month}
                    onChange={(e) => setSalaryForm({ ...salaryForm, month: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Année</label>
                  <input
                    type="number"
                    min="2000"
                    required
                    value={salaryForm.year}
                    onChange={(e) => setSalaryForm({ ...salaryForm, year: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Salaire de Base</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={salaryForm.base_salary}
                  onChange={(e) => setSalaryForm({ ...salaryForm, base_salary: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primes</label>
                  <input
                    type="number"
                    min="0"
                    value={salaryForm.bonuses}
                    onChange={(e) => setSalaryForm({ ...salaryForm, bonuses: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Déductions</label>
                  <input
                    type="number"
                    min="0"
                    value={salaryForm.deductions}
                    onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarques</label>
                <textarea
                  rows={2}
                  value={salaryForm.remarks}
                  onChange={(e) => setSalaryForm({ ...salaryForm, remarks: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
