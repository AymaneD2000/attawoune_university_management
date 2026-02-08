import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import universityService from '../../services/universityService';
import { Classroom, PaginatedResponse } from '../../types';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const ClassroomsPage: React.FC = () => {
    const { t } = useTranslation();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
    const [checkDate, setCheckDate] = useState('');
    const [checkTime, setCheckTime] = useState('');
    const [availabilityResult, setAvailabilityResult] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        building: '',
        capacity: 30,
        has_projector: false,
        has_computers: false,
        is_available: true
    });

    const fetchClassrooms = useCallback(async () => {
        try {
            setLoading(true);
            const data = await universityService.getClassrooms({ search: searchQuery });
            setClassrooms(data.results);
        } catch (error) {
            console.error('Error fetching classrooms:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchClassrooms();
    }, [fetchClassrooms]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingClassroom) {
                await universityService.updateClassroom(editingClassroom.id, formData as any);
            } else {
                await universityService.createClassroom(formData as any);
            }
            setShowModal(false);
            resetForm();
            fetchClassrooms();
        } catch (error) {
            console.error('Error saving classroom:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('common.confirm.delete', 'Êtes-vous sûr de vouloir supprimer cette salle ?'))) {
            try {
                await universityService.deleteClassroom(id);
                fetchClassrooms();
            } catch (error) {
                console.error('Error deleting classroom:', error);
            }
        }
    };

    const checkAvailability = async () => {
        if (!editingClassroom || !checkDate || !checkTime) return;
        try {
            const datetime = `${checkDate}T${checkTime}:00`;
            const result = await universityService.checkClassroomAvailability(editingClassroom.id, datetime);
            setAvailabilityResult(result.message);
        } catch (error) {
            console.error('Error checking availability:', error);
            setAvailabilityResult('Erreur lors de la vérification');
        }
    };

    const openEditModal = (classroom: Classroom) => {
        setEditingClassroom(classroom);
        setFormData({
            name: classroom.name,
            code: classroom.code,
            building: classroom.building,
            capacity: classroom.capacity,
            has_projector: classroom.has_projector,
            has_computers: classroom.has_computers || false,
            is_available: classroom.is_available
        });
        setShowModal(true);
    };

    const openAvailabilityModal = (classroom: Classroom) => {
        setEditingClassroom(classroom);
        setCheckDate(new Date().toISOString().split('T')[0]);
        setCheckTime('08:00');
        setAvailabilityResult(null);
        setShowAvailabilityModal(true);
    };

    const resetForm = () => {
        setEditingClassroom(null);
        setFormData({
            name: '',
            code: '',
            building: '',
            capacity: 30,
            has_projector: false,
            has_computers: false,
            is_available: true
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('structure.classrooms.title', 'Salles de cours')}</h1>
                    <p className="text-gray-500">{t('structure.classrooms.subtitle', 'Gérer les salles et leur disponibilité')}</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('structure.classrooms.actions.new', 'Nouvelle Salle')}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 rtl:left-auto rtl:right-3" />
                        <input
                            type="text"
                            placeholder={t('structure.classrooms.search_placeholder', 'Rechercher une salle...')}
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
                                        {t('structure.classrooms.table.room', 'Salle')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.classrooms.table.capacity', 'Capacité')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.classrooms.table.equipment', 'Équipements')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-right">
                                        {t('structure.classrooms.table.status', 'Statut')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rtl:text-left">
                                        {t('structure.classrooms.table.actions', 'Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {classrooms.map((classroom) => (
                                    <tr key={classroom.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-indigo-600">{classroom.code}</div>
                                            <div className="text-sm text-gray-500">{classroom.building}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {classroom.capacity} places
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col space-y-1">
                                                {classroom.has_projector && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {t('structure.classrooms.features.projector', 'Projecteur')}
                                                    </span>
                                                )}
                                                {classroom.has_computers && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        {t('structure.classrooms.features.computers', 'Ordinateurs')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {classroom.is_available ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircleIcon className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                                                    {t('structure.classrooms.features.available', 'Disponible')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <XCircleIcon className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                                                    {t('structure.classrooms.features.occupied', 'Occupée')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openAvailabilityModal(classroom)}
                                                className="text-gray-600 hover:text-gray-900 mr-4"
                                                title="Vérifier disponiblité"
                                            >
                                                <ClockIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(classroom)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(classroom.id)}
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
                    <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingClassroom ? t('structure.classrooms.modal.title_edit', 'Modifier la salle') : t('structure.classrooms.modal.title_new', 'Nouvelle salle')}
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('structure.classrooms.modal.code', 'Code salle')}</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('structure.classrooms.modal.capacity', 'Capacité')}</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('structure.classrooms.modal.name', 'Nom')}</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('structure.classrooms.modal.building', 'Bâtiment')}</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.building}
                                            onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 rtl:space-x-reverse py-2">
                                    <label className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_projector}
                                            onChange={(e) => setFormData({ ...formData, has_projector: e.target.checked })}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">{t('structure.classrooms.modal.has_projector', 'Projecteur vidéo')}</span>
                                    </label>
                                    <label className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_computers}
                                            onChange={(e) => setFormData({ ...formData, has_computers: e.target.checked })}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">{t('structure.classrooms.modal.has_computers', "Équipé d'ordinateurs")}</span>
                                    </label>
                                </div>

                                <div className="border-t pt-4">
                                    <label className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_available}
                                            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">{t('structure.classrooms.modal.is_available', 'Salle disponible')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {t('structure.classrooms.modal.cancel', 'Annuler')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {editingClassroom ? t('structure.classrooms.modal.update', 'Mettre à jour') : t('structure.classrooms.modal.create', 'Créer')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAvailabilityModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-sm w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                Disponibilité {editingClassroom?.code}
                            </h2>
                            <button
                                onClick={() => setShowAvailabilityModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    value={checkDate}
                                    onChange={(e) => setCheckDate(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Heure</label>
                                <input
                                    type="time"
                                    value={checkTime}
                                    onChange={(e) => setCheckTime(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={checkAvailability}
                                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Vérifier
                            </button>

                            {availabilityResult && (
                                <div className={`mt-4 p-3 rounded-md text-center ${availabilityResult.includes('Disponible') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {availabilityResult}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassroomsPage;
