import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Student, PaginatedResponse } from '../../types';
import studentService from '../../services/studentService';
import StudentFormModal from './StudentFormModal';
import StudentDetailModal from './StudentDetailsModal';

const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleDownloadIDCard = async (student: Student) => {
    try {
      const blob = await studentService.downloadIdCard(student.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `carte_etudiant_${student.student_id}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading ID card:', err);
      alert('Erreur lors du téléchargement de la carte');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedIds.length === 0) return;
    try {
      const blob = await studentService.downloadBulkIdCards(selectedIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cartes_etudiantes.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading bulk ID cards:', err);
      alert('Erreur lors du téléchargement groupé');
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(students.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Student>>('/students/', {
        params: {
          page: currentPage,
          search: searchTerm,
          status: statusFilter || undefined,
        },
      });
      setStudents(response.data.results || []);
      setTotalCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      GRADUATED: 'bg-blue-100 text-blue-800 border-blue-200',
      SUSPENDED: 'bg-amber-100 text-amber-800 border-amber-200',
      DROPPED: 'bg-red-100 text-red-800 border-red-200',
    };
    const labelKey = `students.filters.${status.toLowerCase()}`;
    const label = t(labelKey, status);

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-100'}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('students.title', 'Gestion des Étudiants')}</h1>
          <p className="text-gray-500 mt-1">{t('students.subtitle', { count: totalCount, defaultValue: `${totalCount} étudiants au total` })}</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDownload}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5 rtl:mirror" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('students.actions.download_cards', 'Télécharger Cartes')} ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => {
              setStudentToEdit(null);
              setShowCreateModal(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5 rtl:mirror" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('students.actions.new_student', 'Nouvel Étudiant')}
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t('students.search_placeholder', 'Rechercher par nom, matricule, email...')}
              className="w-full pl-12 pr-4 rtl:pr-12 rtl:pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">{t('students.filters.all_status', 'Tous les statuts')}</option>
            <option value="ACTIVE">{t('students.filters.active', 'Actif')}</option>
            <option value="GRADUATED">{t('students.filters.graduated', 'Diplômé')}</option>
            <option value="SUSPENDED">{t('students.filters.suspended', 'Suspendu')}</option>
            <option value="DROPPED">{t('students.filters.dropped', 'Abandonné')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-500 mt-4">Chargement des étudiants...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-start">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      onChange={toggleSelectAll}
                      checked={students.length > 0 && selectedIds.length === students.length}
                    />
                  </th>
                  <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('students.table.student', 'Étudiant')}
                  </th>
                  <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('students.table.program', 'Programme')}
                  </th>
                  <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('students.table.level', 'Niveau')}
                  </th>
                  <th className="px-6 py-4 text-start text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('students.table.status', 'Statut')}
                  </th>
                  <th className="px-6 py-4 text-end text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('students.table.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-500 text-lg">{t('students.empty.title', 'Aucun étudiant trouvé')}</p>
                      <p className="text-gray-400 text-sm mt-1">{t('students.empty.subtitle', 'Essayez de modifier vos critères de recherche')}</p>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={selectedIds.includes(student.id)}
                          onChange={() => toggleSelection(student.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md overflow-hidden">
                            {student.photo ? (
                              <img src={student.photo} alt={student.user_full_name} className="w-full h-full object-cover" />
                            ) : (
                              student.user_full_name?.charAt(0).toUpperCase() || 'E'
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{student.user_full_name}</p>
                            <p className="text-sm text-gray-500">{student.student_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {student.program_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {student.level_display || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setStudentToEdit(student);
                              setShowCreateModal(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Modifier">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDownloadIDCard(student)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Carte d'étudiant"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm2 4a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50">
          <span className="text-sm text-gray-600">
            {t('common.showing', { current: students.length, total: totalCount, defaultValue: `Affichage de ${students.length} sur ${totalCount} étudiants` })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('common.prev', 'Précédent')}
            </button>
            <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={students.length < 20}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {t('common.next', 'Suivant')}
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Create Student Modal */}
      {showCreateModal && (
        <StudentFormModal
          student={studentToEdit}
          onClose={() => {
            setShowCreateModal(false);
            setStudentToEdit(null);
          }}
          onSuccess={() => {
            fetchStudents();
            setShowCreateModal(false);
            setStudentToEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentsPage;
