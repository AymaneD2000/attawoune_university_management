import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import universityService from '../../services/universityService';
import { Faculty } from '../../types';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const FacultiesPage: React.FC = () => {
    const { t } = useTranslation();
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
    });

    const fetchFaculties = useCallback(async () => {
        try {
            setLoading(true);
            const data = await universityService.getFaculties({ search: searchQuery });
            setFaculties(data.results);
        } catch (error) {
            console.error('Error fetching faculties:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchFaculties();
    }, [fetchFaculties]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFaculty) {
                await universityService.updateFaculty(editingFaculty.id, formData);
            } else {
                await universityService.createFaculty(formData);
            }
            setShowModal(false);
            resetForm();
            fetchFaculties();
        } catch (error) {
            console.error('Error saving faculty:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('common.confirm.delete', 'Êtes-vous sûr de vouloir supprimer cette faculté ?'))) {
            try {
                await universityService.deleteFaculty(id);
                fetchFaculties();
            } catch (error) {
                console.error('Error deleting faculty:', error);
            }
        }
    };

    const openEditModal = (faculty: Faculty) => {
        setEditingFaculty(faculty);
        setFormData({
            name: faculty.name,
            code: faculty.code,
            description: faculty.description,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingFaculty(null);
        setFormData({
            name: '',
            code: '',
            description: '',
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('structure.faculties.title', 'Facultés')}</h1>
                    <p className="text-gray-500">{t('structure.faculties.subtitle', "Gérer les facultés de l'université")}</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('structure.faculties.actions.new', 'Nouvelle Faculté')}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 rtl:left-auto rtl:right-3" />
                        <input
                            type="text"
                            placeholder={t('structure.faculties.search_placeholder', "Rechercher une faculté...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md rtl:pl-3 rtl:pr-10"
                        />
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
                                        {t('structure.faculties.table.code', 'Code')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.faculties.table.name', 'Nom')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.faculties.table.description', 'Description')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.faculties.table.departments', 'Départements')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">
                                        {t('structure.faculties.table.actions', 'Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {faculties.map((faculty) => (
                                    <tr key={faculty.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                            {faculty.code}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {faculty.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {faculty.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {faculty.departments_count} dép.
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openEditModal(faculty)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(faculty.id)}
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
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingFaculty ? t('structure.faculties.modal.title_edit', 'Modifier la faculté') : t('structure.faculties.modal.title_new', 'Nouvelle faculté')}
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
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.faculties.modal.name', 'Nom')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.faculties.modal.code', 'Code')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.faculties.modal.description', 'Description')}</label>
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
                                    {t('structure.faculties.modal.cancel', 'Annuler')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {editingFaculty ? t('structure.faculties.modal.update', 'Mettre à jour') : t('structure.faculties.modal.create', 'Créer')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultiesPage;
