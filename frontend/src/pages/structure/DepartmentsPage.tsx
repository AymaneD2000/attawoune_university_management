import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import universityService from '../../services/universityService';
import { Department, Faculty } from '../../types';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';

const DepartmentsPage: React.FC = () => {
    const { t } = useTranslation();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFaculty, setSelectedFaculty] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        faculty: '',
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [depsData, facultiesData] = await Promise.all([
                universityService.getDepartments({
                    search: searchQuery,
                    faculty: selectedFaculty
                }),
                universityService.getFaculties()
            ]);
            setDepartments(depsData.results);
            setFaculties(facultiesData.results);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedFaculty]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                faculty: parseInt(formData.faculty)
            };

            if (editingDepartment) {
                await universityService.updateDepartment(editingDepartment.id, data);
            } else {
                await universityService.createDepartment(data);
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving department:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('common.confirm.delete', 'Êtes-vous sûr de vouloir supprimer ce département ?'))) {
            try {
                await universityService.deleteDepartment(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting department:', error);
            }
        }
    };

    const openEditModal = (department: Department) => {
        setEditingDepartment(department);
        setFormData({
            name: department.name,
            code: department.code,
            description: department.description,
            faculty: department.faculty.toString(),
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingDepartment(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            faculty: '',
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('structure.departments.title', 'Départements')}</h1>
                    <p className="text-gray-500">{t('structure.departments.subtitle', 'Gérer les départements par faculté')}</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('structure.departments.actions.new', 'Nouveau Département')}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse">
                    <div className="relative flex-grow">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 rtl:left-auto rtl:right-3" />
                        <input
                            type="text"
                            placeholder={t('structure.departments.search_placeholder', "Rechercher un département...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md rtl:pl-3 rtl:pr-10"
                        />
                    </div>
                    <div className="sm:w-64">
                        <div className="relative">
                            <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 rtl:left-auto rtl:right-3" />
                            <select
                                value={selectedFaculty || ''}
                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                className="pl-10 w-full focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md rtl:pl-3 rtl:pr-10"
                            >
                                <option value="">{t('structure.departments.filters.all_faculties', "Toutes les facultés")}</option>
                                {faculties.map((faculty) => (
                                    <option key={faculty.id} value={faculty.id}>
                                        {faculty.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">{t('common.loading', 'Chargement...')}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.departments.table.code', 'Code')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.departments.table.name', 'Nom')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.departments.table.faculty', 'Faculté')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.departments.table.stats', 'Stats')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">
                                        {t('structure.departments.table.actions', 'Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {departments.map((department) => (
                                    <tr key={department.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                            {department.code}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {department.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {department.faculty_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {department.programs_count} prog.
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {department.teachers_count} ens.
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openEditModal(department)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(department.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingDepartment ? t('structure.departments.modal.title_edit', 'Modifier le département') : t('structure.departments.modal.title_new', 'Nouveau département')}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.departments.modal.faculty', 'Faculté')}</label>
                                    <select
                                        required
                                        value={formData.faculty}
                                        onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="">{t('structure.departments.filters.select_faculty', "Sélectionner une faculté")}</option>
                                        {faculties.map((faculty) => (
                                            <option key={faculty.id} value={faculty.id}>
                                                {faculty.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.departments.modal.name', 'Nom')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.departments.modal.code', 'Code')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.departments.modal.description', 'Description')}</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {t('structure.departments.modal.cancel', 'Annuler')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {editingDepartment ? t('structure.departments.modal.update', 'Mettre à jour') : t('structure.departments.modal.create', 'Créer')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentsPage;
