import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Student } from '../../types';

interface StudentDetailModalProps {
    student: Student;
    onClose: () => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'enrollments' | 'grades' | 'attendance' | 'bulletins' | 'finance' | 'idcard'>('info');
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [grades, setGrades] = useState<any>({ exam_grades: { results: [] }, course_grades: { results: [] } });
    const [attendanceStats, setAttendanceStats] = useState<any>(null);
    const [reportCards, setReportCards] = useState<any[]>([]);
    const [financialStatement, setFinancialStatement] = useState<any>(null);
    const [idCardUrl, setIdCardUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!student?.id) return;
        setLoading(true);
        try {
            if (activeTab === 'enrollments') {
                const res = await api.get(`/students/${student.id}/enrollments/`);
                setEnrollments(res.data.results || []);
            } else if (activeTab === 'grades') {
                const res = await api.get(`/students/${student.id}/grades/`);
                setGrades(res.data);
            } else if (activeTab === 'attendance') {
                const res = await api.get(`/students/${student.id}/attendance_stats/`);
                setAttendanceStats(res.data);
            } else if (activeTab === 'bulletins') {
                const res = await api.get('/academics/report-cards/', {
                    params: { student: student.id }
                });
                setReportCards(res.data.results || []);
            } else if (activeTab === 'finance') {
                const res = await api.get('/finance/student-balances/statement/', {
                    params: { student_id: student.id }
                });
                setFinancialStatement(res.data);
            } else if (activeTab === 'idcard') {
                // Use imported studentService if available, otherwise direct api call. 
                // Since I cannot easily add import here without checking if it exists, I'll use direct API for now or partial import.
                // Actually StudentDetailsModal doesn't import studentService yet. I should use api.
                const response = await api.get(`/students/${student.id}/generate_id_card/`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                setIdCardUrl(url);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [student?.id, activeTab]);

    useEffect(() => {
        if (activeTab !== 'info') {
            fetchData();
        }
    }, [activeTab, fetchData]);

    const downloadReportCard = async (id: number) => {
        window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/academics/report-cards/${id}/download_pdf/`, '_blank');
    };

    const downloadStatement = async () => {
        window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/finance/student-balances/download_statement/?student_id=${student.id}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                {student.user_full_name?.charAt(0).toUpperCase() || 'E'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{student.user_full_name}</h2>
                                <p className="text-white/80">{student.student_id}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b">
                    <div className="flex overflow-x-auto">
                        {(['info', 'enrollments', 'grades', 'attendance', 'bulletins', 'finance', 'idcard'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {{
                                    info: 'Informations',
                                    enrollments: 'Inscriptions',
                                    grades: 'Notes',
                                    attendance: 'Présence',
                                    bulletins: 'Bulletins',
                                    finance: 'Finances',
                                    idcard: "Carte d'étudiant"
                                }[tab]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'info' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InfoCard label="Programme" value={student.program_name || 'N/A'} />
                                    <InfoCard label="Niveau" value={student.level_display || 'N/A'} />
                                    <InfoCard label="Statut" value={student.status || 'N/A'} />
                                    <InfoCard label="Date d'inscription" value={student.enrollment_date || 'N/A'} />
                                </div>
                            )}

                            {activeTab === 'enrollments' && (
                                <div className="space-y-4">
                                    {enrollments.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">Aucune inscription trouvée</p>
                                    ) : (
                                        enrollments.map((enrollment: any, index: number) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-xl">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <p className="font-semibold">{enrollment.program_name}</p>
                                                        <p className="text-sm text-gray-500">{enrollment.academic_year_name}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm ${enrollment.status === 'ENROLLED' ? 'bg-green-100 text-green-800' :
                                                        enrollment.status === 'PROMOTED' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {enrollment.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'grades' && (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold mb-3">Notes d'examens</h4>
                                        {grades.exam_grades?.results?.length ? (
                                            <div className="space-y-2">
                                                {grades.exam_grades.results.map((grade: any, index: number) => (
                                                    <div key={index} className="p-3 bg-gray-50 rounded-lg flex justify-between">
                                                        <span>{grade.exam_display || 'Examen'}</span>
                                                        <span className={`font-bold ${grade.score >= 10 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {grade.score}/20
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">Aucune note d'examen trouvée</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'attendance' && attendanceStats && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <StatBox label="Total Sessions" value={attendanceStats.statistics?.total_sessions || 0} color="gray" />
                                        <StatBox label="Présent" value={attendanceStats.statistics?.present || 0} color="green" />
                                        <StatBox label="Absent" value={attendanceStats.statistics?.absent || 0} color="red" />
                                        <StatBox label="En retard" value={attendanceStats.statistics?.late || 0} color="yellow" />
                                    </div>
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                                        <p className="text-white/80">Taux de présence</p>
                                        <p className="text-4xl font-bold">{attendanceStats.statistics?.attendance_rate || 0}%</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bulletins' && (
                                <div className="space-y-4">
                                    {reportCards.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 mb-2">Aucun bulletin disponible</p>
                                            <button className="text-primary-600 hover:underline" onClick={fetchData}>Actualiser</button>
                                        </div>
                                    ) : (
                                        reportCards.map((rc, index) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{rc.semester_name}</h4>
                                                    <p className="text-sm text-gray-500">Moyenne: <span className="font-bold">{rc.gpa}/20</span></p>
                                                    <p className="text-xs text-gray-400">Généré le: {new Date(rc.generated_at).toLocaleDateString()}</p>
                                                </div>
                                                <button
                                                    onClick={() => downloadReportCard(rc.id)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                    title="Télécharger PDF"
                                                >
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'finance' && financialStatement && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <StatBox label="Total Dû" value={financialStatement.total_due} color="gray" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <StatBox label="Total Payé" value={financialStatement.total_paid} color="green" />
                                            <StatBox label="Reste à Payer" value={financialStatement.balance} color={financialStatement.balance > 0 ? "red" : "green"} />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-lg">Historique des transactions</h3>
                                            <button
                                                onClick={downloadStatement}
                                                className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Télécharger Relevé
                                            </button>
                                        </div>

                                        {financialStatement.transactions && financialStatement.transactions.length > 0 ? (
                                            <div className="space-y-3">
                                                {financialStatement.transactions.map((trans: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {trans.payment_method}
                                                                <span className="text-gray-400 text-xs ml-2">#{trans.transaction_id || '-'}</span>
                                                            </p>
                                                            <p className="text-xs text-gray-500">{new Date(trans.date).toLocaleDateString()}</p>
                                                        </div>
                                                        <span className="font-bold font-mono">{parseFloat(trans.amount).toLocaleString()} FCFA</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">Aucune transaction</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'idcard' && (
                                <div className="space-y-6 flex flex-col items-center">
                                    <h3 className="text-xl font-bold text-gray-900">Carte d'Étudiant</h3>
                                    {idCardUrl ? (
                                        <>
                                            <div className="shadow-lg rounded-xl overflow-hidden border border-gray-200">
                                                <img src={idCardUrl} alt="Carte d'étudiant" className="max-w-md w-full h-auto" />
                                            </div>
                                            <a
                                                href={idCardUrl}
                                                download={`carte_etudiant_${student.student_id}.png`}
                                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-md transition-all hover:scale-105"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Télécharger la carte
                                            </a>
                                        </>
                                    ) : (
                                        <p className="text-gray-500">Chargement de la carte...</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
    </div>
);

const StatBox: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
    const colorClasses: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-800',
        green: 'bg-emerald-100 text-emerald-800',
        red: 'bg-red-100 text-red-800',
        yellow: 'bg-amber-100 text-amber-800',
    };
    return (
        <div className={`p-4 rounded-xl ${colorClasses[color]}`}>
            <p className="text-sm opacity-80">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
};

export default StudentDetailModal;
