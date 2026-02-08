import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gradesService } from '../../services/gradesService';

interface ImportGradesModalProps {
    isOpen: boolean;
    onClose: () => void;
    examId: number;
    onSuccess: () => void;
}

const ImportGradesModal: React.FC<ImportGradesModalProps> = ({ isOpen, onClose, examId, onSuccess }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResults(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await gradesService.exportTemplate(examId);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'modèle_importation_notes.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (err) {
            console.error('Error downloading template:', err);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        try {
            const res = await gradesService.importGrades(examId, file);
            setResults(res);
            if (res.created > 0 || res.updated > 0) {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Erreur lors de l'importation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{t('grades.import.title', 'Importer des notes')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold">✕</button>
                </div>

                {!results ? (
                    <div className="space-y-6">
                        <div className="bg-indigo-50 p-4 rounded-lg">
                            <p className="text-sm text-indigo-800 mb-3">
                                {t('grades.import.instructions', 'Téléchargez le modèle Excel, remplissez les notes et importez-le ici.')}
                            </p>
                            <button
                                onClick={handleDownloadTemplate}
                                className="text-indigo-600 font-medium text-sm hover:underline flex items-center gap-2"
                            >
                                📥 {t('grades.import.download_template', 'Télécharger le modèle')}
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('grades.import.select_file', 'Sélectionner le fichier Excel')}
                            </label>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        </div>

                        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                            >
                                {t('common.cancel', 'Annuler')}
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!file || loading}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? '...' : t('grades.import.btn_import', 'Importer')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                                <p className="text-xs text-green-600 uppercase font-bold">{t('grades.import.created', 'Créés')}</p>
                                <p className="text-2xl font-bold text-green-700">{results.created}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                                <p className="text-xs text-blue-600 uppercase font-bold">{t('grades.import.updated', 'Mis à jour')}</p>
                                <p className="text-2xl font-bold text-blue-700">{results.updated}</p>
                            </div>
                        </div>

                        {results.errors && results.errors.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-bold text-red-600 mb-2">{t('grades.import.errors', 'Erreurs rencontrées')}:</p>
                                <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto border border-red-100 p-2 rounded bg-red-50">
                                    {results.errors.map((err: string, i: number) => (
                                        <li key={i}>• {err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                            >
                                {t('common.close', 'Fermer')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportGradesModal;
