import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import universityService from '../../services/universityService';
import { Level } from '../../types';

interface LevelFormModalProps {
    level?: Level;
    onClose: () => void;
    onSuccess: () => void;
}

const LevelFormModal: React.FC<LevelFormModalProps> = ({ level, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: level?.name || 'L1',
        order: level?.order || 1
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const levelOptions = [
        { value: 'L1', label: 'Licence 1' },
        { value: 'L2', label: 'Licence 2' },
        { value: 'L3', label: 'Licence 3' },
        { value: 'M1', label: 'Master 1' },
        { value: 'M2', label: 'Master 2' },
        { value: 'D1', label: 'Doctorat 1' },
        { value: 'D2', label: 'Doctorat 2' },
        { value: 'D3', label: 'Doctorat 3' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (level) {
                await universityService.updateLevel(level.id, formData);
            } else {
                await universityService.createLevel(formData);
            }
            onSuccess();
        } catch (err: any) {
            console.error('Error saving level:', err);
            setError(err.response?.data?.detail || t('common.error.generic', 'Une erreur est survenue'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">{level ? t('structure.levels.modal.title_edit', 'Modifier le niveau') : t('structure.levels.modal.title_new', 'Nouveau niveau')}</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('structure.levels.modal.name', 'Niveau')}</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        >
                            {levelOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('structure.levels.modal.order', 'Ordre')}</label>
                        <input
                            type="number"
                            required
                            min="1"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('structure.levels.modal.order_hint', 'Utilisé pour le tri (ex: L1=1, L2=2...)')}</p>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                        >
                            {t('structure.levels.modal.cancel', 'Annuler')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? t('structure.levels.modal.saving', 'Enregistrement...') : t('structure.levels.modal.save', 'Enregistrer')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LevelsPage: React.FC = () => {
    const { t } = useTranslation();
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<Level | undefined>(undefined);

    const fetchLevels = async () => {
        setLoading(true);
        try {
            const response = await universityService.getLevels({ page_size: 100 });
            setLevels(response.results);
        } catch (error) {
            console.error('Error fetching levels:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLevels();
    }, []);

    const handleEdit = (level: Level) => {
        setSelectedLevel(level);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('common.confirm.delete', 'Êtes-vous sûr de vouloir supprimer ce niveau ?'))) {
            try {
                await universityService.deleteLevel(id);
                fetchLevels();
            } catch (error) {
                console.error('Error deleting level:', error);
                alert(t('structure.levels.error.delete_failed', 'Impossible de supprimer ce niveau. Il est probablement lié à d\'autres éléments.'));
            }
        }
    };

    return (
        <div className="min-h-screen">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t('structure.levels.title', 'Gestion des Niveaux')}</h1>
                        <p className="text-blue-100 mt-1">{t('structure.levels.subtitle', "Configurez les niveaux d'études (Licence, Master, Doctorat)")}</p>
                    </div>
                    <button
                        onClick={() => { setSelectedLevel(undefined); setShowModal(true); }}
                        className="bg-white text-blue-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-md flex items-center gap-2"
                    >
                        <svg className="w-5 h-5 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {t('structure.levels.actions.new', 'Nouveau Niveau')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                </div>
            ) : levels.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <p className="text-gray-500">{t('structure.levels.empty', 'Aucun niveau configuré.')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {levels.map((level) => (
                        <div key={level.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-center group hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{level.display_name || level.name}</h3>
                                <p className="text-sm text-gray-500">{t('structure.levels.card.order', 'Ordre')}: {level.order}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(level)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title="Modifier"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(level.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Supprimer"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <LevelFormModal
                    level={selectedLevel}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        fetchLevels();
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default LevelsPage;
