import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { gradesService, StudentGradeHistory } from '../../services/gradesService';
import { Student } from '../../types';

interface StudentGradesViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
}

const StudentGradesViewModal: React.FC<StudentGradesViewModalProps> = ({ isOpen, onClose, student }) => {
    const { t } = useTranslation();
    const [history, setHistory] = useState<StudentGradeHistory | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await gradesService.getStudentHistory(student.id);
            setHistory(data);
        } catch (err) {
            console.error('Error fetching student history:', err);
        } finally {
            setLoading(false);
        }
    }, [student.id]);

    useEffect(() => {
        if (isOpen && student) {
            fetchHistory();
        }
    }, [isOpen, student, fetchHistory]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">{student.user_full_name}</h2>
                        <p className="text-indigo-100 text-sm">{student.student_id} • {student.program_name}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors font-bold text-xl">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : history ? (
                        <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('grades.history.avg', 'Moyenne')}</p>
                                    <p className="text-2xl font-bold text-indigo-700">{history.stats.avg_score?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('grades.history.best', 'Meilleure note')}</p>
                                    <p className="text-2xl font-bold text-green-600">{history.stats.max_score || '0.00'}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('grades.history.exams', 'Examens')}</p>
                                    <p className="text-2xl font-bold text-purple-600">{history.stats.total_exams}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('grades.history.absences', 'Absences')}</p>
                                    <p className="text-2xl font-bold text-red-500">{history.stats.absences}</p>
                                </div>
                            </div>

                            {/* Detailed Grades Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('grades.labels.course', 'Cours')}</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('grades.labels.eval_type', 'Type')}</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">{t('grades.table.score', 'Note')}</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.date', 'Date')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {history.grades.map((grade) => (
                                            <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-800">{grade.course_name}</p>
                                                    <p className="text-xs text-gray-500">{grade.course_code}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                                        {grade.exam_type_display}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-lg font-bold ${parseFloat(grade.score) >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                                                        {grade.is_absent ? 'ABS' : grade.score}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-normal"> / {grade.max_score}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(grade.graded_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {history.grades.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                                    {t('grades.history.no_data', 'Aucune donnée trouvée')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            {t('grades.history.no_data', 'Aucune donnée trouvée')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentGradesViewModal;
