import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import universityService from '../../services/universityService';
import { Program, Department, Level } from '../../types';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';

const ProgramsPage: React.FC = () => {
    const { t } = useTranslation();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        code: string;
        department: string;
        levels: string[];
        duration_years: number;
        description: string;
        tuition_fee: string;
    }>({
        name: '',
        code: '',
        department: '',
        levels: [],
        duration_years: 3,
        description: '',
        tuition_fee: '',
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [progsData, deptsData, levelsData] = await Promise.all([
                universityService.getPrograms({
                    search: searchQuery,
                    department: selectedDepartment
                }),
                universityService.getDepartments(),
                universityService.getLevels()
            ]);
            setPrograms(progsData.results);
            setDepartments(deptsData.results);
            setLevels(levelsData.results);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedDepartment]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                department: parseInt(formData.department),
                levels: formData.levels.map(l => parseInt(l)),
                duration_years: Number(formData.duration_years),
                tuition_fee: formData.tuition_fee
            };

            if (editingProgram) {
                await universityService.updateProgram(editingProgram.id, data as any);
            } else {
                await universityService.createProgram(data as any);
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving program:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('common.confirm.delete', 'Êtes-vous sûr de vouloir supprimer ce programme ?'))) {
            try {
                await universityService.deleteProgram(id);
                fetchData(); // Changed from fetchPrograms to fetchData as per original code's function name
            } catch (error) {
                console.error('Error deleting program:', error);
            }
        }
    };

    const openEditModal = (program: Program) => {
        setEditingProgram(program);
        setFormData({
            name: program.name,
            code: program.code,
            department: program.department.toString(),
            levels: program.levels ? program.levels.map(l => l.toString()) : [],
            duration_years: program.duration_years,
            description: program.description,
            tuition_fee: program.tuition_fee,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingProgram(null);
        setFormData({
            name: '',
            code: '',
            department: '',
            levels: [],
            duration_years: 3,
            description: '',
            tuition_fee: '',
        });
    };

    const handleLevelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData({ ...formData, levels: selectedOptions });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('structure.programs.title', 'Programmes (Filières)')}</h1>
                    <p className="text-gray-500">{t('structure.programs.subtitle', 'Gérer les programmes académiques')}</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('structure.programs.actions.new', 'Nouveau Programme')}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 rtl:space-x-reverse">
                    <div className="relative flex-grow">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 rtl:left-auto rtl:right-3" />
                        <input
                            type="text"
                            placeholder={t('structure.programs.search_placeholder', 'Rechercher un programme...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md rtl:pl-3 rtl:pr-10"
                        />
                    </div>
                    <div className="sm:w-64">
                        <div className="relative">
                            <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 rtl:left-auto rtl:right-3" />
                            <select
                                value={selectedDepartment || ''}
                                onChange={(e) => setSelectedDepartment(e.target.value)} // Kept as string as per original state type
                                className="pl-10 w-full focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md rtl:pl-3 rtl:pr-10"
                            >
                                <option value="">{t('structure.programs.filters.all_departments', 'Tous les départements')}</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
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
                                        {t('structure.programs.table.code', 'Code')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.programs.table.name', 'Nom')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.programs.table.department', 'Département')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.programs.table.level', 'Niveau')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.programs.table.students', 'Étudiants')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">
                                        {t('structure.programs.table.actions', 'Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {programs.map((program) => (
                                    <tr key={program.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                            {program.code}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {program.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {program.department_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {program.levels_display}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {program.students_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openEditModal(program)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(program.id)}
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
                    <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingProgram ? t('structure.programs.modal.title_edit', 'Modifier le programme') : t('structure.programs.modal.title_new', 'Nouveau programme')}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.programs.modal.department', 'Département')}</label>
                                    <select
                                        required
                                        value={formData.department} // Kept as string as per original state type
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value="">{t('structure.programs.filters.select_department', 'Sélectionner un département')}</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {t('structure.programs.modal.levels', 'Niveaux (Maintenir Ctrl/Cmd pour sélectionner plusieurs)')}
                                    </label>
                                    <select
                                        multiple
                                        required
                                        value={formData.levels} // Kept as string[] as per original state type
                                        onChange={handleLevelSelect}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-32"
                                    >
                                        {levels.map((level) => (
                                            <option key={level.id} value={level.id}>
                                                {level.display_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.programs.modal.name', 'Nom du programme')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.programs.modal.code', 'Code')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.programs.modal.duration', 'Durée (années)')}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.duration_years} // Kept as duration_years as per original state type
                                        onChange={(e) => setFormData({ ...formData, duration_years: Number(e.target.value) })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.programs.modal.tuition', 'Frais de scolarité')}</label>
                                    <input
                                        type="text" // Kept as text as per original state type
                                        required
                                        value={formData.tuition_fee}
                                        onChange={(e) => setFormData({ ...formData, tuition_fee: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">{t('structure.programs.modal.description', 'Description')}</label>
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
                                    {t('structure.programs.modal.cancel', 'Annuler')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {editingProgram ? t('structure.programs.modal.update', 'Mettre à jour') : t('structure.programs.modal.create', 'Créer')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgramsPage;
