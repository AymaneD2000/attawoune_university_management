import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import universityService from '../../services/universityService';
import { AcademicYear, Semester } from '../../types';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const AcademicYearsPage: React.FC = () => {
    const { t } = useTranslation();
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSemesterModal, setShowSemesterModal] = useState(false);
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
    const [yearSemesters, setYearSemesters] = useState<Semester[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        is_current: false,
    });
    const [semesterFormData, setSemesterFormData] = useState({
        semester_type: 'S1',
        start_date: '',
        end_date: '',
        is_current: false,
    });

    const fetchYears = useCallback(async () => {
        try {
            setLoading(true);
            const data = await universityService.getAcademicYears();
            setAcademicYears(data.results);
        } catch (error) {
            console.error('Error fetching academic years:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchYears();
    }, [fetchYears]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingYear) {
                await universityService.updateAcademicYear(editingYear.id, formData);
            } else {
                await universityService.createAcademicYear(formData);
            }
            setShowModal(false);
            resetForm();
            fetchYears();
        } catch (error) {
            console.error('Error saving academic year:', error);
        }
    };

    const handleSemesterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingYear) return;

        try {
            const data = {
                ...semesterFormData,
                academic_year: editingYear.id
            } as any;
            await universityService.createSemester(data);
            setShowSemesterModal(false);
            resetSemesterForm();
            // Refund years to update semester counts if needed, or fetch semesters
            fetchSemesters(editingYear.id);
        } catch (error) {
            console.error('Error saving semester:', error);
        }
    };

    const fetchSemesters = async (yearId: number) => {
        try {
            const data = await universityService.getSemesters({ academic_year: yearId });
            setYearSemesters(data.results);
        } catch (error) {
            console.error('Error fetching semesters:', error);
        }
    };

    const handleSetCurrent = async (id: number) => {
        try {
            await universityService.setCurrentAcademicYear(id);
            fetchYears();
        } catch (error) {
            console.error('Error setting current year:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('common.confirm.delete', 'Êtes-vous sûr de vouloir supprimer cette année académique ?'))) {
            try {
                await universityService.deleteAcademicYear(id);
                fetchYears();
            } catch (error) {
                console.error('Error deleting academic year:', error);
            }
        }
    };

    const openEditModal = (year: AcademicYear) => {
        setEditingYear(year);
        setFormData({
            name: year.name,
            start_date: year.start_date,
            end_date: year.end_date,
            is_current: year.is_current,
        });
        fetchSemesters(year.id);
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingYear(null);
        setFormData({
            name: '',
            start_date: '',
            end_date: '',
            is_current: false,
        });
        setYearSemesters([]);
    };

    const resetSemesterForm = () => {
        setSemesterFormData({
            semester_type: 'S1',
            start_date: '',
            end_date: '',
            is_current: false,
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('structure.academic_years.title', 'Années Académiques')}</h1>
                    <p className="text-gray-500">{t('structure.academic_years.subtitle', 'Gérer le calendrier académique')}</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('structure.academic_years.actions.new', 'Nouvelle Année')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {academicYears.map((year) => (
                    <div key={year.id} className={`bg-white rounded-xl shadow-sm border ${year.is_current ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'} overflow-hidden`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{year.name}</h3>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {year.start_date} - {year.end_date}
                                    </div>
                                </div>
                                {year.is_current && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircleIcon className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                                        {t('structure.academic_years.status.current', 'En cours')}
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => openEditModal(year)}
                                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                >
                                    {t('structure.academic_years.actions.manage', 'Gérer / Modifier')}
                                </button>
                                <div className="flex space-x-2 rtl:space-x-reverse">
                                    {!year.is_current && (
                                        <button
                                            onClick={() => handleSetCurrent(year.id)}
                                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                                        >
                                            {t('structure.academic_years.actions.set_current', 'Définir courant')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(year.id)}
                                        className="text-gray-400 hover:text-red-600"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingYear ? t('structure.academic_years.modal.title_manage', "Gérer l'année académique") : t('structure.academic_years.modal.title_new', 'Nouvelle année académique')}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Year Form */}
                            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">{t('structure.academic_years.modal.details_title', "Détails de l'année")}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">{t('structure.academic_years.modal.name', 'Nom')}</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ex: 2025-2026"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('structure.academic_years.modal.start_date', 'Date début')}</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('structure.academic_years.modal.end_date', 'Date fin')}</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                                    >
                                        {editingYear ? t('structure.academic_years.modal.save_changes', 'Enregistrer les modifications') : t('structure.academic_years.modal.create', "Créer l'année")}
                                    </button>
                                </div>
                            </form>

                            {/* Semesters List (only when editing) */}
                            {editingYear && (
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-medium text-gray-900">{t('structure.academic_years.modal.semesters_title', 'Semestres')}</h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowSemesterModal(true)}
                                            className="text-xs text-indigo-600 hover:text-indigo-900 font-medium flex items-center"
                                        >
                                            <PlusIcon className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                                            {t('structure.academic_years.modal.add_semester', 'Ajouter un semestre')}
                                        </button>
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 rtl:text-right">{t('structure.academic_years.table.type', 'Type')}</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 rtl:text-right">{t('structure.academic_years.table.dates', 'Dates')}</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 rtl:text-right">{t('structure.academic_years.table.status', 'Statut')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {yearSemesters.map((semester) => (
                                                    <tr key={semester.id}>
                                                        <td className="px-4 py-2 text-sm text-gray-900">{semester.semester_type}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-500">{semester.start_date} - {semester.end_date}</td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {semester.is_current ? (
                                                                <span className="text-green-600 font-medium text-xs">{t('structure.academic_years.status.current', 'En cours')}</span>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {yearSemesters.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                                                            {t('structure.academic_years.modal.no_semesters', 'Aucun semestre configuré')}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Semester Modal */}
            {showSemesterModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('structure.academic_years.modal.add_semester_title', 'Ajouter un semestre')}</h3>
                        <form onSubmit={handleSemesterSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.academic_years.modal.semester_type', 'Type')}</label>
                                    <select
                                        value={semesterFormData.semester_type}
                                        onChange={(e) => setSemesterFormData({ ...semesterFormData, semester_type: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="S1">{t('structure.academic_years.semesters.S1', 'Semestre 1')}</option>
                                        <option value="S2">{t('structure.academic_years.semesters.S2', 'Semestre 2')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.academic_years.modal.start_date', 'Date début')}</label>
                                    <input
                                        type="date"
                                        required
                                        value={semesterFormData.start_date}
                                        onChange={(e) => setSemesterFormData({ ...semesterFormData, start_date: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.academic_years.modal.end_date', 'Date fin')}</label>
                                    <input
                                        type="date"
                                        required
                                        value={semesterFormData.end_date}
                                        onChange={(e) => setSemesterFormData({ ...semesterFormData, end_date: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                                <button
                                    type="button"
                                    onClick={() => setShowSemesterModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {t('structure.academic_years.modal.cancel', 'Annuler')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {t('structure.academic_years.modal.add_semester_action', 'Ajouter')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicYearsPage;
