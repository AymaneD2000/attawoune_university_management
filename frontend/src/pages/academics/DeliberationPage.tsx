import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import universityService from '../../services/universityService';
import { Program, AcademicYear } from '../../types';

const DeliberationPage: React.FC = () => {
    const { t } = useTranslation();
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);
    const [hasExistingResults, setHasExistingResults] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const fetchResults = useCallback(async () => {
        try {
            const response = await api.get('/academics/deliberation/results/', {
                params: {
                    academic_year_id: selectedYear,
                    program_id: selectedProgram
                }
            });
            if (response.data.count > 0) {
                setResults(response.data.results);
                setHasExistingResults(true);
            } else {
                setResults([]);
                setHasExistingResults(false);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
        }
    }, [selectedYear, selectedProgram]);

    useEffect(() => {
        if (selectedYear && selectedProgram) {
            fetchResults();
        } else {
            setResults([]);
            setHasExistingResults(false);
        }
    }, [selectedYear, selectedProgram, fetchResults]);

    const loadData = async () => {
        try {
            const [yearsRes, programsRes] = await Promise.all([
                universityService.getAcademicYears(),
                universityService.getPrograms()
            ]);
            setAcademicYears(yearsRes.results);
            setPrograms(programsRes.results);

            // Set current year as default
            const current = yearsRes.results.find(y => y.is_current);
            if (current) setSelectedYear(current.id.toString());
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };



    const handleDeliberation = async () => {
        if (!selectedYear || !selectedProgram) return;

        if (hasExistingResults) {
            if (!window.confirm(t('deliberation.confirm_reprocess', 'Cette délibération a déjà été effectuée. Voulez-vous vraiment la relancer ?\nCela mettra à jour les décisions existantes.'))) {
                return;
            }
        }

        setProcessing(true);
        // Don't clear results immediately to avoid flicker if just updating
        if (!hasExistingResults) setResults([]);

        try {
            const response = await api.post('/academics/deliberation/process/', {
                academic_year_id: parseInt(selectedYear),
                program_id: parseInt(selectedProgram)
            });
            setResults(response.data.results);
            setHasExistingResults(true);
        } catch (error) {
            console.error('Error processing deliberation:', error);
            alert(t('deliberation.error_processing', 'Erreur lors de la délibération'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">{t('deliberation.title', 'Délibération Annuelle')}</h1>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('deliberation.labels.academic_year', 'Année Académique')}</label>
                        <select
                            value={selectedYear}
                            disabled
                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                        >
                            {academicYears.filter(y => y.is_current).map(year => (
                                <option key={year.id} value={year.id}>{year.name} ({t('common.current', 'En cours')})</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">{t('deliberation.current_year_only', 'La délibération ne peut être effectuée que pour l\'année en cours')}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('deliberation.labels.program', 'Programme')}</label>
                        <select
                            value={selectedProgram}
                            onChange={(e) => setSelectedProgram(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">{t('common.select', 'Sélectionner...')}</option>
                            {programs.map(prog => (
                                <option key={prog.id} value={prog.id}>{prog.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleDeliberation}
                        disabled={!selectedYear || !selectedProgram || processing}
                        className={`px-4 py-2 rounded-lg text-white font-medium ${
                            !selectedYear || !selectedProgram || processing
                                ? 'bg-gray-400 cursor-not-allowed'
                                : hasExistingResults
                                    ? 'bg-yellow-600 hover:bg-yellow-700'
                                    : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                    >
                        {processing
                            ? t('deliberation.buttons.processing', 'Traitement en cours...')
                            : hasExistingResults
                                ? t('deliberation.buttons.reprocess', 'Relancer la délibération')
                                : t('deliberation.buttons.process', 'Lancer la délibération')
                        }
                    </button>
                </div>
                {hasExistingResults && (
                   <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200">
                       <strong>Info:</strong> {t('deliberation.already_processed', 'La délibération a déjà été effectuée pour ce programme. Vous pouvez voir les résultats ci-dessous.')}
                   </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-lg font-bold">{t('deliberation.results_title', 'Résultats')}</h2>
                    </div>
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('deliberation.table.matricule', 'Matricule')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('deliberation.table.student', 'Étudiant')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase rtl:text-left">{t('deliberation.table.annual_gpa', 'Moyenne Annuelle')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('deliberation.table.decision', 'Décision')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase rtl:text-right">{t('deliberation.table.info', 'Info')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {results.map((result, index) => (
                                <tr key={index} className={result.error ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 font-mono text-sm">{result.matricule || '-'}</td>
                                    <td className="px-6 py-4 font-medium">{result.student}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold rtl:text-left">
                                        {result.annual_gpa ? parseFloat(result.annual_gpa).toFixed(2) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {result.error ? (
                                            <span className="text-red-600 text-sm">{result.error}</span>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${result.decision === 'Admis(e)' || result.decision === 'Admis' || result.decision === 'PROMOTED'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {result.decision}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {result.next_level && (
                                            <span className="font-medium">
                                                Vers {result.next_level}
                                            </span>
                                        )}
                                        {result.remarks && result.remarks !== (result.next_level && `Admis en ${result.next_level}`) && (
                                            <span className="block text-xs mt-1">{result.remarks}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DeliberationPage;
