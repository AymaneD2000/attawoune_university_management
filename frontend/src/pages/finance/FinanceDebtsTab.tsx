import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SearchableSelect, { Option } from '../../components/common/SearchableSelect';
import financeService from '../../services/financeService';
import universityService from '../../services/universityService';
import api from '../../services/api';
import { AcademicYear, StudentDebt } from '../../types';

interface FinanceDebtsTabProps {
  canManage: boolean;
}

const FinanceDebtsTab: React.FC<FinanceDebtsTabProps> = ({ canManage }) => {
  const { t } = useTranslation();

  const [debts, setDebts] = useState<StudentDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [debtToPay, setDebtToPay] = useState<StudentDebt | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<StudentDebt | null>(null);
  const [debtPayments, setDebtPayments] = useState<{ debt: StudentDebt; payments: any[] } | null>(null);
  const [deletingDebtId, setDeletingDebtId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Forms
  const [createForm, setCreateForm] = useState({
    student: '',
    academic_year: '',
    amount_due: '',
    description: '',
  });
  const [payForm, setPayForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'CASH',
    notes: '',
  });

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(num);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // page_size 1000 keeps the list small enough for client-side filters
      // and summary cards in a single request.
      const data = await financeService.getDebts({ page_size: 1000 });
      setDebts(data.results || []);
    } catch (err) {
      console.error('Error fetching student debts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    universityService
      .getAcademicYears({ page_size: 1000 })
      .then((res) => setAcademicYears(res.results || []))
      .catch(() => setAcademicYears([]));
  }, []);

  const handleSearchStudents = async (query: string): Promise<Option[]> => {
    try {
      // Year isolation: only students of the active academic year can be
      // offered for debts (previous-year students must be re-inscribed first).
      const response = await api.get(`/students/?search=${query}&current_year_only=true`);
      return (response.data.results || []).map((s: any) => ({
        id: s.id,
        label: s.user_name || `${s.first_name} ${s.last_name}`,
        subLabel: s.student_id
      }));
    } catch (err) {
      console.error('Error searching students', err);
      return [];
    }
  };

  const filteredDebts = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return debts.filter((debt) => {
      const matchesStatus = statusFilter === '' || debt.status === statusFilter;
      const matchesSearch =
        q === '' ||
        debt.student_name.toLowerCase().includes(q) ||
        debt.student_matricule.toLowerCase().includes(q) ||
        debt.description.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [debts, searchTerm, statusFilter]);

  const totals = useMemo(() => {
    const toNum = (v: string | number) => parseFloat(String(v)) || 0;
    let outstanding = 0;
    let open = 0;
    let partial = 0;
    let paid = 0;
    debts.forEach((d) => {
      if (d.status === 'OPEN') open += 1;
      else if (d.status === 'PARTIAL') partial += 1;
      else if (d.status === 'PAID') paid += 1;
      outstanding += toNum(d.outstanding);
    });
    return { outstanding, open, partial, paid };
  }, [debts]);

  const openPaymentModal = (debt: StudentDebt) => {
    setDebtToPay(debt);
    setPayForm({
      amount: debt.outstanding,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      notes: '',
    });
  };

  const handleCreateDebt = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await financeService.createDebt({
        student: createForm.student,
        academic_year: createForm.academic_year || undefined,
        amount_due: createForm.amount_due,
        description: createForm.description,
      });
      setShowCreateModal(false);
      setCreateForm({ student: '', academic_year: '', amount_due: '', description: '' });
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || t('finance.errors.payment_error', "Une erreur est survenue. Veuillez réessayer."));
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!debtToPay) return;
    setError('');
    setSaving(true);
    try {
      await financeService.recordDebtPayment(debtToPay.id, {
        amount: payForm.amount,
        payment_date: payForm.payment_date,
        payment_method: payForm.payment_method,
        notes: payForm.notes,
      });
      setDebtToPay(null);
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || t('finance.errors.payment_error', "Une erreur est survenue. Veuillez réessayer."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDebt = async () => {
    if (!debtToDelete) return;
    setDeletingDebtId(debtToDelete.id);
    setError('');
    try {
      await financeService.deleteDebt(debtToDelete.id);
      setDebtToDelete(null);
      setDeletingDebtId(null);
      await fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || t('finance.errors.payment_error', "Une erreur est survenue. Veuillez réessayer."));
      setDeletingDebtId(null);
    }
  };

  const handleShowPayments = async (debt: StudentDebt) => {
    try {
      const detail = await financeService.getDebt(debt.id);
      setDebtPayments({ debt, payments: detail.payments || [] });
    } catch (err) {
      console.error('Error loading debt payments:', err);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!debtPayments) return;
    try {
      await financeService.deleteDebtPayment(debtPayments.debt.id, paymentId);
      await handleShowPayments(debtPayments.debt);
    } catch (err: any) {
      console.error('Error deleting debt payment:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-red-100 text-red-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {t(`finance.debt_status.${status}`, status)}
      </span>
    );
  };

  const percentPaid = (debt: StudentDebt) => {
    const due = parseFloat(debt.amount_due) || 0;
    const paid = parseFloat(debt.amount_paid) || 0;
    if (due <= 0) return 100;
    return Math.min(100, Math.round((paid / due) * 100));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-red-700">{t('finance.debts.summary.outstanding', 'Total restant')}</p>
          <p className="mt-1 text-2xl font-black text-red-800">{formatCurrency(totals.outstanding)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('finance.debts.summary.open', 'Dettes ouvertes')}</p>
          <p className="mt-1 text-2xl font-black text-red-600">{totals.open}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('finance.debts.summary.partial', 'Partiellement réglées')}</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{totals.partial}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('finance.debts.summary.paid', 'Dettes réglées')}</p>
          <p className="mt-1 text-2xl font-black text-green-600">{totals.paid}</p>
        </div>
      </div>

      <p className="text-sm text-gray-500">{t('finance.debts.hint', 'Suivi des dettes des années précédentes non enregistrées dans le système, pour les étudiants repris après la mise en place de la plateforme.')}</p>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('finance.debts.search_placeholder', 'Rechercher un étudiant, un matricule...')}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-48"
          >
            <option value="">{t('finance.debts.filters.all_status', 'Tous les statuts')}</option>
            <option value="OPEN">{t('finance.debt_status.OPEN', 'Non réglée')}</option>
            <option value="PARTIAL">{t('finance.debt_status.PARTIAL', 'Partiellement réglée')}</option>
            <option value="PAID">{t('finance.debt_status.PAID', 'Réglée')}</option>
          </select>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => { setShowCreateModal(true); setError(''); }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4" />
            {t('finance.debts.new', 'Nouvelle Dette')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-700">{t('finance.debts.title', 'Dettes étudiantes (années précédentes)')}</h3>
        </div>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('finance.debts.table.student', 'Étudiant')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('finance.debts.table.academic_year', 'Année concernée')}</th>
                  <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('finance.debts.table.amount_due', 'Montant dû')}</th>
                  <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('finance.debts.table.amount_paid', 'Payé')}</th>
                  <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('finance.debts.table.outstanding', 'Restant')}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.status', 'Statut')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">{t('finance.debts.table.description', 'Description')}</th>
                  {canManage && (
                    <th className="px-4 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions', 'Actions')}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredDebts.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                      {t('finance.debts.empty', 'Aucune dette enregistrée')}
                    </td>
                  </tr>
                ) : (
                  filteredDebts.map((debt) => (
                    <tr key={debt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {debt.student_name}
                        <div className="text-xs text-gray-500">{debt.student_matricule}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{debt.academic_year_name || '—'}</td>
                      <td className="px-4 py-3 text-end text-sm text-gray-900">{formatCurrency(debt.amount_due)}</td>
                      <td className="px-4 py-3 text-end text-sm font-bold text-green-700">{formatCurrency(debt.amount_paid)}</td>
                      <td className="px-4 py-3 text-end text-sm">
                        <span className={debt.status === 'PAID' ? 'font-bold text-green-700' : 'font-bold text-red-600'}>
                          {formatCurrency(debt.outstanding)}
                        </span>
                        {debt.status !== 'PAID' && (
                          <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 rtl:bg-gray-100">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{ width: `${percentPaid(debt)}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(debt.status)}</td>
                      <td className="max-w-56 truncate px-4 py-3 text-sm text-gray-500" title={debt.description}>
                        {debt.description || '—'}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-end text-sm font-medium">
                          <div className="flex items-center justify-end gap-3">
                            <button type="button" onClick={() => handleShowPayments(debt)} className="text-gray-600 hover:text-gray-900">
                              {t('finance.debts.view_payments', 'Paiements')}
                            </button>
                            {debt.status !== 'PAID' && (
                              <button type="button" onClick={() => openPaymentModal(debt)} className="text-indigo-600 hover:text-indigo-900">
                                {t('finance.debts.record_payment', 'Payer')}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setDebtToDelete(debt); setError(''); }}
                              className="text-red-600 hover:text-red-800"
                              aria-label={t('finance.debts.delete', 'Supprimer')}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create debt modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreateModal(false); }}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{t('finance.debts.modals.create.title', 'Nouvelle Dette')}</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-500" aria-label={t('common.close', 'Fermer')}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateDebt} className="space-y-4">
              <SearchableSelect
                label={t('finance.modals.payment.labels.student', 'Étudiant')}
                required
                value={createForm.student}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, student: value.toString() }))}
                onSearch={handleSearchStudents}
                placeholder={t('finance.modals.payment.labels.select_student', 'Sélectionner un étudiant')}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.debts.modals.create.academic_year', 'Année concernée')}</label>
                <select
                  value={createForm.academic_year}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, academic_year: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm sm:text-sm"
                >
                  <option value="">{t('finance.debts.modals.create.no_year', 'Non précisée')}</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>{year.name}{year.is_current ? ` (${t('finance.debts.modals.create.current', 'en cours')})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.debts.modals.create.amount_due', 'Montant dû')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={createForm.amount_due}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, amount_due: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.debts.modals.create.description', 'Description')}</label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t('finance.debts.modals.create.description_placeholder', 'Ex. : Frais de scolarité 2023-2024 impayés')}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm sm:text-sm"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {t('common.cancel', 'Annuler')}
                </button>
                <button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? '...' : t('common.save', 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record payment modal */}
      {debtToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDebtToPay(null); }}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-indigo-600">{t('finance.debts.modals.pay.title', 'Paiement sur la dette')}</p>
                <h2 className="text-lg font-bold text-gray-900">{debtToPay.student_name} <span className="text-sm font-medium text-gray-500">({debtToPay.student_matricule})</span></h2>
              </div>
              <button type="button" onClick={() => setDebtToPay(null)} className="text-gray-400 hover:text-gray-500" aria-label={t('common.close', 'Fermer')}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">{t('finance.debts.modals.pay.remaining', 'Restant à payer')}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-red-600">{formatCurrency(debtToPay.outstanding)}</span>
                {parseFloat(debtToPay.outstanding) > 0 && (
                  <button
                    type="button"
                    onClick={() => setPayForm((prev) => ({ ...prev, amount: debtToPay.outstanding }))}
                    className="text-xs font-medium text-indigo-600 underline hover:text-indigo-800"
                  >
                    {t('finance.modals.payment.pay_balance', 'Payer le solde')}
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.debts.modals.pay.amount', 'Montant payé')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={payForm.amount}
                  onChange={(e) => setPayForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.debts.modals.pay.date', 'Date du paiement')}</label>
                <input
                  type="date"
                  required
                  value={payForm.payment_date}
                  onChange={(e) => setPayForm((prev) => ({ ...prev, payment_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.debts.modals.pay.method', 'Méthode de paiement')}</label>
                <select
                  required
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm sm:text-sm"
                >
                  <option value="CASH">{t('finance.payment_methods.CASH', 'Espèces')}</option>
                  <option value="BANK_TRANSFER">{t('finance.payment_methods.BANK_TRANSFER', 'Virement bancaire')}</option>
                  <option value="MOBILE_MONEY">{t('finance.payment_methods.MOBILE_MONEY', 'Mobile Money')}</option>
                  <option value="CHECK">{t('finance.payment_methods.CHECK', 'Chèque')}</option>
                  <option value="OTHER">{t('finance.debt_payment_methods.OTHER', 'Autre')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('finance.debts.modals.pay.notes', 'Notes')}</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm sm:text-sm"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                <button type="button" onClick={() => setDebtToPay(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {t('common.cancel', 'Annuler')}
                </button>
                <button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? '...' : t('finance.debts.modals.pay.submit', 'Enregistrer le paiement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {debtToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDebtToDelete(null); }}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{t('finance.debts.delete_title', 'Supprimer cette dette ?')}</h2>
              <button type="button" onClick={() => setDebtToDelete(null)} className="text-gray-400 hover:text-gray-500" aria-label={t('common.close', 'Fermer')}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              {t('finance.debts.delete_message', 'Cette opération supprimera définitivement la dette et son historique de paiements.')}{' '}
              <span className="font-bold text-gray-900">{debtToDelete.student_name} ({debtToDelete.student_matricule})</span> — {formatCurrency(debtToDelete.amount_due)}
            </p>
            <div className="flex justify-end space-x-3 rtl:space-x-reverse">
              <button type="button" onClick={() => setDebtToDelete(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handleDeleteDebt}
                disabled={deletingDebtId === debtToDelete.id}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingDebtId === debtToDelete.id ? '...' : t('finance.debts.confirm_delete', 'Supprimer la dette')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment history modal */}
      {debtPayments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDebtPayments(null); }}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-indigo-600">{t('finance.debts.modals.history.title', 'Historique des paiements')}</p>
                <h2 className="text-lg font-bold text-gray-900">{debtPayments.debt.student_name} <span className="text-sm font-medium text-gray-500">({debtPayments.debt.student_matricule})</span></h2>
              </div>
              <button type="button" onClick={() => setDebtPayments(null)} className="text-gray-400 hover:text-gray-500" aria-label={t('common.close', 'Fermer')}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {debtPayments.payments.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">{t('finance.debts.modals.history.empty', 'Aucun paiement enregistré pour cette dette.')}</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {debtPayments.payments.map((payment: any) => (
                  <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {payment.payment_method_display || payment.payment_method} — {payment.payment_date}
                      </p>
                      <p className="truncate font-mono text-xs text-gray-400" dir="ltr">{payment.reference}</p>
                      {payment.notes && <p className="mt-1 text-xs text-gray-500">{payment.notes}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(payment.id)}
                          className="text-gray-400 hover:text-red-600"
                          aria-label={t('finance.debts.modals.history.remove_payment', 'Retirer ce paiement')}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDebtsTab;
